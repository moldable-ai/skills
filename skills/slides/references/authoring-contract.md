# Slide Authoring Contract

This is the exact contract for what you author versus what the Slides app
injects. Get this right and your slides render identically in the live preview
and the published artifact.

## What the app injects (never write these yourself)

For every deck, the app composes a full HTML document containing, in order:

1. `<head>` with your `theme.fontLinks` as `<link rel="stylesheet">`.
2. A `<style>` block: `* { box-sizing }`, your `theme.stageBg` as `--stage-bg`,
   then the **fixed-stage base CSS**, then the **deck base CSS** (enter
   animations + `.reveal` stagger + chrome + notes), then **your `theme.css`**.
3. `<body>` → `.deck-viewport` → `.deck-stage#deckStage` containing one
   `<section class="slide …" data-transition="…" data-notes="…">` per slide,
   with your `bodyHtml` inside.
4. The deck chrome (progress bar + counter), a hidden speaker-notes panel, and
   the controller `<script>`.

So: **never** include `<html>`, `<head>`, `<body>`, the `.deck-viewport` /
`.deck-stage` wrappers, the `.slide` section tag, the fixed-stage base CSS, the
navigation controller, or stage-scaling JS. Authoring those will conflict with
what the app injects.

The exact injected CSS is the app's, not this skill's — read it from the source
of truth if you need it: `src/shared/render.ts` (`VIEWPORT_BASE_CSS`,
`DECK_BASE_CSS`) and `src/shared/templates/types.ts` (`BASE_COMPONENTS_CSS`,
`COMPONENT_VOCABULARY`). Don't paste any of it into a theme.

## What you author

### `theme.fontLinks: string[]`

`https://` stylesheet URLs only. Fontshare and Google Fonts. Example:

```
https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap
```

### `theme.stageBg: string`

The letterbox color shown around the stage (usually matches the slide
background). e.g. `#0a0a12`.

### `theme.css: string`

Deck-wide CSS. Put here:

- `:root { … }` custom properties for colors, fonts, sizes (authored at
  1920×1080 scale, e.g. `--title-size: 148px`).
- A rule that paints the slide surface, e.g.
  `.slide { background: …; color: var(--text); font-family: var(--body); }`
  (the base `.slide` already handles positioning/visibility — you only style
  its look).
- Your own layout classes (`.pad`, `.grid`, `.card`, `.row`, …) and any
  `@keyframes` you need.

Do **not** put the fixed-stage base CSS, the `.reveal` rules, or the chrome here
— those already exist. You may add extra `.reveal:nth-child` delays if a slide
needs more than 8 staggered children.

### Per slide

| Field | Meaning |
| ----- | ------- |
| `name` | Short outline label shown in the rail (e.g. "Problem"). Not rendered on the slide. |
| `bodyHtml` | Inner HTML of the slide section, laid out at 1920×1080. |
| `slideClass` | Extra classes on the section (e.g. `title-slide`). Only `[A-Za-z0-9_-]` tokens survive sanitization. |
| `transition` | Enter animation: `fade` (default), `slide`, `zoom`, or `none`. |
| `notes` | Speaker notes. Shown in present mode via `s`; never on the slide. |

## Animation conventions

- Add `class="reveal"` to elements that should rise + fade in when the slide
  becomes active. Direct children stagger automatically (1st ~0.10s … 8th
  ~0.66s). Order your reveal elements as direct children of a flex column for a
  clean cascade.
- Pick `transition` per slide for the whole-slide enter feel (`zoom` reads as
  confident for titles; `slide` for sequential content; `fade` is the safe
  default).
- Keep motion CSS-only. `prefers-reduced-motion` is already handled.

## Worked example (one slide)

`theme`:

```json
{
  "fontLinks": ["https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap"],
  "stageBg": "#0a0a12",
  "css": ":root{--slide-bg:#0a0a12;--text:#f5f3ff;--muted:#a8a3c7;--accent:#b89bff;--display:'Clash Display',sans-serif;--body:'Satoshi',sans-serif}.slide{background:linear-gradient(160deg,#1b1140,#0a0a12);color:var(--text);font-family:var(--body)}.pad{position:absolute;inset:0;padding:120px 140px;display:flex;flex-direction:column;justify-content:center}h1{font-family:var(--display);font-weight:700;font-size:148px;line-height:0.98;letter-spacing:-0.02em}.sub{font-size:40px;color:var(--muted);margin-top:40px}"
}
```

slide:

```json
{
  "name": "Title",
  "slideClass": "title-slide",
  "transition": "zoom",
  "notes": "Open with the one-line promise.",
  "bodyHtml": "<div class=\"pad\"><h1 class=\"reveal\">Decks that feel designed.</h1><p class=\"sub reveal\">Describe what you want in chat. Get a beautiful, animated deck.</p></div>"
}
```

The seeded "Welcome to Slides" deck (in the app on first run) is a complete,
production-quality example of this contract — read it from
`apps/slides/data/decks/<id>.json` if you want a full reference deck.

## Density quick rules

- **Low / speaker-led:** one idea per slide, huge type, 1–3 reveal lines, lots
  of negative space, more slides. Favor statement/quote/section-beat slides.
- **High / reading-first:** structured grids, comparison tables, annotated
  diagrams, 4–8 concise items, strong hierarchy so it still feels designed. If a
  slide starts to overflow, split it.
