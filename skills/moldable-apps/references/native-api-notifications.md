# Native Notifications

Use the typed notification helpers to check permission, request it in context,
and send a user-visible system notification.

```typescript
import {
  getMoldableNotificationPermission,
  requestMoldableNotificationPermission,
  sendMoldableNotification,
} from '@moldable-ai/ui'

let { permission } = await getMoldableNotificationPermission()

if (permission === 'prompt') {
  ;({ permission } = await requestMoldableNotificationPermission())
}

if (permission === 'granted') {
  await sendMoldableNotification({
    title: 'Export complete',
    body: 'Your report is ready.',
  })
}
```

## Permission behavior

- Ask after the user enables a feature that benefits from notifications, not on
  first app load.
- `getMoldableNotificationPermission()` never prompts. An explicit call to
  `requestMoldableNotificationPermission()` owns the operating-system prompt.
- The request resolves with `granted`, `denied`, or `prompt`. Denial and prompt
  dismissal are normal permission states, not API errors.
- A denied permission is durable product state. Keep the feature usable and
  explain where the user can change system settings.
- Do not immediately re-prompt after denial or dismissal.
- Re-read permission before sending if the app has been open for a long time.

## Delivery rules

- Send notifications for completed, time-sensitive, or background work—not for
  routine foreground feedback.
- Keep titles and bodies useful without revealing sensitive workspace content on
  a lock screen.
- Avoid duplicate desktop and in-app notifications for the same foreground event.
- Delivery, sound, grouping, focus-mode behavior, and lock-screen visibility are
  controlled by the operating system.

Notification actions, inline replies, notification history, and native process
notification centers are not part of the app contract.

Titles are limited to 256 characters, bodies to 4,096, and tags to 128. The send
options also accept `tag` and `silent`.

See [Native API support](native-api-support.md) for current platform status.
