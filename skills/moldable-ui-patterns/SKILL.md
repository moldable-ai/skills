---
name: moldable-ui-patterns
description: "Build or review Moldable React app interfaces using @moldable-ai/ui. Excludes native iPhone projections."
---

# Moldable UI Patterns

Build interfaces that feel like focused desktop tools: quiet, compact, responsive, and complete in every state.

## Guidance by task

Preserve the existing screen structure for small edits. For a new screen or
substantial redesign, choose its primary object, interaction, shell, and relevant
states before composing it.

Read only the guidance needed for the changed behavior:

- Design direction: [design-language](references/design-language.md).
- Choosing a component: [component-index](references/component-index.md), then
  the selected family's colocated guide if its API or behavior is unfamiliar.
- Surface, density, or material: [tokens-and-materials](references/tokens-and-materials.md).
- Shells and window layout: [app-shell-and-layout](references/app-shell-and-layout.md)
  and [standalone-windows](references/standalone-windows.md).
- Forms and async states: [interaction-states](references/interaction-states.md).
- Collections and controls: [collection-and-control-patterns](references/collection-and-control-patterns.md).
- New controls or accessibility review: [accessibility](references/accessibility.md).
- Catalog changes or migration: [catalog-and-migration](references/catalog-and-migration.md).
- An implementation brief, when requested: [frontend-architect-prompt](references/frontend-architect-prompt.md).

Component guides live in `node_modules/@moldable-ai/ui/src/components/ui/`
or the desktop monorepo's `packages/ui/src/components/ui/`. Host-service guides
live beside the corresponding `src/lib/` modules. These are documentation paths;
import public APIs only from `@moldable-ai/ui`.

Verify the affected interactions and states. Expand keyboard, theme, width,
window, and accessibility checks when shared layout or control behavior changes;
a text or spacing correction does not require a whole-screen audit.

## Non-negotiables

- Wrap app UI with `ThemeProvider` and `WorkspaceProvider`; import `@moldable-ai/ui/styles`.
- Design every app to work as the sole content of its own window. Embedded mode
  is a supported presentation, not the only layout assumption.
- Let the host own title bars, traffic lights, window controls, menus, share
  sheets, file/date pickers, resize behavior, and window lifecycle. Never draw
  simulated system chrome.
- Use semantic colors, type roles, density, surfaces, control states, motion,
  and material tokens. Never hard-code palette colors for application chrome.
- Prefer the shared semantic primitive over an app-local recreation. Use the
  decision router, then the selected component's colocated guide, rather than
  memorizing or copying a prop catalog into app code.
- Use `Material` only for navigation and control chrome. Prefer `regular`;
  reserve `clear` for compact controls over media, and use one
  `MaterialGroup` sampler for a related control cluster. Keep content surfaces
  opaque.
- Use `List`/`ListItem` and `Grid`/`GridItem` for keyboard-aware selectable
  collections; do not rebuild roving focus and selection in app code.
- Use `SegmentedControl`, `DateField`, `DatePicker`, `IconButton`,
  `NavigationButtonGroup`, and `SearchField` for their named jobs. Use
  `Toaster` and the shared `toast` recipes for transient outcomes.
- Use `ConfirmDialog` for asynchronous consequential actions so the layer stays
  open during work and displays failure in context.
- Prefer the existing canonical primitive instead of creating aliases: `Alert`
  for callouts, `Empty` for empty states, `Item` for presentational rows,
  `SegmentedControl` for exclusive modes, `ToggleGroup` for toggle state, and
  `Kbd` for shortcuts.
- Give every icon-only action an accessible name and tooltip where the meaning is not obvious.
- Use `Button` for actions. If a native `<button>` is unavoidable, include `cursor-pointer` and a disabled cursor.
- Do not reserve desktop space for the host channel panel: the shared lifecycle
  currently publishes `--chat-safe-padding: 0px`. Never add an app-local
  `window.message` listener to react to channel layout.
- Keep native capability behavior behind typed host contracts with a portable
  fallback. A UI component must not call one platform's bridge directly. Read
  the colocated host-service guide before using native menus, file/date pickers,
  sharing, or a host web surface.
- Treat CSS material as an in-renderer effect. Behind-window material,
  transparency, active-window treatment, and energy policy remain host-owned.
- Earn a native feel through hierarchy, density, typography, keyboard behavior,
  window-aware layout, and restrained motion.

Do not clone package component guides into this skill. The UI package publishes
the guides beside the components specifically so their APIs, accessibility
contracts, and examples stay current with the package.

Use the broader `moldable` skill for app scaffolding, data, workspace, native-capability permissions, and lifecycle rules.
