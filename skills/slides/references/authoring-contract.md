# Slides & Artifacts Authoring Contract

This is the contract for what you author versus what Slides or Artifacts injects.
Decks share the same renderer in both apps. Artifacts also supports full pages.

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
5. If `runtime` is present, its pinned HTTPS libraries and authored JavaScript,
   nonce-authorized by the generated Content Security Policy.

So: **never** include `<html>`, `<head>`, `<body>`, the `.deck-viewport` /
`.deck-stage` wrappers, the `.slide` section tag, the fixed-stage base CSS, the
navigation controller, or stage-scaling JS. Do not put behavior in
`bodyHtml` `<script>` tags; use `runtime.js`.

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

### `runtime?: DeckRuntime`

Omit this field for static decks. For interactive decks:

```json
{
  "libs": [],
  "js": "/* delegated deck-wide behavior */",
  "connectOrigins": [],
  "frameOrigins": []
}
```

- `libs`: pinned `https://` script URLs loaded before `js`.
- `js`: deck-wide behavior. Delegate events from `document` so live slide
  patches do not destroy listeners.
- `connectOrigins`: HTTPS origins allowed for `fetch`/WebSocket. Empty permits
  same-origin only for runtime decks.
- `frameOrigins`: HTTPS origins allowed in iframes. Empty disables frames for
  runtime decks.
- `null` through deck update/replace removes an existing runtime.

Read [interactive-runtime.md](interactive-runtime.md) for the lifecycle,
interaction, accessibility, and staged-build conventions.

### Per slide

| Field | Meaning |
| ----- | ------- |
| `name` | Short outline label shown in the rail (e.g. "Problem"). Not rendered on the slide. |
| `bodyHtml` | Inner HTML of the slide section, laid out at 1920×1080. |
| `slideClass` | Extra classes on the section (e.g. `title-slide`). Only `[A-Za-z0-9_-]` tokens survive sanitization. |
| `transition` | Enter animation: `fade` (default), `slide`, `zoom`, or `none`. |
| `notes` | Speaker notes. Shown in present mode via `s`; never on the slide. |

Inside `bodyHtml`, mark custom interactive regions with
`data-deck-interactive`. Native links, buttons, inputs, textareas, selects, and
editable content are protected automatically. Use `data-build="1"`,
`data-build="2"`, … for staged reveals and `data-deck-advance` on an explicit
reveal/advance button.

## Animation conventions

- Add `class="reveal"` to elements that should rise + fade in when the slide
  becomes active. Direct children stagger automatically (1st ~0.10s … 8th
  ~0.66s). Order your reveal elements as direct children of a flex column for a
  clean cascade.
- Pick `transition` per slide for the whole-slide enter feel (`zoom` reads as
  confident for titles; `slide` for sequential content; `fade` is the safe
  default).
- Keep purely visual motion CSS-only. Put meaningful calculations, filters, and
  other behavior in `runtime.js`. `prefers-reduced-motion` is already handled.

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

For a working interactive example, inspect the `data-dashboard` template in
either app. It includes a filterable chart, sortable table, live scenario
calculator, interaction ownership, and staged results.

## Mobile and print

The 1920×1080 canvas is the desktop authoring coordinate system. Published
decks reflow into tall, scrolling sections at narrow phone widths. Components
from the injected vocabulary already stack and rescale. When bespoke template
CSS uses hardcoded dimensions, add phone overrides scoped like:

```css
@media (max-width: 640px) {
  html.deck-can-flow .custom-grid { grid-template-columns: 1fr !important; }
}
```

Staged content is shown in mobile reflow, thumbnails, and print. Presentation-
only `data-deck-advance` controls are hidden in mobile reflow and print.

## Artifacts pages

Use a page instead of a deck when the experience should scroll freely or own
the entire responsive layout. A page document is:

```json
{
  "html": "<main>…</main>",
  "css": "/* responsive page styles */",
  "js": "/* page behavior */",
  "fontLinks": [],
  "libs": [],
  "background": "#101018"
}
```

Pages receive a reset, scroll-reveal support via `.reveal`, scroll variables
`--scroll`/`--scroll-y`, and reduced-motion handling. Unlike decks, page JS
lives in `page.js` and does not use deck navigation or build attributes.

## Density quick rules

- **Low / speaker-led:** one idea per slide, huge type, 1–3 reveal lines, lots
  of negative space, more slides. Favor statement/quote/section-beat slides.
- **High / reading-first:** structured grids, comparison tables, annotated
  diagrams, 4–8 concise items, strong hierarchy so it still feels designed. If a
  slide starts to overflow, split it.
