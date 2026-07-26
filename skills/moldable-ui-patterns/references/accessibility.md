# Accessibility

Treat accessibility as component behavior, not a final visual pass.

## Semantics

- Use native elements for their intended roles.
- Keep heading levels meaningful even when `Text` controls appearance.
- Use `Button` for actions and links for navigation.
- Associate every field with a visible label.
- Use table markup only for tabular relationships.
- Preserve the semantics and ARIA supplied by shared primitives.

## Names and descriptions

Every interactive element needs an accessible name. Add `aria-label` to icon-only buttons and a tooltip when visual meaning is ambiguous. Do not rely on tooltip text as the only accessible name.

Connect help and validation copy with the field through the shared `Field` or `Form` APIs. Keep error language specific and actionable.

## Keyboard

Verify:

- all interactive elements are reachable in a logical order;
- focus is visible in both themes;
- Enter and Space activate the expected controls;
- Escape closes transient layers and returns focus;
- arrow-key behavior remains intact for menus, tabs, radio groups, and composite widgets;
- `List` and `Grid` preserve their documented roving focus, selection modifiers,
  Home/End behavior, and deletion focus;
- no clickable `div` substitutes for a button;
- a context menu is never the only route to a critical command.

Do not assign positive `tabIndex` values.

## Focus management

Dialogs and sheets must move focus inside, trap it while open, and restore it to the trigger. After deletion, move focus to the next logical row or region. When validation fails, focus the first invalid field or provide a clear summary.

Do not move focus for background refreshes or toast notifications.

## Status and announcements

Use `Status` for readable persistent state. Use polite live announcements for background completion; reserve assertive announcements for blocking errors. Avoid repeating the same message through both toast and live region.

`NotificationDot` is decorative. Pair it with accessible text or a count in the surrounding control.

## Color and contrast

Use semantic tokens and test both themes. Never encode state by color alone. Retain visible boundaries for controls against their surface, including hover, focus, disabled, and selected states.

## Motion

Respect `prefers-reduced-motion`. Do not require animation to understand a change. Avoid flashing and unnecessary looping effects. Keep progress animation limited to active work.

## Zoom and sizing

Check the interface at 200% zoom and at a narrow embedded width. Content must reflow or scroll without covering actions. Keep pointer targets comfortably usable; compact visual size does not justify tiny hit areas.

Also test a narrow standalone window. Host-provided titlebar and bottom insets
must not cover focus rings, field labels, or collection items.

## Review checklist

- Navigate the complete task with keyboard only.
- Inspect the accessibility tree for names, roles, and states.
- Verify dialog focus entry and return.
- Trigger every validation and error state.
- Check selected, disabled, busy, and read-only states.
- Test light, dark, reduced motion, reduced transparency, narrow standalone and
  embedded widths, and zoom.
