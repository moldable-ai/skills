# Interaction states

## Specify the state model first

For each data-bearing region, define:

| State               | Required treatment                                                                 |
| ------------------- | ---------------------------------------------------------------------------------- |
| Initial loading     | Skeleton that approximates final geometry, or a compact spinner for a local action |
| Empty               | `Empty` with a factual title, short explanation, and one useful next action        |
| Error               | In-context `Alert` or error surface with a recovery action                         |
| Ready               | Stable content with selection and actions                                          |
| Refreshing          | Preserve existing content; show subtle progress without blanking the surface       |
| Disabled            | Explain the prerequisite near the control when it is not self-evident              |
| Destructive pending | Prevent duplicate submission and keep the consequence visible                      |

Avoid one global spinner for an application with several independent regions.

## Action hierarchy

- Primary: the one action that advances the current task.
- Secondary: reversible or navigational actions.
- Ghost: compact toolbar and row actions.
- Destructive: only actions with destructive consequences.

Keep primary actions scarce. Disable during submission, preserve their label where possible, and add a spinner without changing control width.

Use `ConfirmDialog` for a consequential action backed by synchronous or
asynchronous work. It keeps the consequence visible while pending and reports
failure without closing. Use low-level `AlertDialog` parts for custom static
confirmation compositions. Do not use `window.confirm`.

## Selection

Use:

- `Checkbox` for independent selections;
- `RadioGroup` for one option from a visible set;
- `Select` for a longer closed set;
- `SegmentedControl` for one of two to five compact modes;
- `ToggleGroup` for independent toggle or command state;
- `Tabs` when selection changes an entire content region;
- `Switch` for a setting that takes effect immediately.

Selection must remain visible when focus moves away.

## Inputs

Use a visible `Label` or `FieldLabel`; placeholder text is not a label. Put format help before validation failure when the input is unfamiliar.

Use `NumberInput` for values with numeric semantics. Set `min`, `max`, and `step`; add `unit` when the number is otherwise ambiguous. Use `ColorWell` with a text label and, where precision matters, a readable color value.

Use `DateField` for editable date-only text and `DatePicker` for a portable
single-date calendar. Keep the stored value in `YYYY-MM-DD` form without
converting it through a UTC instant. Build date-time, instant, and range
workflows as separate timezone-aware compositions until the public UI package
provides those contracts. Use `SearchField` for search so clear, pending, and
accessible-label behavior does not drift between apps.

Show validation next to the field. Reserve toasts for outcomes that are not tied to a specific visible control.

## Menus and disclosure

Order menu items by frequency and group by consequence. Keep destructive actions in a final separated group. Preserve keyboard navigation supplied by the primitive. A context menu supplements discoverable controls; it must not be the only path to a critical action.

Use disclosure components for optional detail, not to hide the screen's core instructions.

## Async feedback

- Optimistic updates: use only when reversal is clear and failure is rare.
- Toast: mount one `Toaster` and use the shared `toast` recipes for transient
  confirmation such as “Copied” or “Exported.”
- Inline status: ongoing or object-specific work.
- `Status`: persistent semantic state such as running, pending, or failed.
- Progress: determinate when measurable; spinner when not.

Do not animate a status indicator unless work is actively changing.

For long modal content, put the scrolling region in `DialogBody`,
`AlertDialogBody`, or `SheetBody`. Keep headers and action footers outside the
scrolling body so they remain reachable in short and narrow windows.

## Empty and error copy

Describe the present state and the next useful action:

- Good: “No recordings yet. Start a recording to create your first transcript.”
- Weak: “Nothing here!”
- Good: “Couldn’t load devices. Check Bluetooth permission and retry.”
- Weak: “An error occurred.”

Do not blame the user. Preserve unsaved work when recovery is possible.
