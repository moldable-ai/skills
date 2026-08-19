# Moldable design language

## Contents

- [Character](#character)
- [Start with the object](#start-with-the-object)
- [Design for a window](#design-for-a-window)
- [Surface hierarchy](#surface-hierarchy)
- [Typography](#typography)
- [Color](#color)
- [Density and spacing](#density-and-spacing)
- [Corners, borders, and elevation](#corners-borders-and-elevation)
- [Icons and copy](#icons-and-copy)
- [Motion](#motion)
- [Quality review](#quality-review)

## Character

Moldable apps are local instruments, not miniature marketing sites. Aim for:

- quiet surfaces with strong information hierarchy;
- compact controls and short travel distances;
- one obvious working area;
- direct manipulation, immediate feedback, and keyboard fluency;
- restrained borders, shadows, color, and motion;
- enough warmth to feel considered without becoming decorative.

A native macOS feel comes from behavior and rhythm. Do not reproduce traffic lights, title bars, frosted acrylic everywhere, or system artwork.

## Design for a window

Treat every app as a complete tool that may be the only content in a native
window. The surrounding desktop shell is not part of the app's information
architecture. Give the app a clear identity, one dominant canvas, compact local
commands, and resilient edge regions.

The host owns native chrome and supplies window insets. The app owns content
below those insets. A standalone window and an embedded view should share one
content hierarchy rather than becoming two separate products.

The host bot/group channel is an orchestrator surface. It may be external to
the app or temporarily overlap an embedded presentation, so app layout must
not assume permanent channel chrome.

## Start with the object

Name the primary object on the screen: document, task, file, recording, run, device, or setting. Then identify:

1. the collection or navigation context;
2. the primary work surface;
3. optional contextual properties;
4. the few actions that move work forward.

If every region has equal visual weight, the hierarchy is unfinished.

## Surface hierarchy

Use a small, named surface hierarchy:

1. canvas for the primary work;
2. panel or toolbar for persistent supporting regions;
3. selected or raised control surfaces;
4. elevated content such as a menu, popover, or dialog.

Use separators and spacing before shadows. Avoid card grids inside cards, rounded containers around every section, and simultaneous borders plus shadows plus tinted fills.

Use the public semantic surface tokens and components instead of encoding these
levels with repeated opacity classes. See
[tokens-and-materials.md](tokens-and-materials.md).

## Typography

Use `Text` to encode stable roles.

- `heading1`: screen or document title; usually once.
- `heading2`: major local section.
- `large` / `large-strong`: prominent values or readable lead text.
- `regular` / `strong`: normal application copy and row emphasis.
- `small` / `small-strong`: metadata, labels, dense controls.
- `mini` / `mini-strong`: terse secondary annotations only.
- mono variants: identifiers, coordinates, durations, sizes, and logs.

Use `primary` for content, `secondary` for supporting information, and `tertiary` only when loss of emphasis is intentional. Do not create hierarchy with many arbitrary font sizes.

## Color

Use semantic tokens from the shared theme. Color should indicate:

- selection or primary intent;
- status;
- validation or destructive consequence;
- chart series when a chart is necessary.

Do not use raw Tailwind palette classes for chrome. Do not use accent color as decoration. Pair status color with text or an icon so meaning survives low contrast and color-vision differences.

## Density and spacing

Default to coordinated desktop density:

- 8–12 px internal gaps for related controls;
- 12–16 px section padding;
- concise 32–36 px control heights;
- larger whitespace only around a genuinely dominant object.

Keep related actions adjacent. Use alignment and consistent rhythm instead of extra containers.
Apply compact, default, or comfortable density at a region boundary; do not tune
each child independently.

## Corners, borders, and elevation

Use the component defaults unless a product need says otherwise. Keep neighboring controls on the same radius scale. Borders divide working regions; shadows reserve elevation for transient or floating content.

## Icons and copy

Use Lucide icons consistently. Keep labels verb-led and concrete: “Export PDF,” “Retry sync,” “Delete recording.” Avoid generic “Submit,” “Manage,” or “Continue” when a specific outcome is available.

Icon-only controls need an accessible name. Add a tooltip when the icon could plausibly mean more than one thing.

## Motion

Use motion to explain state change, not to decorate:

- use the shared fast or standard motion tokens for local transitions;
- opacity and small transforms for entry/exit;
- no looping animation except active progress;
- respect reduced-motion preferences;
- avoid layout movement when content updates.

## Quality review

Before calling a screen finished, verify:

- one dominant work surface is obvious;
- the primary action is visible but not oversized;
- every control has a state and purpose;
- loading, empty, error, and ready layouts occupy compatible geometry;
- the screen works in light and dark themes;
- narrow standalone windows and embedded panes degrade without clipped controls;
- reduced transparency leaves every surface and boundary legible;
- system chrome is host-owned and no traffic lights are simulated;
- prose has been reduced to what helps the next action.
