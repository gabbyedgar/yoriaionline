# Yoriai — より合い

Join the everyday life of Japan, hosted by the locals who live it. Marketing site
for Yoriai's Osaka launch: a multi-page Vite + TypeScript app with a Three.js
cinematic opening sequence built around a Blender-authored torii gate.

## Quick start

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

## Pages

| Page | Entry module | Interactivity |
| --- | --- | --- |
| `index.html` | `src/pages/home.ts` | cinematic intro, hero parallax tilt, live ticker, marquee, feed preview, waitlist form, card tilt |
| `browse.html` | `src/pages/browse.ts` | live search, category chips, three sort modes, empty state |
| `activity.html` | `src/pages/activity.ts` | detail rendered from `?id=`, request-to-join flow, reviews, participants |
| `faq.html` | `src/pages/faq.ts` | tabbed categories, accordion |
| `hosts.html` | `src/pages/hosts.ts` | founding-host application form |
| `how-it-works.html`, `safety.html`, `about.html`, `travelers.html` | `src/pages/page.ts` | shared chrome, scroll reveals |

Shared chrome (nav, footer, scroll reveals, brand marks via `data-torii`)
lives in `src/site.ts`; the activity dataset and card renderer in
`src/data/activities.ts`.

## Cinematic intro

`src/intro/intro.ts` runs once per session on the homepage (force it with
`/#intro`): particles assemble the brand mark, the Blender torii solidifies
inside it, lanterns and sakura rise, the camera passes through the gate past
vignettes of local life, and the final bloom dissolves into the site's washi
background — the page settles in underneath, no hard cut. Skippable any time
(button or Esc), honors `prefers-reduced-motion`, optional generative
soundscape (`src/intro/audio.ts`).

## 3D model (Blender)

`blender/torii_gate.py` builds the myōjin-style torii — curved kasagi with
upswept ends, shimaki, gakuzuka, penetrating nuki, daiwa capitals, tapered
inward-leaning pillars, stone bases — plus two kasuga lanterns with emissive
fireboxes, and exports `public/models/torii.glb` (~180 KB). Regenerate with:

```bash
pip install bpy
npm run model
```

## Favicons

`tools/make_favicons.py` renders the brand icon (ink torii on washi,
terracotta dot) to `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` and
the webmanifest icon set. Regenerate with:

```bash
pip install pillow
npm run icons
```
