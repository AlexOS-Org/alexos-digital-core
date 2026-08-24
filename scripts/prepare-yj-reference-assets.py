from pathlib import Path
from PIL import Image, ImageOps

SOURCE = Path('/home/ubuntu/upload')
DEST = Path('/home/ubuntu/alexos-source/public/assets')
DEST.mkdir(parents=True, exist_ok=True)

# Preserve the supplied feature diagrams and product details; only remove tiny
# outer margins where the source image has them. No generated product content.
assets = {
    'yj-reference-back-comfort.webp': ('c7f58a60-9f6f-11f1-8cc0-09ce44a380ee.jpg', (8, 8, 792, 792)),
    'yj-reference-device-compartment.webp': ('c4e738f0-9f6f-11f1-8cc0-09ce44a380ee.jpg', (4, 4, 496, 296)),
    'yj-reference-strap-buckle.webp': ('c274b250-9f6f-11f1-8cc0-09ce44a380ee.jpg', (4, 4, 496, 496)),
    'yj-reference-zipper-base.webp': ('bfb87880-9f6f-11f1-8cc0-09ce44a380ee.jpg', (0, 0, 257, 500)),
}

for output_name, (source_name, crop_box) in assets.items():
    source_path = SOURCE / source_name
    with Image.open(source_path) as image:
        image = image.convert('RGB').crop(crop_box)
        image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
        image.save(DEST / output_name, 'WEBP', quality=86, method=6)
        print(output_name, image.size)
