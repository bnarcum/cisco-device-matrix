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
            cut = remove(src, session=session)
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
