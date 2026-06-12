"""
Generate the favicon set from the Yoriai brand mark (the attached app icon:
ink torii on warm washi, terracotta dot beneath the gate).

Run:  python3 tools/make_favicons.py   (requires `pip install pillow`)
"""
import os

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
BG = "#F2EDE9"
INK = "#1C1917"
TERRA = "#C9744E"

# brand mark geometry in its 60-unit viewBox: (x, y, w, h, corner-radius)
RECTS = [
    (13.0, 18.0, 4.5, 34.0, 2.25),   # pillar L
    (42.5, 18.0, 4.5, 34.0, 2.25),   # pillar R
    (9.0, 12.0, 42.0, 5.0, 2.5),     # kasagi
    (7.0, 14.5, 5.0, 3.5, 1.75),     # cap L
    (48.0, 14.5, 5.0, 3.5, 1.75),    # cap R
]
DOT = (30.0, 41.0, 3.5)  # cx, cy, r


def draw_mark(size: int, mark_ratio: float = 0.62) -> Image.Image:
    ss = 4  # supersample for clean edges
    s = size * ss
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)
    k = s * mark_ratio / 60.0
    ox = (s - 60 * k) / 2
    # mark is visually bottom-heavy; nudge up a touch
    oy = (s - 60 * k) / 2 - s * 0.012
    for x, y, w, h, r in RECTS:
        d.rounded_rectangle(
            [ox + x * k, oy + y * k, ox + (x + w) * k, oy + (y + h) * k],
            radius=r * k, fill=INK,
        )
    cx, cy, r = DOT
    d.ellipse(
        [ox + (cx - r) * k, oy + (cy - r) * k, ox + (cx + r) * k, oy + (cy + r) * k],
        fill=TERRA,
    )
    return img.resize((size, size), Image.LANCZOS)


def svg() -> str:
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{INK}"/>'
        for x, y, w, h, r in RECTS
    )
    cx, cy, r = DOT
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">'
        f'<rect width="60" height="60" fill="{BG}"/>'
        f'<g transform="translate(11.4 10.66) scale(0.62)">{rects}'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{TERRA}"/></g></svg>'
    )


os.makedirs(ROOT, exist_ok=True)
draw_mark(512).save(os.path.join(ROOT, "icon-512.png"))
draw_mark(192).save(os.path.join(ROOT, "icon-192.png"))
draw_mark(180, mark_ratio=0.66).save(os.path.join(ROOT, "apple-touch-icon.png"))
draw_mark(64, mark_ratio=0.78).save(
    os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
)
with open(os.path.join(ROOT, "favicon.svg"), "w") as f:
    f.write(svg())
with open(os.path.join(ROOT, "site.webmanifest"), "w") as f:
    f.write(
        '{\n'
        '  "name": "Yoriai",\n'
        '  "short_name": "Yoriai",\n'
        '  "description": "Join the everyday life of Japan, hosted by the locals who live it.",\n'
        '  "icons": [\n'
        '    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },\n'
        '    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }\n'
        '  ],\n'
        f'  "theme_color": "{BG}",\n'
        f'  "background_color": "{BG}",\n'
        '  "display": "standalone"\n'
        '}\n'
    )
print("favicons written to public/")
