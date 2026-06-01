"""Normalize the alpha channel of every extracted product photo in
public/devices/ so each image renders as a clean cutout against the
3D scene's dark background.

Usage:
    python3 scripts/remove-backgrounds.py
    python3 scripts/remove-backgrounds.py --only img-5ada38fb4a,img-8cb7938ed5

The brochure embeds two flavors of product imagery:

  1. Pre-cut PNGs with a real alpha channel (most large devices —
     Boards, Desks, Room Kits, etc.). The alpha is already perfect; we
     just trim the transparent padding so billboards scale to the
     visible product, not the whole canvas. Re-running rembg on these
     destroys thin features like the chrome floor-stand legs because
     the U^2-Net mask is coarser than the source.

  2. Flat RGB images on a white page background (most accessories —
     headsets, phones, mics). For these we run rembg/U^2-Net and then
     a deterministic "white-key flood fill" backstop that recovers any
     thin/low-contrast structurally-attached feature rembg dropped
     (e.g. the bottom grill of the Desk Pro G2). harden_alpha then
     promotes any soft mid-alpha rim to fully opaque so dark bezels
     don't render as ghostly translucent frames against the scene.

Re-running is safe — each image is read, processed, and written back
in place.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
from scipy import ndimage


# u2netp is the lighter (~4MB) variant — quality is plenty for product
# shots and avoids a 170MB model download on the first run.
MODEL = "u2netp"
PADDING_PX = 6

# A source image is treated as "already cut out" when at least this
# fraction of pixels are fully transparent (alpha <= 4).
NATIVE_ALPHA_TRANSPARENT_PCT = 0.01

# Pixels brighter than this (min of RGB) are candidates for the "white
# page background" flood fill on white-bg sources. The brochure pages
# are pure white (~252-255 across channels). Setting the threshold
# high means metallic specular highlights on chrome (~240-248) stay
# classified as foreground.
WHITE_TOL = 250

# Morphological closing radius (in pixels) applied to the white-key
# foreground mask. Closes small gaps caused by very bright specular
# highlights so a leg's bright spot doesn't disconnect the leg shaft
# from its foot.
CLOSE_RADIUS = 2

# Alpha hardening thresholds (out of 255). Pixels darker than LOW are
# discarded entirely (background). Pixels between LOW and HIGH form
# the soft anti-aliased rim and ramp linearly. Pixels brighter than
# HIGH are forced to fully opaque so dark device bezels with low
# mask-confidence don't render as ghostly translucent frames against
# the dark scene.
#
# The transition band is intentionally wide (4..180): a narrow band
# (e.g. 16..40) crushes the natural anti-aliased rim on curved
# silhouettes (headset arches, organic shapes) into a hard binary
# mask, producing visibly stair-stepped/jagged edges. With the wider
# band, mid-alpha bezel pixels (alpha 30-80) still get mapped well
# above 128 — preserving the soft-bezel rescue — while the soft 1-3 px
# anti-aliased rim that defines curved silhouettes survives. We then
# apply a small gaussian blur to the alpha channel (RGB untouched) to
# reintroduce smooth pixel-boundary anti-aliasing after the .point()
# remap.
ALPHA_LOW = 4
ALPHA_HIGH = 180
ALPHA_BLUR_RADIUS = 0.6

# Per-image opt-in for "hole-punch enclosed dark silhouette" pass.
# The brochure's multi-ear-cup headset shots include a black "hidden
# head" prop inside the headband arch. The prop is fully enclosed by
# the headset silhouette, so the white-key flood fill (which can only
# remove near-white that connects to the image edge) leaves it
# untouched. This per-image opt-in punches the prop out by area-
# gating connected components of opaque-near-black pixels.
#
# Note: img-976ab4d643 (Headset 900 / B&O) is photographed differently
# — it shows the earbuds in a charging case with no head prop — so it
# is intentionally not listed here.
HOLE_PUNCH: dict[str, dict[str, float]] = {
    # stem (no extension)  → params dict
    "img-5ada38fb4a": {"min_area_pct": 0.04},  # Headset 520
    "img-bf6dfa019e": {"min_area_pct": 0.04},  # Headset 560
    "img-8cb7938ed5": {"min_area_pct": 0.04},  # Headset 730 (twin)
}
HOLE_PUNCH_BLACK_TOL = 30  # RGB.min() < this counts as "deep black"
HOLE_PUNCH_OPAQUE_TOL = 200  # alpha >= this is "fully opaque foreground"


def has_native_alpha(img: Image.Image) -> bool:
    """True if the source image already carries a meaningful cutout
    alpha channel (i.e. it's a pre-cut PNG, not a white-bg JPEG)."""
    if img.mode not in ("RGBA", "LA", "PA"):
        return False
    rgba = img.convert("RGBA")
    a = np.asarray(rgba)[:, :, 3]
    return (a <= 4).mean() >= NATIVE_ALPHA_TRANSPARENT_PCT


def harden_alpha(img: Image.Image) -> Image.Image:
    """Promote moderately-transparent mask pixels to fully opaque while
    keeping the true ~1px anti-aliased silhouette rim. Used on rembg
    output, where U^2-Net commonly returns soft mid-alpha for dark
    bezels which renders as ghostly translucent frames on dark
    backgrounds.

    The wide LOW..HIGH transition band preserves the natural
    anti-aliased rim on curved silhouettes, and a small gaussian blur
    on the alpha channel (RGB untouched) smooths pixel-boundary jaggies
    introduced by the linear remap on already-discrete alpha values.
    """
    r, g, b, a = img.split()
    span = ALPHA_HIGH - ALPHA_LOW
    a = a.point(
        lambda p: 0 if p < ALPHA_LOW
        else (255 if p > ALPHA_HIGH else int(255 * (p - ALPHA_LOW) / span))
    )
    if ALPHA_BLUR_RADIUS > 0:
        a = a.filter(ImageFilter.GaussianBlur(radius=ALPHA_BLUR_RADIUS))
    return Image.merge("RGBA", (r, g, b, a))


def white_key_foreground(rgba: Image.Image) -> np.ndarray:
    """Deterministic backstop for thin/low-contrast features that
    rembg drops on white-bg sources.

    The brochure pages are uniform white, so any near-white pixel that
    is connected via flood fill to an image edge is *definitely*
    background. Everything else is foreground. The result is post-
    processed with a small morphological close to bridge tiny gaps
    where a bright specular highlight on a chrome leg can disconnect
    the leg shaft from its foot.

    Returns a (H, W) bool array where True = foreground.
    """
    arr = np.asarray(rgba.convert("RGB"))
    near_white = arr.min(axis=2) >= WHITE_TOL  # H x W
    labels, _ = ndimage.label(near_white)
    edge_ids: set[int] = set()
    edge_ids.update(int(v) for v in labels[0, :])
    edge_ids.update(int(v) for v in labels[-1, :])
    edge_ids.update(int(v) for v in labels[:, 0])
    edge_ids.update(int(v) for v in labels[:, -1])
    edge_ids.discard(0)
    if not edge_ids:
        return np.ones(arr.shape[:2], dtype=bool)
    bg = np.isin(labels, list(edge_ids))
    fg = ~bg
    if CLOSE_RADIUS > 0:
        struct = ndimage.generate_binary_structure(2, 2)
        fg = ndimage.binary_closing(fg, structure=struct,
                                    iterations=CLOSE_RADIUS)
    return fg


def union_alpha(rembg_out: Image.Image, src_rgba: Image.Image) -> Image.Image:
    """Final alpha = max(rembg's mask, white-key features that connect
    to it).

    rembg gives us soft semantic confidence which is great for shadow
    fade-outs; the white-key gives us a hard geometric truth for
    "anything not connected to the white page". We don't union them
    blindly — that would also rescue isolated watermarks/glyphs.
    Instead we keep only the connected components in the union mask
    that overlap with rembg's confident detection. Net effect: rembg
    defines what the device is, and the white-key fills in any thin
    structurally-attached part rembg dropped.
    """
    rembg_alpha = np.asarray(rembg_out.split()[-1])
    rembg_solid = rembg_alpha >= 128
    fg = white_key_foreground(src_rgba)
    union_mask = fg | rembg_solid
    structure = np.ones((3, 3), dtype=bool)  # 8-connectivity
    labels, _ = ndimage.label(union_mask, structure=structure)
    valid_ids = np.unique(labels[rembg_solid])
    valid_ids = valid_ids[valid_ids != 0]
    keep = np.isin(labels, valid_ids)
    rescued = np.where(keep, 255, 0).astype(np.uint8)
    combined = np.maximum(rembg_alpha, rescued)
    rgb = np.asarray(rembg_out.convert("RGBA"))[:, :, :3]
    return Image.fromarray(np.dstack([rgb, combined]).astype(np.uint8))


def trim_transparent(img: Image.Image) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    pad = PADDING_PX
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def punch_enclosed_dark(img: Image.Image, min_area_pct: float) -> Image.Image:
    """Remove large fully-enclosed near-black opaque regions from an
    RGBA image. Returns a new RGBA image.

    A pixel qualifies as "head prop" when:
      - RGB.min() < HOLE_PUNCH_BLACK_TOL (deep black, not charcoal)
      - alpha >= HOLE_PUNCH_OPAQUE_TOL  (opaque foreground)
      - the connected component does NOT touch any alpha<HOLE_PUNCH_OPAQUE_TOL
        pixel (i.e. it is fully enclosed by the headset silhouette)
      - the component's pixel count >= min_area_pct * total_image_area
    Such components have their alpha set to 0.
    """
    arr = np.asarray(img.convert("RGBA")).copy()
    rgb_min = arr[:, :, :3].min(axis=2)
    alpha = arr[:, :, 3]
    deep_black = rgb_min < HOLE_PUNCH_BLACK_TOL
    opaque = alpha >= HOLE_PUNCH_OPAQUE_TOL
    candidate = deep_black & opaque
    if not candidate.any():
        return img
    transparent_or_softrim = ~opaque
    # Dilate the not-opaque mask by 1 px so a candidate component is
    # considered "edge-touching" if it sits flush against any soft
    # rim / transparent pixel.
    struct = ndimage.generate_binary_structure(2, 2)
    border = ndimage.binary_dilation(transparent_or_softrim, structure=struct)
    labels, n = ndimage.label(candidate, structure=struct)
    if n == 0:
        return img
    total = arr.shape[0] * arr.shape[1]
    min_count = int(min_area_pct * total)
    punch_mask = np.zeros_like(candidate)
    for lab in range(1, n + 1):
        comp = labels == lab
        if comp.sum() < min_count:
            continue
        if border[comp].any():
            continue
        punch_mask |= comp
    if not punch_mask.any():
        return img
    arr[punch_mask, 3] = 0
    return Image.fromarray(arr, mode="RGBA")


def process_white_bg(src: Image.Image, session, punch_params=None) -> Image.Image:
    cut = remove(src, session=session)
    cut = union_alpha(cut, src)
    cut = harden_alpha(cut)
    if punch_params is not None:
        cut = punch_enclosed_dark(cut, **punch_params)
    return trim_transparent(cut)


def process_native_alpha(src: Image.Image, punch_params=None) -> Image.Image:
    """Native-alpha sources already have a perfect cutout — running
    rembg over them destroys thin features (e.g. chrome floor-stand
    legs) because U^2-Net's mask is coarser than the embedded alpha.
    Just trim the transparent padding."""
    rgba = src.convert("RGBA")
    if punch_params is not None:
        rgba = punch_enclosed_dark(rgba, **punch_params)
    return trim_transparent(rgba)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Normalize alpha for product photos in public/devices/.",
    )
    parser.add_argument(
        "--only",
        default=None,
        help=(
            "Comma-separated list of file stems (without extension) to "
            "restrict processing to. Default: process every img-*.webp."
        ),
    )
    args = parser.parse_args()

    only_stems: set[str] | None = None
    if args.only:
        only_stems = {s.strip() for s in args.only.split(",") if s.strip()}

    here = Path(__file__).resolve().parent
    dir_ = here.parent / "public" / "devices"
    files = sorted(dir_.glob("img-*.webp"))
    if only_stems is not None:
        files = [f for f in files if f.stem in only_stems]
        missing = only_stems - {f.stem for f in files}
        for stem in sorted(missing):
            print(f"  ! requested stem not found: {stem}", file=sys.stderr)
    if not files:
        print(f"no images found in {dir_}")
        return 1

    session = new_session(MODEL)
    before = 0
    after = 0
    native_count = 0
    rembg_count = 0
    punched_count = 0

    for i, f in enumerate(files, 1):
        before += f.stat().st_size
        try:
            src = Image.open(f)
            mode = src.mode
            punch_params = HOLE_PUNCH.get(f.stem)
            if has_native_alpha(src):
                cut = process_native_alpha(src, punch_params=punch_params)
                tag = "native"
                native_count += 1
            else:
                src_rgba = src.convert("RGBA")
                cut = process_white_bg(src_rgba, session, punch_params=punch_params)
                tag = "rembg "
                rembg_count += 1
            if punch_params is not None:
                punched_count += 1
            cut.save(f, "WEBP", quality=86, method=6, lossless=False)
        except Exception as e:
            print(f"  ! {f.name}: {e}", file=sys.stderr)
            continue
        after += f.stat().st_size
        punch_tag = " +punch" if punch_params is not None else ""
        print(f"  [{i:2d}/{len(files)}] [{tag}] {f.name}  "
              f"{src.size[0]}x{src.size[1]} -> "
              f"{cut.size[0]}x{cut.size[1]} ({mode}){punch_tag}")

    print()
    print(f"native-alpha (passthrough): {native_count}")
    print(f"rembg + white-key:          {rembg_count}")
    print(f"hole-punch applied:         {punched_count}")
    print(f"total: {before/1024:.0f} KB -> {after/1024:.0f} KB"
          f" (saved {(before-after)/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
