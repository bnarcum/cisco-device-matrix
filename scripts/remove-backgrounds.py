"""Normalize the alpha channel of every extracted product photo in
public/devices/ so each image renders as a clean cutout against the
3D scene's dark background.

Usage:
    python3 scripts/remove-backgrounds.py

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

import sys
from pathlib import Path

import numpy as np
from PIL import Image
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
ALPHA_LOW = 16
ALPHA_HIGH = 40


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
    backgrounds."""
    r, g, b, a = img.split()
    span = ALPHA_HIGH - ALPHA_LOW
    a = a.point(
        lambda p: 0 if p < ALPHA_LOW
        else (255 if p > ALPHA_HIGH else int(255 * (p - ALPHA_LOW) / span))
    )
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


def process_white_bg(src: Image.Image, session) -> Image.Image:
    cut = remove(src, session=session)
    cut = union_alpha(cut, src)
    cut = harden_alpha(cut)
    return trim_transparent(cut)


def process_native_alpha(src: Image.Image) -> Image.Image:
    """Native-alpha sources already have a perfect cutout — running
    rembg over them destroys thin features (e.g. chrome floor-stand
    legs) because U^2-Net's mask is coarser than the embedded alpha.
    Just trim the transparent padding."""
    rgba = src.convert("RGBA")
    return trim_transparent(rgba)


def main() -> int:
    here = Path(__file__).resolve().parent
    dir_ = here.parent / "public" / "devices"
    files = sorted(dir_.glob("img-*.webp"))
    if not files:
        print(f"no images found in {dir_}")
        return 1

    session = new_session(MODEL)
    before = 0
    after = 0
    native_count = 0
    rembg_count = 0

    for i, f in enumerate(files, 1):
        before += f.stat().st_size
        try:
            src = Image.open(f)
            mode = src.mode
            if has_native_alpha(src):
                cut = process_native_alpha(src)
                tag = "native"
                native_count += 1
            else:
                src_rgba = src.convert("RGBA")
                cut = process_white_bg(src_rgba, session)
                tag = "rembg "
                rembg_count += 1
            cut.save(f, "WEBP", quality=86, method=6, lossless=False)
        except Exception as e:
            print(f"  ! {f.name}: {e}", file=sys.stderr)
            continue
        after += f.stat().st_size
        print(f"  [{i:2d}/{len(files)}] [{tag}] {f.name}  "
              f"{src.size[0]}x{src.size[1]} -> "
              f"{cut.size[0]}x{cut.size[1]} ({mode})")

    print()
    print(f"native-alpha (passthrough): {native_count}")
    print(f"rembg + white-key:          {rembg_count}")
    print(f"total: {before/1024:.0f} KB -> {after/1024:.0f} KB"
          f" (saved {(before-after)/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
