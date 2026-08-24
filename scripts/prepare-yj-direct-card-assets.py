from pathlib import Path
from PIL import Image

SOURCE = Path('/home/ubuntu/upload')
DEST = Path('/home/ubuntu/alexos-source/public/assets')
DEST.mkdir(parents=True, exist_ok=True)

# Original supplied product references only. These are cropped/optimized, not AI-generated.
assets = {
    'yj-direct-card-comfort.webp': ('Hee214c7d27c0492dbf6e7177a8cbdc7dp.png', (35, 35, 765, 765)),
    'yj-direct-card-storage.webp': ('c4e738f0-9f6f-11f1-8cc0-09ce44a380ee.jpg', (4, 4, 496, 296)),
    'yj-direct-card-everyday.webp': ('c274b250-9f6f-11f1-8cc0-09ce44a380ee.jpg', (4, 4, 496, 496)),
}

for output_name, (source_name, crop_box) in assets.items():
    with Image.open(SOURCE / source_name) as image:
        image = image.convert('RGB').crop(crop_box)
        image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
        image.save(DEST / output_name, 'WEBP', quality=88, method=6)
        print(output_name, image.size)
