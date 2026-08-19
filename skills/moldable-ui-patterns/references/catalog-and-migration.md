# Catalog, coverage, and migration

The component catalog is the executable record of the public design system. A
component is not complete when only its default ready state looks correct.

## Catalog matrix

For each public visual primitive, cover the relevant cells:

| Dimension | Required examples |
| --- | --- |
| Theme | light and dark |
| Density | compact, default, comfortable when supported |
| Width | narrow pane and wide window |
| State | rest, hover/pressed where testable, focus, selected, disabled, busy, invalid |
| Content | short, long, empty, leading/trailing icon, localized stress |
| Motion | normal and reduced motion |
| Material | normal and reduced transparency when used |
| Direction | left-to-right and right-to-left when layout logic changes |

Collections also need empty, one-item, many-item, single selection, multiple
selection, keyboard navigation, deletion focus, and responsive reflow examples.

The catalog should import only from the package root where the build permits it,
so examples exercise the supported API rather than internal shortcuts.

## Test layers

Use the smallest layer that catches the regression:

- unit tests: variants, state derivation, and pure formatting;
- interaction tests: keyboard paths, focus return, selection, announcements,
  and controlled/uncontrolled behavior;
- accessibility checks: names, roles, states, contrast assumptions, and no
  obvious automated violations;
- visual regression: light/dark, narrow/wide, representative state matrix, and
  stable reduced-motion snapshots;
- app integration: standalone frame, embedded safe areas, and host capability
  unavailable/fallback behavior.

Avoid snapshots of raw implementation markup. Assert the public behavior and use
visual snapshots for appearance.

## Migration order

Adopt shared foundations before adding app-local polish:

1. install shared styles and providers;
2. replace raw colors, type sizes, surfaces, spacing, and motion with semantic
   roles;
3. replace native buttons with `Button` or `IconButton`;
4. replace repeated search, segmented, collection, date, and toast recipes;
5. replace app-local shell and safe-area behavior with `AppFrame` and the shared
   lifecycle;
6. add catalog and app-level regression coverage;
7. remove obsolete utilities after all callers migrate.

For a large raw-button inventory, migrate by semantic family: toolbar icon
actions, row actions, primary form actions, destructive actions, then bespoke
canvas controls. Verify accessible names, submit behavior, disabled state, and
focus after each batch.

For repeated channel-layout listeners, first add coverage around the shared
frame lifecycle. Migrate one representative app, verify embedded and standalone
presentation, then remove each app-local listener as callers adopt the shared
contract. Do not mass-delete listeners before confirming equivalent event
cleanup and initial-state behavior.

Once every app installs the verified shared frame lifecycle, remove
byte-identical legacy safe-area shims. Preserve app-specific listeners that
drive additional dock or gutter behavior until those behaviors have their own
shared contract.

For adaptive material, catalog a variegated background beneath regular and
clear examples. Cover light and dark themes plus reduced transparency,
increased contrast, reduced motion, and forced-color assumptions. Keep standard
case identifiers stable when adding environment axes.

## Adding to the kit

Add a component only when the behavior or visual grammar is truly shared. A
public addition needs:

- a deliberate package-root export;
- typed controlled and uncontrolled contracts where appropriate;
- semantic tokens and density support;
- keyboard, focus, disabled, and error behavior;
- a component guide;
- catalog states and behavior tests;
- no dependency on one host bridge.

Keep product-specific composition in the app. Shared primitives should make the
right behavior easy without absorbing domain language.
