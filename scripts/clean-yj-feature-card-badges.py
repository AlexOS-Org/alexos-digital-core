from pathlib import Path
from PIL import Image, ImageDraw

root = Path('/home/ubuntu/alexos-source/public/assets')
for index in range(1, 9):
    card_id = f'{index:02d}'
    source = root / f'yj-feature-card-{card_id}.webp'
    target = root / f'yj-feature-card-{card_id}-clean.webp'
    image = Image.open(source).convert('RGB')
    draw = ImageDraw.Draw(image)
    w, h = image.size
    badge_w = max(94, round(w * 0.09))
    badge_h = max(92, round(h * 0.15))
    if index == 2:
        # Rebuild the small red-to-white background behind the badge.
        top = (250, 249, 249)
        bottom = (236, 62, 67)
        for y in range(badge_h):
            t = y / max(1, badge_h - 1)
            colour = tuple(round(top[i] * (1-t) + bottom[i] * t) for i in range(3))
            draw.line((0, y, badge_w, y), fill=colour)
    else:
        draw.rectangle((0, 0, badge_w, badge_h), fill=(255, 255, 255))
    image.save(target, 'WEBP', quality=86, method=6)
    print(target.name, image.size, target.stat().st_size)

if __name__ == '__main__':
    pass
