# Native Global Shortcuts

Use a global shortcut only for a user-enabled action that remains useful while
another app is focused. Its runtime capability ID is `global-shortcuts`.

```typescript
import { registerMoldableGlobalShortcut } from '@moldable-ai/ui'

const registration = await registerMoldableGlobalShortcut(
  'CommandOrControl+Shift+P',
  (event) => {
    if (event.state === 'Pressed') openQuickPanel()
  },
)

// Disable the feature or unmount:
await registration.unregister()
```

`registerMoldableGlobalShortcut()` returns a registration with
`registrationId`, normalized `shortcut`, and idempotent `unregister()`. The
lower-level `unregisterMoldableGlobalShortcut()` and
`unregisterAllMoldableGlobalShortcuts()` helpers are also exported.

Register a set atomically when one feature needs several accelerators:

```typescript
import {
  areMoldableGlobalShortcutsSuspended,
  isMoldableGlobalShortcutRegistered,
  registerAllMoldableGlobalShortcuts,
  setMoldableGlobalShortcutsSuspended,
} from '@moldable-ai/ui'

const registrations = await registerAllMoldableGlobalShortcuts(
  ['CommandOrControl+Shift+1', 'CommandOrControl+Shift+2'],
  ({ shortcut, state }) => {
    if (state === 'Pressed') activateSlot(shortcut)
  },
)

const ownsFirst = await isMoldableGlobalShortcutRegistered(
  'CommandOrControl+Shift+1',
)
const wasSuspended = await areMoldableGlobalShortcutsSuspended()
await setMoldableGlobalShortcutsSuspended(true)
const suspended = await areMoldableGlobalShortcutsSuspended()

// Disable or unmount the whole batch:
await Promise.all(
  registrations.map((registration) => registration.unregister()),
)
if (!wasSuspended) await setMoldableGlobalShortcutsSuspended(false)
```

Batch registration rolls back if any accelerator cannot be registered.
It resolves to one `MoldableGlobalShortcutRegistration` per shortcut, each with
the same idempotent `unregister()` cleanup as a single registration.
Registration and suspension queries reveal only the current app view's state.
Suspension suppresses callbacks for that view without releasing its shortcuts;
call `setMoldableGlobalShortcutsSuspended(false)` to resume them. Suspension is
view-wide, so record the previous state and restore it only if the current
feature changed it. Teardown clears both registrations and suspension state
automatically.

## Rules

- Ask only after the user enables the feature; registration requires a
  workspace-scoped app grant and a visible app.
- Use at least one modifier plus one key. Prefer `CommandOrControl` for portable
  shortcuts and provide an editable setting.
- Treat conflicts, reserved combinations, keyboard layouts, policy, and desktop
  environment limitations as normal failures.
- Prefer `registerAllMoldableGlobalShortcuts()` when a feature is useful only if
  every shortcut is available.
- Keep press handlers fast and idempotent; a key hold can repeat.
- Unregister on disable/unmount. The host also releases registrations on iframe
  reload, app stop, workspace change, and desktop exit.

Do not use global shortcuts for keylogging, text capture, accessibility input,
or hidden background behavior.
