# Collection and control patterns

Use the shared controls so keyboard, focus, disabled, selected, and narrow-window
behavior remains consistent across apps.

## Selectable list

Use `List` with `ListItem` for a one-dimensional selectable collection.

- Choose `selectionMode="none"`, `"single"`, or `"multiple"` deliberately.
- Keep selection visible when focus moves elsewhere.
- Support Arrow Up/Down, Home, End, typeahead when labels are present, and the
  documented modifier behavior for multiple selection.
- Give each item a stable semantic key. Array position is not identity.
- Use `ListSection` and `ListSectionHeader` for named groups; arrow movement
  continues through the rendered DOM order across section boundaries.
- Keep row actions separately focusable and prevent them from accidentally
  changing selection.
- After deletion, move focus to the next item, previous item, or collection
  owner in that order.

Use `Item` for a presentational row that does not require collection-level
selection and keyboard coordination.

## Selectable grid

Use `Grid` with `GridItem` when spatial position matters, such as artifact,
photo, or template browsers.

- Left/Right stay within a row, Up/Down stay within a column, Home/End move
  within the current row, and Control/Command + Home/End target the full grid.
- Preserve item focus across responsive column-count changes when the item still
  exists.
- Include a visible label and selection treatment independent of color.
- Do not place an entire complex card inside one ambiguous interactive target.
  Separate the primary open/select action from secondary menus.

Use semantic table markup for tabular relationships. A visual card grid is not a
table, and a table is not a grid merely because rows are selectable.

## Segmented control

Use `SegmentedControl` and `SegmentedControlItem` for two to five mutually
exclusive modes within one view. It should expose single-choice semantics and
arrow-key movement.

Use `Tabs` when the choice switches labelled content panels. Use `ToggleGroup`
for independent toggles or command state. Do not use a segmented control as
decoration around unrelated buttons.

Labels should be short and parallel. Preserve control width when selection
changes.

## Date field

Use `DateField` for portable date entry.

- Use this component for a date-only model. Treat local date-time and absolute
  instants as different workflows with explicit timezone semantics.
- Use an ISO-compatible serialized value at application boundaries.
- Format and parse according to locale without changing the stored meaning.
- Expose invalid, disabled, read-only, minimum, and maximum states.
- Make keyboard editing and manual entry complete without a native picker.
- Treat a host date picker as an enhancement only when a real shared capability
  contract advertises it.

Never parse a date-only value through a timezone-changing instant by accident.
When timezone affects the task, show it.

## Date picker

Use `DatePicker` when a date-only workflow benefits from a visible calendar.
Its boundary value is an ISO calendar date (`YYYY-MM-DD`), not an instant.

- Use controlled `value`/`onValueChange` for form and data state.
- Set `min` and `max` with the same date-only format.
- Use `clearable` only when an unset date is valid.
- Keep time, date-time, and range selection in separate explicit workflows.
- Treat any future native picker as a host-advertised enhancement, not a bridge
  called directly by the component.

## Navigation and toggle controls

Use `NavigationButtonGroup` for caller-owned back/forward state. It installs no
history behavior or shortcuts.

Use `ToggleButton` for one independent boolean command state,
`SegmentedControl` for one-of-many modes, `ToggleGroup` for several independent
toggles, and `Switch` for a persistent setting that takes effect immediately.

## Icon button

Use `IconButton` for icon-only actions. It requires an accessible name. Add a
tooltip when the symbol is not universally understood, but do not use the
tooltip as the accessible name.

Choose the documented size and variant. Do not shrink the hit target with an
arbitrary `size-*` class. Pending, pressed, selected, and disabled behavior must
remain visible.

## Search field

Use `SearchField` for collection filtering or search.

- Give it a visible or accessible label that describes the scope.
- Keep clear, pending, result-count, and no-results behavior predictable.
- Debounce remote queries, not local input rendering.
- Escape may clear the query only when that behavior is communicated and does
  not conflict with closing an enclosing layer.
- Preserve the query when navigating into and back from a result unless the
  product explicitly treats search as transient.

An application toolbar can host search, but search remains a labelled field, not
an unlabeled generic input with a magnifying-glass icon.

## Toast recipes

Mount one `Toaster` at the application root and use the shared `toast` export.

- success: a completed transient operation, such as copy or export;
- error: a non-field failure with a concrete recovery route;
- loading/promise: work whose completion matters after the initiating control
  loses focus;
- action: a reversible result, such as undo.

Keep validation, durable status, and blocking failures in context. Do not show a
toast and a live-region announcement with identical copy. Toast actions must be
keyboard reachable, and focus must not move to the toast automatically.
