---
name: moldable-ui-patterns
description: Design, implement, or audit polished standalone-window and embedded Moldable app interfaces using the public @moldable-ai/ui API. Use for visible React UI work, semantic token and density decisions, component selection, keyboard-aware collections, app-shell and inspector layouts, interaction-state design, accessibility reviews, catalog coverage, design-system migrations, and frontend implementation briefs.
---

# Moldable UI Patterns

Build interfaces that feel like focused desktop tools: quiet, compact, responsive, and complete in every state.

## Workflow

1. Identify the product task, primary object, and dominant interaction before choosing components.
2. Read [references/design-language.md](references/design-language.md),
   [references/tokens-and-materials.md](references/tokens-and-materials.md), and
   [references/component-index.md](references/component-index.md) for all
   visible UI work.
3. Read only the additional references needed:
   - Standalone windows, shells, panes, inspectors, scrolling, or chat overlap:
     [references/app-shell-and-layout.md](references/app-shell-and-layout.md)
     and [references/standalone-windows.md](references/standalone-windows.md)
   - Forms, menus, async actions, selection, loading, or errors: [references/interaction-states.md](references/interaction-states.md)
   - Lists, grids, segmented choices, date entry, search, icon actions, or toasts:
     [references/collection-and-control-patterns.md](references/collection-and-control-patterns.md)
   - New controls or accessibility review: [references/accessibility.md](references/accessibility.md)
   - Component adoption, catalog work, or migration:
     [references/catalog-and-migration.md](references/catalog-and-migration.md)
   - Planning a new screen or delegating implementation: [references/frontend-architect-prompt.md](references/frontend-architect-prompt.md)
4. Inspect the installed `@moldable-ai/ui` exports or the monorepo source before using an uncertain API. Import from the package root; do not depend on internal source paths.
5. Choose one screen archetype, assign one owner for each scroll region, and specify loading, empty, error, ready, and disabled states before implementation.
6. Implement with semantic tokens and shared components. Keep feature-specific
   composition in the app instead of adding one-off variants to the kit.
7. Cover the result in the component catalog or app tests as appropriate,
   including interaction states instead of only the ready screenshot.
8. Review keyboard access, focus behavior, labels, reduced motion, narrow
   windows, light and dark themes, standalone presentation, and embedded
   chat-safe spacing.

## Non-negotiables

- Wrap app UI with `ThemeProvider` and `WorkspaceProvider`; import `@moldable-ai/ui/styles`.
- Design every app to work as the sole content of its own window. Embedded mode
  is a supported presentation, not the only layout assumption.
- Let the host own title bars, traffic lights, window controls, menus, share
  sheets, file/date pickers, resize behavior, and window lifecycle. Never draw
  simulated system chrome.
- Use semantic colors, type roles, density, surfaces, control states, motion,
  and material tokens. Never hard-code palette colors for application chrome.
- Prefer `Text`, `Panel`, `Toolbar`, `SplitView`, `Inspector`, `Status`,
  `NumberInput`, `ColorWell`, `EdgeFade`, `Material`, and `AppFrame` when their
  semantics match.
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
- Keep the host's chat overlay clear through the shared frame lifecycle and
  safe-area tokens. Never add an app-local `window.message` listener for chat
  overlap.
- Keep native capability behavior behind typed host contracts with a portable
  fallback. A UI component must not call one platform's bridge directly.
- Treat CSS material as an in-renderer effect. Behind-window material,
  transparency, active-window treatment, and energy policy remain host-owned.
- Earn a native feel through hierarchy, density, typography, keyboard behavior,
  window-aware layout, and restrained motion.

When package component guides are present, read each selected family at
`node_modules/@moldable-ai/ui/src/components/ui/<component>.md` or, in the
desktop monorepo, `packages/ui/src/components/ui/<component>.md`.

Use the broader `moldable` skill for app scaffolding, data, workspace, native-capability permissions, and lifecycle rules.
