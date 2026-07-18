# Native Location

`getMoldableCurrentPosition()` requests one current position. Its result follows
the web geolocation shape, but its native options are intentionally bounded. It
does not imply background tracking.

Declare `location` in `nativeHardware` before using this helper. The
declaration delegates geolocation to the iframe; it does not replace user or OS
permission.

In packaged Moldable on macOS, the helper uses the host's native Core Location
bridge. On platforms where that bridge explicitly reports unsupported, it falls
back to `navigator.geolocation`. Permission denial, timeout, and unavailable
errors from the native request do not trigger a second browser prompt.

```typescript
import {
  getMoldableCurrentPosition,
  getMoldableLocationAuthorizationStatus,
  getMoldableNativeCapabilities,
  supportsNativeHardwareCapability,
} from "@moldable-ai/ui";

const native = await getMoldableNativeCapabilities();
if (!supportsNativeHardwareCapability(native, "location")) return;

// This read does not request a position or show an OS prompt.
const permission = await getMoldableLocationAuthorizationStatus();
if (!permission.servicesEnabled || permission.authorization === "denied") {
  showManualPlaceEntry();
  return;
}

// Call this part directly from the user's click or keyboard action.
const position = await getMoldableCurrentPosition({
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
});

const { latitude, longitude, accuracy } = position.coords;
```

The native bridge accepts this bounded subset of `PositionOptions`:

- `enableHighAccuracy`: prefer a more accurate fix when available; it can be
  slower and consume more power.
- `timeout`: integer maximum wait from `1` through `60_000` milliseconds;
  defaults to `10_000`.
- `maximumAge`: integer acceptable cache age from `0` through `86_400_000`
  milliseconds; defaults to `0`.

Do not pass browser-only unbounded values such as `Infinity`, fractional
milliseconds, or values outside those ranges. They fail with
`invalid_request` before Core Location starts.

`getMoldableLocationAuthorizationStatus()` returns `authorization`,
`servicesEnabled`, `canRequest`, and `settingsRequired`. It directly reads the
current macOS state without creating a location request or prompting. A
`granted` authorization can still be unusable while Location Services are
disabled, so inspect both `authorization` and `servicesEnabled`.

Native requests require the app to be visible, a fresh user action, and an
approved `native-hardware.location` App Access grant. The operating system can
then present its own location prompt. Keep the call directly inside a click or
keyboard handler so the original user activation is preserved.

The read-only authorization-status helper still requires a live, visible,
trusted app view, but it does not require an App Access grant or fresh user
activation and cannot trigger the operating-system prompt.

## Product and privacy rules

- Ask only after explaining the location-dependent feature.
- Prefer coarse accuracy unless the feature truly needs a precise fix.
- Store derived information, such as a selected city, instead of coordinates
  whenever possible.
- Do not repeatedly call the helper to approximate background tracking.
- Provide manual place entry when location is unsupported or denied.
- Treat timeout and unavailable-position results separately from denial.

See [Native API support](native-api-support.md) for current platform status.
