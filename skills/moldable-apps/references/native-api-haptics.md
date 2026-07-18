# Native Haptics

Haptic feedback is an optional reinforcement for a user-visible interaction.

```typescript
import {
  getMoldableHapticAvailability,
  performMoldableHapticFeedback,
} from '@moldable-ai/ui'

const haptics = await getMoldableHapticAvailability()
if (haptics.apiAvailable && haptics.patterns.includes('alignment')) {
  const result = await performMoldableHapticFeedback('alignment')
  // result.accepted confirms API acceptance; physicalFeedback remains unknown.
}
```

Patterns are `generic`, `alignment`, and `level-change`.

`apiAvailable` reports whether the host can submit a request. `hardwareStatus`
and the result's `physicalFeedback` are `unknown` on macOS because AppKit does
not confirm whether compatible hardware produced feedback. The legacy
`available` and `performed` booleans mean API availability and request
acceptance respectively; they do not confirm a physical effect.

## Rules

- Use haptics sparingly for direct manipulation, snapping/alignment, or a clear
  state transition.
- Always pair feedback with visible or audible state. Never make haptics the
  only confirmation or error signal.
- Check availability; compatible Mac hardware is required.
- Avoid repeated feedback in loops and provide a product setting when frequent
  feedback is possible.

The current macOS path is hardware-gated/partial. Windows and Linux are
unsupported.
