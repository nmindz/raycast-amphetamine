#!/usr/bin/env python3
"""Generate an original 512x512 extension icon (rounded tile + energy bolt).

Deliberately does NOT reuse Amphetamine.app's copyrighted artwork so the
extension is safe to publish to the Raycast Store.
"""
from PIL import Image, ImageDraw

SIZE = 512
RADIUS = 114  # macOS "squircle"-ish corner radius at 512

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Vertical gradient background (indigo -> violet), painted row by row.
top = (76, 29, 149)     # #4c1d95
bottom = (30, 27, 75)   # #1e1b4b
for y in range(SIZE):
    t = y / (SIZE - 1)
    r = round(top[0] + (bottom[0] - top[0]) * t)
    g = round(top[1] + (bottom[1] - top[1]) * t)
    b = round(top[2] + (bottom[2] - top[2]) * t)
    draw.line([(0, y), (SIZE, y)], fill=(r, g, b, 255))

# Mask to a rounded rectangle so corners are transparent.
mask = Image.new("L", (SIZE, SIZE), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], RADIUS, fill=255)
img.putalpha(mask)

# Energy bolt (keep-awake motif), warm amber, centered.
bolt = [
    (300, 96),
    (196, 288),
    (262, 288),
    (212, 416),
    (340, 224),
    (268, 224),
]
shadow = [(x + 6, y + 8) for (x, y) in bolt]
ImageDraw.Draw(img).polygon(shadow, fill=(0, 0, 0, 70))
ImageDraw.Draw(img).polygon(bolt, fill=(251, 191, 36, 255))  # #fbbf24

img.save("assets/extension-icon.png")
print("wrote assets/extension-icon.png", img.size)
