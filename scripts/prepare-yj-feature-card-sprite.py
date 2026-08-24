from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/upload/file_000000005e648210a0ae544e90dc8862.png')
DEST = Path('/home/ubuntu/alexos-source/public/assets')
DEST.mkdir(parents=True, exist_ok=True)

with Image.open(SOURCE) as image:
    image = image.convert('RGB')
    # The supplied artwork is an 8-card 4x2 grid plus a trust strip.
    widths = [0, 384, 768, 1152, 1536]
    rows = [(0, 455), (455, 895)]
    index = 1
    for y0, y1 in rows:
        for column in range(4):
            x0, x1 = widths[column], widths[column + 1]
            # Remove only the outer white gutter; preserve the card artwork and text.
            crop = image.crop((x0 + 8, y0 + 8, x1 - 8, y1 - 8))
            crop.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            crop.save(DEST / f'yj-feature-card-{index:02d}.webp', 'WEBP', quality=86, method=6)
            print(index, crop.size)
            index += 1

# Preserve the supplied bottom trust strip as a separate visual proof band.
with Image.open(SOURCE) as image:
    strip = image.convert('RGB').crop((8, 895, 1528, 1016))
    strip.thumbnail((1600, 400), Image.Resampling.LANCZOS)
    strip.save(DEST / 'yj-feature-trust-strip.webp', 'WEBP', quality=86, method=6)
    print('trust', strip.size)
