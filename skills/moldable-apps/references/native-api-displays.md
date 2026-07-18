# Native Displays

`getMoldableDisplays()` returns a snapshot of connected display metadata. It is a
query API, not a display-change subscription.

```typescript
import {
  getMoldableDisplays,
  getMoldableNativeCapabilities,
  supportsNativeHardwareCapability,
} from "@moldable-ai/ui";

const native = await getMoldableNativeCapabilities();
if (!supportsNativeHardwareCapability(native, "displays")) return;

const { displays } = await getMoldableDisplays();
const primary = displays.find((display) => display.primary);
```

Each `MoldableDisplay` contains:

```typescript
interface MoldableDisplay {
  name: string | null
  position: { x: number; y: number }
  size: { width: number; height: number }
  scaleFactor: number
  primary: boolean
}
```

Positions and sizes are physical pixels. Coordinates can be negative when a
display is arranged left of or above the primary display. Use `scaleFactor` when
translating to logical UI coordinates.

## Rules

- Query only when a multi-display feature needs the information.
- Do not use display names, geometry, or scale as a durable device identifier.
- Re-query before placement after the app regains focus; the display arrangement
  might have changed.
- Always handle an unavailable result and an empty display list.
- Display-change events, cursor position, color characteristics, rotation, and
  refresh rate are not in the app contract.

See [Native API support](native-api-support.md) for current platform status.
