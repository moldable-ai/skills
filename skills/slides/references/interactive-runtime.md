# Interactive Deck Runtime

Use the optional deck runtime to make a presentation meaningfully explorable
without introducing another artifact type. Keep it absent for static decks.

## Choose the right surface

| Need | Surface |
| --- | --- |
| Narrative steps, presenting, optional controls | Deck with optional runtime |
| Long-form scrolling, fully custom responsive app | Artifacts page |
| Durable state for one workspace or browser | `window.moldableState()` |
| Shared cursors, multi-user voting, cross-device state | Backend architecture; not provided by the runtime |

Good deck-runtime uses include calculators, scenario models, table sorting,
chart filters, local canvas/3D scenes, quizzes, and iframe walkthroughs. Avoid
adding controls that do not change the audience's understanding.

## Runtime shape

```json
{
  "runtime": {
    "libs": ["https://cdn.example/pinned-library.min.js"],
    "js": "/* deck-wide behavior */",
    "connectOrigins": ["https://api.example"],
    "frameOrigins": ["https://tour.example"]
  }
}
```

- Pin library versions and use HTTPS.
- Put only origins—not paths—in `connectOrigins` and `frameOrigins`.
- Leave permission arrays empty for local calculations and data embedded in the
  deck. Never embed credentials or secrets in a published artifact.
- Prefer no external dependency for template samples so they work offline and
  remain deterministic.

## Interaction ownership

The controller automatically leaves these elements alone:

```text
a, button, input, textarea, select, [contenteditable], [data-deck-interactive]
```

Wrap canvases, draggable charts, maps, and custom widgets in
`data-deck-interactive`. Do not stop propagation globally; the controller needs
events outside the interaction to navigate.

## Lifecycle and live editing

Listen for:

- `deck:slidechange` after the active slide or build step changes. Event detail
  includes `index`, `slideId`, and `build`.
- `deck:slidepatch` after the editor replaces a slide's `bodyHtml`.

Use delegated listeners once and make initialization idempotent:

```js
(function () {
  function render(root) {
    if (!root) return;
    var input = root.querySelector('[name="price"]');
    var output = root.querySelector('[data-output="payment"]');
    if (!input || !output) return;
    output.textContent = '$' + Math.round(Number(input.value) / 360).toLocaleString();
  }

  document.addEventListener('input', function (event) {
    var widget = event.target.closest('[data-calculator]');
    if (widget) render(widget);
  });

  function init() {
    document.querySelectorAll('[data-calculator]').forEach(render);
  }

  document.addEventListener('deck:slidechange', init);
  document.addEventListener('deck:slidepatch', init);
  init();
})();
```

Do not attach a new document-level listener inside `init`. Live patches would
multiply handlers.

## Durable runtime state

If users can put anything into a deck or page—stickies, votes, calculator
inputs, quiz progress, game scores—persist it through the injected async API:

```js
var store = window.moldableState('template-id:v1');
var state = null;
var hydrated = false;
var persistQueued = false;

function persist() {
  if (!hydrated) { persistQueued = true; return; }
  store.set(state).catch(function () {});
}

var hydration = store.get(null).then(function (saved) {
  state = saved || seedStateFromAuthoredHtml();
  hydrated = true;
}, function () {
  state = seedStateFromAuthoredHtml();
  hydrated = true;
});

function init() {
  renderWidgets(state);
}

document.addEventListener('deck:slidechange', init);
document.addEventListener('deck:slidepatch', init);
hydration.then(function () {
  init();
  if (persistQueued) persist();
});
```

The API is available before authored deck/page JavaScript runs:

```js
var store = window.moldableState('namespace:v1');
await store.get(fallbackValue); // returns the fallback when no state exists
await store.set(jsonValue);     // replaces the namespace value
await store.clear();            // removes it; the next get returns its fallback
```

Storage behavior:

- In Slides and Artifacts previews/present mode, the sandboxed runtime sends
  state through its owning app frame. The app writes workspace-scoped JSON under
  `data/runtime-state/<artifact-id>/<encoded-namespace>.json`, surviving app
  restarts.
- On the normal published artifact link, the sandboxed runtime sends state to
  the outer artifact shell. The shell stores it in browser `localStorage`, keyed
  by artifact slug + namespace, so revisiting the same link in the same browser
  restores it. Clearing site data clears hosted state.
- Local and hosted state are deliberately separate. This API does not sync
  devices or users and is not a collaboration primitive.
- Thumbnail renders return the supplied fallback and ignore writes, keeping
  gallery previews canonical.
- Direct/raw hosted views do not guarantee durable state; use the normal shared
  artifact URL when persistence matters.

Authoring rules:

- Never call `localStorage` or `sessionStorage` directly. Artifact content runs
  in an opaque-origin sandbox, so direct browser storage is denied locally and
  on the hosted raw document.
- Use a stable, versioned namespace matching
  `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`, such as `working-session:v1`. Bump the
  version when the stored schema becomes incompatible.
- Store one JSON-serializable value no larger than 512 KB per namespace. Do not
  store blobs, media, secrets, functions, DOM nodes, or class instances.
- Hydrate before the first stateful render. Keep useful authored fallback HTML
  visible while hydration completes, and make initialization idempotent.
- Call `set()` after every meaningful mutation. The injected client snapshots
  values and serializes writes per namespace so rapid updates cannot land out
  of order.
- Make reset/retry controls either `set()` the cleared shape or `clear()` the
  namespace so the user always has a way back.
- Keep transient things transient (a running timer should not resurrect).
- Catch storage failures and keep the interaction usable in memory; persistence
  failure must not break the deck.

## Widgets that grow need internal scroll

The stage is a fixed 1920×1080 — content that expands with interaction
(revealed explanations, an accumulating idea wall) will silently clip. Give the
growing panel its own scroll region (`max-height` or fixed height +
`overflow-y: auto`) inside the `data-deck-interactive` root; wheel and touch
inside an owned region scroll the panel, never the deck. Add narrow-screen
overrides that lift the cap (`height: auto; overflow visible`) since mobile
reflow already scrolls the page, and `scrollIntoView({ block: 'nearest' })`
newly revealed items so the scroll affordance announces itself.

## Staged builds

```html
<div class="result" data-build="1">First implication</div>
<div class="result" data-build="2">Recommended action</div>
<button data-deck-advance>Reveal analysis →</button>
```

Next/Space reveals the next build before advancing. Previous rewinds builds
before moving to the prior slide. `data-deck-advance` is the explicit desktop
click control; do not make the whole slide a click target. All staged content is
visible in mobile reflow, thumbnails, and print.

## Accessibility and responsive behavior

- Use real `button`, `label`, `input`, `output`, and `table` elements.
- Preserve visible focus styles and keyboard behavior.
- Use `aria-live="polite"` when a calculated result needs announcement; avoid
  announcing every pointer movement.
- Keep a useful static value in the HTML before JavaScript runs.
- Make controls large enough for touch and do not encode state with color alone.
- Add narrow-screen overrides for bespoke template CSS. Mobile reflow hides
  presentation-only advance buttons and shows every build step.
- Respect reduced motion; do not reintroduce mandatory animation in runtime JS.

## Template author checklist

When creating or reviewing an interactive template in both Slides and
Artifacts:

1. Use the same template id and behavior in both catalogs.
2. Put shared behavior in `template.runtime`, not inline slide scripts.
3. Keep listeners delegated and initialization idempotent.
4. Demonstrate the interaction with realistic static fallback content.
5. Verify editor, present, thumbnail, print, and ~390px mobile modes.
6. Confirm controls do not trigger navigation and navigation still works outside
   controls.
7. Keep the sample self-contained; request CSP origins only when necessary.
8. Expose the runtime from the template-detail API so the authoring agent can
   inspect and preserve it.
9. Persist meaningful user input with `window.moldableState()` and verify it
   survives a local app restart plus a hosted-link revisit in the same browser.

Use `open-house`, `working-session`, and `security-training` as durable-state
references. Use `data-dashboard` for chart filtering, sortable table columns, a
live scenario calculator, and staged results that intentionally reset.
