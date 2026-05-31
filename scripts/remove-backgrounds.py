"""Remove the white page background from every extracted product photo
in public/devices/ using rembg (U^2-Net).

Run after extract-pdf-images.py + prune-images.py:

    python3 scripts/remove-backgrounds.py

Re-running is safe — images are read, processed and written back in
place. A small RGBA crop pass trims residual transparent padding so the
billboards in the scene scale to the visible product, not the page.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


# u2netp is the lighter (~4MB) variant — quality is plenty for product
# shots and avoids a 170MB model download on the first run.
MODEL = "u2netp"
PADDING_PX = 6

# Alpha hardening thresholds (out of 255). Pixels darker than LOW are
# discarded entirely (background). Pixels between LOW and HIGH form the
# soft anti-aliased rim and ramp linearly. Pixels brighter than HIGH are
# forced to fully opaque so dark device bezels with low mask-confidence
# don't render as ghostly translucent frames against the dark scene.
ALPHA_LOW = 16
ALPHA_HIGH = 40


def harden_alpha(img: Image.Image) -> Image.Image:
    """Promote moderately-transparent mask pixels to fully opaque while
    keeping the true ~1px anti-aliased silhouette rim."""
    r, g, b, a = img.split()
    span = ALPHA_HIGH - ALPHA_LOW
    a = a.point(
        lambda p: 0 if p < ALPHA_LOW
        else (255 if p > ALPHA_HIGH else int(255 * (p - ALPHA_LOW) / span))
    )
    return Image.merge("RGBA", (r, g, b, a))


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

    for i, f in enumerate(files, 1):
        before += f.stat().st_size
        try:
            src = Image.open(f).convert("RGBA")
            # Plain rembg (no alpha matting). With u2netp, low-contrast
            # bezels come back as soft mid-alpha which renders as ghosts
            # against the dark scene; harden_alpha promotes those mid
            # values to fully opaque while keeping the true 1-pixel
            # antialiased rim. Alpha matting was tried but over-eroded
            # thin metallic bezels (e.g. Desk Pro G2) and wiped them.
            cut = remove(src, session=session)
            cut = harden_alpha(cut)
            cut = trim_transparent(cut)
            # Re-encode as WebP with alpha. method=6 = best compression.
            cut.save(f, "WEBP", quality=86, method=6, lossless=False)
        except Exception as e:
            print(f"  ! {f.name}: {e}", file=sys.stderr)
            continue
        after += f.stat().st_size
        print(f"  [{i:2d}/{len(files)}] {f.name}  "
              f"{src.size[0]}x{src.size[1]} -> "
              f"{cut.size[0]}x{cut.size[1]}")

    print()
    print(f"total: {before/1024:.0f} KB -> {after/1024:.0f} KB")
    print(f"saved: {(before-after)/1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
