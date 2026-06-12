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

`src/intro/intro.ts` plays on reloads and fresh entries to the homepage (a
refresh takes you back through the gateway); in-site navigation and
back/forward never replay it, `prefers-reduced-motion` opts out entirely, and
`/#intro` forces a replay. An inline pre-paint cover in `index.html`
guarantees the page never flashes before the overlay mounts. The sequence —
every transition carried by an origami crane, no hard cuts:

1. a red torii in mist, lanterns and drifting sakura; the camera dollies in
2. through the gate, dreamlike vignettes of local life pass by
3. paper fragments and petals gather and fold into a white origami crane
   (per-facet assembly of the Blender model in `src/intro/craneModel.ts`)
4. the camera follows the crane forward
5. the world transforms: lanterns become interface lights, streets become UI
   grid lines, architecture dissolves into glass panels, the fog turns washi
6. the scene's background dissolves to transparent and the real homepage
   constructs itself behind the canvas — nav first, then the hero
7. the crane circles once and lands on the hero perch
8. the page-side crane (`src/intro/heroCrane.ts`) takes over in a crossfade
   and stays as a living decoration with subtle idle motion

Skippable any time (button or Esc), honors `prefers-reduced-motion`,
optional generative soundscape (`src/intro/audio.ts`).

## 3D models (Blender)

- `blender/torii_gate.py` — myōjin-style torii (curved kasagi, shimaki,
  gakuzuka, nuki, daiwa, leaning pillars, stone bases) plus two kasuga
  lanterns with emissive fireboxes → `public/models/torii.glb`
- `blender/origami_crane.py` — faceted paper crane; wings are separate
  objects with origins on their fold hinges so the runtime flaps them with a
  plain rotation → `public/models/crane.glb`

Regenerate with:

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
