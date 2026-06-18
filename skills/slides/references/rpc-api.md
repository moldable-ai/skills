# Slides RPC API

The Slides app exposes a JSON-RPC-style dispatch endpoint plus matching REST
routes. Prefer RPC for authoring; both read/write the same workspace-scoped deck
files, and the open app window updates live after any change.

## Calling RPC

`POST /api/moldable/rpc` on the running Slides app server.

Request body: `{ "method": "<method>", "params": { … } }`
Response: `{ "ok": true, "result": … }` or
`{ "ok": false, "error": { "code", "message" } }`.

Include the active workspace via the `x-moldable-workspace-id` header (or the
broker handles it when called through `callMoldableApp("slides", method, params)`).
Most params take the deck id as `id` (alias `deckId`) and, for slide ops,
`slideId`.

```bash
curl -s -H 'x-moldable-workspace-id: <ws>' \
  -X POST http://<app-host>/api/moldable/rpc \
  -H 'content-type: application/json' \
  -d '{"method":"slides.decks.create","params":{"title":"Q3 Pitch"}}'
```

## Methods

### Decks

| Method | Params | Returns |
| ------ | ------ | ------- |
| `slides.decks.list` | — | deck summaries |
| `slides.decks.get` | `id` | full deck (theme + slides) |
| `slides.decks.create` | `title?, subtitle?, density?, theme?, slides?` | new deck |
| `slides.decks.update` | `id`, + any of `title, subtitle, density, theme` | deck |
| `slides.decks.replace` | `id`, + `title?, subtitle?, density?, theme?, slides?` | deck (bulk overwrite) |
| `slides.decks.delete` | `id` | `{ ok }` |

`density` is `"low"` or `"high"`. `theme` is `{ fontLinks, css, stageBg }`.
`slides` is an array of slide objects (see the authoring contract).

### Slides

| Method | Params | Returns |
| ------ | ------ | ------- |
| `slides.slides.add` | `id`, `slide` (or fields inline), `index?` | `{ deck, slide }` |
| `slides.slides.update` | `id`, `slideId`, `slide` (or fields inline) | `{ deck, slide }` |
| `slides.slides.remove` | `id`, `slideId` | deck |
| `slides.slides.reorder` | `id`, `order` (array of slideIds) | deck |
| `slides.slides.move` | `id`, `slideId`, `toIndex` | deck |

A slide is `{ name, bodyHtml, slideClass?, transition?, notes? }`. `add` always
assigns a fresh slide id. `update` only changes provided fields (pass
`slideClass: ""` / `notes: ""` to clear).

### Style templates

The app ships a library of styles (clean-minimal, bold-founder, finance-pro,
classroom, product-brief, editorial, dark-tech, pastel-creative). Each provides a
theme + a **coding guide** (design tokens + the shared component vocabulary). When
a deck is open, that deck's full guide is injected into your system prompt
automatically — author with its classes/tokens.

| Method | Params | Returns |
| ------ | ------ | ------- |
| `slides.templates.list` | — | `[{ id, name, tagline, audiences, description }]` |
| `slides.templates.get` | `templateId` | `{ …meta, theme, guide, sampleSlides }` (full coding guide) |
| `slides.decks.applyTemplate` | `id`, `templateId` | deck (swaps theme; re-skins vocabulary-based slides instantly; seeds sample slides if the deck is empty) |

`slides.decks.create` accepts `templateId` to start from a style (seeds its theme
+ sample slides). Match the style to the user's use case (teacher→classroom,
founder→bold-founder, finance→finance-pro, PM→product-brief, design→editorial,
developer→dark-tech, creative→pastel-creative, general→clean-minimal) — ask if
unsure. Because every template implements the same component vocabulary,
switching templates re-skins existing slides without rewriting them; only custom
(non-vocabulary) CSS needs follow-up.

### AI images

Generated images are saved as **deck assets**; reference them from a slide's
`bodyHtml` or `theme.css` with relative `assets/<file>` paths (they resolve in
both the live preview and the published artifact). The typical flow is two
steps: generate the image, then `slides.slides.update` the target slide to place
it (e.g. a full-bleed background with a text overlay, or a two-column layout).

| Method | Params | Returns |
| ------ | ------ | ------- |
| `slides.images.generate` | `id`, `prompt`, `size?` (`landscape`\|`portrait`\|`square`\|`auto`, default landscape), `fileName?` | `{ path, fileName }` |
| `slides.images.edit` | `id`, `source` (existing asset, e.g. `assets/x.png`), `prompt`, `size?`, `fileName?` | `{ path, fileName }` (new asset) |
| `slides.images.list` | `id` | `[{ fileName, path }]` |

Example — add an AI image to slide 2, then place it:

```json
{ "method": "slides.images.generate",
  "params": { "id": "<deck>", "prompt": "moody isometric server room, deep indigo, soft rim light", "size": "landscape" } }
```
→ `{ "path": "assets/img-1a2b3c4d.png", "fileName": "img-1a2b3c4d.png" }`, then
`slides.slides.update` that slide's `bodyHtml` to include
`<img src="assets/img-1a2b3c4d.png" …>` or a CSS `background-image`.

To tweak an image, `slides.images.edit` with `source: "assets/img-1a2b3c4d.png"`
and a change prompt; it writes a new asset and you swap the reference.

### Versions (undo / revert)

Every content edit (add/update/remove/reorder slide, deck/replace edits, and the
slide change that places a generated image) automatically saves a restore point.

| Method | Params | Behavior |
| ------ | ------ | -------- |
| `slides.versions.list` | `id` | `[{ versionId, createdAt, label, slideCount }]`, newest first. Each entry is the deck state *before* that labeled change. |
| `slides.deck.revert` | `id`, `versionId` | Restore that version. The current state is snapshotted first (label "Before revert"), so a revert is itself undoable. Publish state is preserved. |

### Publish

| Method | Params | Behavior |
| ------ | ------ | -------- |
| `slides.deck.publish` | `id` | Flags the deck for publish; the open app window bundles it and completes the publish to a public Moldable Artifact link. |
| `slides.deck.unpublish` | `id` | Forgets the deck's published link. |

Publishing physically happens in the app's iframe (only it can talk to the host
publish flow), so `slides.deck.publish` requires the Slides app to be open in
the active workspace. The result URL appears on the deck (`published.url`) once
done; the user can also click Publish directly in the app.

## Recommended authoring flow

To generate a full deck in one shot, create it empty then `replace` (or pass
everything to `create`):

```json
{
  "method": "slides.decks.create",
  "params": {
    "title": "Q3 Pitch",
    "density": "low",
    "theme": { "fontLinks": ["https://…"], "stageBg": "#0a0a12", "css": ":root{…}.slide{…}.pad{…}" },
    "slides": [
      { "name": "Title", "slideClass": "title-slide", "transition": "zoom", "bodyHtml": "<div class=\"pad\">…</div>" },
      { "name": "Problem", "transition": "slide", "bodyHtml": "<div class=\"pad\">…</div>" }
    ]
  }
}
```

To iterate, use granular `slides.slides.update` / `add` / `reorder` so you only
touch what changes.

## REST equivalents

Every method has a REST route (useful for `curl` or non-broker calls):

- `GET /api/decks` · `POST /api/decks` · `GET|PATCH|PUT|DELETE /api/decks/:id`
- `POST /api/decks/:id/slides` · `PATCH|DELETE /api/decks/:id/slides/:slideId`
- `POST /api/decks/:id/slides/reorder` · `POST /api/decks/:id/slides/:slideId/move`
- `POST /api/decks/:id/publish` · `POST /api/decks/:id/unpublish`
- `GET /api/decks/:id/preview` and
  `GET /api/preview/:workspace/:id/index.html` — the composed deck HTML
  (the second resolves relative `assets/` paths; used by the in-app iframe).
- `GET /api/decks/:id/stage-publish` — stages `index.html` on disk and returns
  the artifact file manifest with absolute `sourcePath`s.

## Direct-file fallback

Decks are plain JSON at `apps/slides/data/decks/<id>.json` in the active
workspace's data dir. You may create/edit these files directly when RPC isn't
reachable — the server re-reads from disk and the open window refreshes. The
schema matches `slides.decks.get`. Use a kebab/uuid id and keep
`createdAt`/`updatedAt` ISO strings.
