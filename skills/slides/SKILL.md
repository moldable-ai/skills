---
name: slides
description: Author beautiful, animation-rich presentation decks inside the Moldable Slides app and publish them as shareable Moldable Artifact links. Use when the user wants to build a slide deck, pitch deck, presentation, or talk in Moldable, or to edit/restyle/reorder/publish an existing deck. Drives the Slides app via its RPC API rather than writing standalone HTML files.
---

# Slides (Moldable)

Author and publish stunning, animation-rich presentations through the **Slides
Moldable app**. You write per-slide HTML/CSS and a deck theme; the app renders it
on a fixed 16:9 stage with animations, keyboard/touch navigation, live preview,
present mode, and one-click publishing to a public Moldable Artifact link.

This skill is the Slides app's **operating manual**, not a template pack. The
look — 47 studio-grade styles, the shared component vocabulary, and every design
token — lives in the app and is injected into your prompt when a deck is open
(see "Choose a look"). Your job is to drive the app well and author within its
contract. The one rule to remember: **you do not produce standalone `.html`
files.** You author decks by calling the Slides RPC; the app owns the document
shell, the fixed-stage CSS, the navigation controller, and the publish pipeline.

## What the app provides (do NOT re-create it)

The app injects all of this into every deck automatically:

- The full document (`<!DOCTYPE>`, `<head>`, `<body>`), the `.deck-viewport` /
  `.deck-stage` fixed 1920×1080 stage, and uniform scale-to-fit.
- The deck **controller**: arrow/space/PageUp-Down/Home/End/`j`/`k` nav, number
  keys, mouse-wheel and touch-swipe, a progress bar + slide counter, fullscreen
  (`f`), speaker-notes overlay (`s`), and deep-link hashes (`#3`).
- The base animation CSS: per-slide enter transitions (`fade`/`slide`/`zoom`)
  and the `.reveal` staggered-entrance helper (`.reveal:nth-child(1..8)`).
- The shared **component vocabulary** + the active style's tokens (injected as a
  coding guide while a deck is open).
- `prefers-reduced-motion` support and print/PDF rules.

**Your job is only to author, per slide:** the inner HTML of the stage section,
plus the deck-wide `theme` (font links + CSS variables + layout classes). See
[references/authoring-contract.md](references/authoring-contract.md) — read it
before writing any slide.

## The data model

A **deck** = `{ title, subtitle, density, theme, slides[] }`.

- `theme.fontLinks`: array of `https://` stylesheet URLs (Fontshare / Google
  Fonts — never system fonts).
- `theme.css`: `:root` custom properties, plus your own layout classes and
  `@keyframes`. Do **not** paste the fixed-stage base CSS or controller here.
- `theme.stageBg`: the letterbox color around the 16:9 stage.
- each **slide** = `{ name, bodyHtml, slideClass?, transition?, notes? }`:
  - `bodyHtml`: inner HTML of `<section class="slide">`, authored at 1920×1080.
  - `slideClass`: extra classes (e.g. `title-slide`).
  - `transition`: `fade` (default) | `slide` | `zoom` | `none`.
  - `notes`: speaker notes (shown in present mode via `s`, never on the slide).

## How to drive the app

Edit decks through the Slides RPC. Full method list, params, and call patterns
are in [references/rpc-api.md](references/rpc-api.md). The essentials:

- `slides.decks.create` — make a deck (optionally with theme + all slides).
- `slides.decks.replace` — overwrite an existing deck's theme/slides in one call
  (best for regenerating a whole deck).
- `slides.slides.add` / `update` / `remove` / `reorder` / `move` — granular edits.
- `slides.deck.publish` / `unpublish` — publish to / forget a shareable link.

You can call these via the app's HTTP endpoint (`POST /api/moldable/rpc`) or, as
a fallback, edit the deck JSON files directly under the app's workspace data dir
(`apps/slides/data/decks/<id>.json`) — the app re-reads from disk and the open
window updates live. Prefer RPC.

## Fixed-Stage Rules (NON-NEGOTIABLE)

These apply to every slide (the app enforces the mechanics; you must respect the
design constraints):

- Author at 1920×1080. Use fixed pixel measurements at that size.
- Never reflow content for phones — the whole stage scales as one unit.
- No scrolling, no overflow, no overlapping panels, no text below comfortable
  reading size. If content overflows, **split it into more slides**.
- Never use `display:none/block` to switch slides (the controller owns that).
- Negating CSS functions silently fails: use `calc(-1 * clamp(...))`, never
  `-clamp(...)`.
- No "AI slop": avoid Inter/Roboto-as-display, generic-indigo purple gradients on
  white, and identical card grids. The app's styles already steer you away from
  this — stay inside the chosen style's tokens.

## Workflow

### Phase 1 — Discover

Establish, ideally with one structured set of questions (use `AskUserQuestion`
when available):

1. **Purpose** — pitch / teaching / conference talk / internal.
2. **Length** — short (5–10) / medium (10–20) / long (20+).
3. **Content** — ready text / rough notes / topic only. If they have content,
   ask for it.
4. **Density** — _low/speaker-led_ (big ideas, few words, more slides) vs
   _high/reading-first_ (self-contained, structured, more detail per slide).
   This drives slide count, type scale, and amount of text per slide.

### Phase 2 — Choose a look

**Use the app's built-in style library — don't hand-roll a theme.** The app
ships 47 studio-grade styles; each is a complete sample deck with its own design
language, and all of them implement the same component vocabulary. Call
`slides.templates.list` (or let the user pick in the app's gallery) and match the
style to the use case by its `audiences` / `categories` — founder→`bold-founder`,
finance→`finance-pro`, PM→`product-brief`, teacher→`classroom`,
design→`editorial`, developer→`dark-tech`, creative→`pastel-creative`,
general→`clean-minimal`, and many more. See
[references/style-library.md](references/style-library.md) for the picking map.

Create the deck with that `templateId`: it seeds a coherent theme plus a full
sample deck, and the chosen style's **coding guide** (design tokens + the shared
component vocabulary + style notes) is injected into your system prompt while the
deck is open — so you author on-brand without guessing. Switching styles later
(`slides.decks.applyTemplate`) re-skins existing slides automatically.

Only hand-roll a fully custom theme when the brief needs something no style can
express — and even then, start from a near style and override. For motion and
CSS-only background decoration, see
[references/animation-patterns.md](references/animation-patterns.md) (the app
already wires `.reveal` and the enter transitions — you only add bespoke touches).

When unsure, create the deck with a strong title slide first and let the user
react to the live preview, then iterate. The app shows changes instantly — lean
on "show, don't tell."

### Phase 3 — Generate

Author each slide's `bodyHtml` from the injected component vocabulary, applying
the density choice throughout. Add `class="reveal"` to elements you want to
animate in, set per-slide `transition`, and write `notes` for speaker-led decks.
Create the deck via `slides.decks.create` (or build then add slides). Verify in
the app's preview: nothing overflows, panels don't overlap, the title slide lands.

**Design the deck as a product, not a slideshow** — especially for persuasive
decks (pitch / sales / partnership):

- **One narrative thread.** Slides should never feel interchangeable. Map a real
  arc and let each slide advance it. For an investor pitch: positioning →
  problem (with tension) → why now → solution → product → traction → market →
  team → the ask. Number the story in the eyebrow ("01 — The problem") so the
  audience always knows where they are.
- **Restraint reads as premium.** Commit to one accent and use it sparingly (a
  single key word, an `.accent-bar`, the stat figures). Avoid gradient text,
  rainbow backgrounds, and busy glows — confidence comes from scale and negative
  space, not decoration. 4–8 words per headline.
- **Compose in the whole frame.** Content is vertically centered by default;
  prefer hairline-divided columns (`.stats` with `.subhead` + `.body`) over
  boxed cards, and add a `.runner` footer (brand left, narrative step right) for
  a cohesive, designed-as-a-system feel.
- A strong narrative dramatically lifts read-through and close rates — treat the
  ordering and selection of slides as the core of the work, not an afterthought.

### Phase 4 — Present & Publish

The user presents from the app (Present button / fullscreen). To share, call
`slides.deck.publish` (or they click Publish) — the app bundles the deck into a
static `index.html` + assets and returns a public, unlisted Moldable Artifact
URL that works on any device. See the host artifact rules in the moldable-apps
skill (`references/artifact-publishing.md`). Only publish when the user asks.

## Images

CSS-generated visuals (gradients, geometry, patterns) are the first-class path
and need no files. Beyond that:

- **AI-generated images** — `slides.images.generate { id, prompt, size? }` creates
  an image (gpt-image, via the host proxy) and saves it as a deck asset; `…edit`
  tweaks an existing one. Then `slides.slides.update` the slide to place it
  (background with overlay, or a two-column layout). Reference assets with
  relative `assets/<file>` paths — they resolve in both the live preview and the
  published artifact. The app's **Assets panel** is the primary image surface
  (generate, restyle from a template cover, swap into a slide); the chat path
  above is for scripted placement.
- **User-supplied images** — store them as deck assets and reference them the
  same way. Keep images as separate files, never giant `data:` URLs.

## Undo / versions

Every content edit auto-saves a restore point. If the user dislikes a change,
use `slides.versions.list { id }` then `slides.deck.revert { id, versionId }`
(reverts are themselves undoable). The editor also has a "History" panel.

## Reference index

| File | Purpose |
| ---- | ------- |
| [references/authoring-contract.md](references/authoring-contract.md) | The exact per-slide HTML + theme model; what the app injects; what NOT to write. **Read first.** |
| [references/style-library.md](references/style-library.md) | How the style library works, how its coding guide reaches you, and how to pick a style. |
| [references/rpc-api.md](references/rpc-api.md) | Slides RPC methods, params, and call examples. |
| [references/animation-patterns.md](references/animation-patterns.md) | Effect-to-feeling guide + CSS-only motion/background snippets. |
