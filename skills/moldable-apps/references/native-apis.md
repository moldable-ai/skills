# Native APIs

Moldable apps access protected desktop capabilities through typed helpers from
`@moldable-ai/ui`. Never call host message protocols or Tauri commands directly.

**Building UI on these APIs?** Reach for the prebuilt native-capability
components first (`CameraPreview`, `SerialConsole`, `LocationPanel`,
`CapabilityMatrix`, …) — see [ui.md](ui.md) § Native Capability Components.
The imperative helpers below are the right layer for headless logic and custom
visuals.

## Choose a reference

- [Support and permissions](native-api-support.md)
- [Permission grants and manifests](native-api-permissions.md)
- [Media](native-api-media.md): camera, microphone, display capture, system audio
- [Location](native-api-location.md)
- [Clipboard](native-api-clipboard.md)
- [Notifications](native-api-notifications.md)
- [Displays](native-api-displays.md)
- [Global shortcuts](native-api-global-shortcuts.md)
- [Power and session](native-api-power-session.md)
- [Local authentication](native-api-local-authentication.md)
- [Haptics](native-api-haptics.md)
- [Secure storage](native-api-secure-storage.md)
- [USB](native-api-usb.md)
- [HID](native-api-hid.md)
- [Serial](native-api-serial.md)
- [MIDI](native-api-midi.md)
- [Bluetooth Low Energy](native-api-bluetooth.md)
- Platform notes: [macOS](native-api-platform-macos.md),
  [Windows](native-api-platform-windows.md), and
  [Linux](native-api-platform-linux.md)

## Required workflow

1. Call `getMoldableNativeCapabilities()` and inspect the exact capability.
2. Add every native capability the app invokes to `nativeCapabilities` before
   the iframe loads. This includes browser-delegated camera, microphone, screen
   capture, location, clipboard, USB, HID, serial, MIDI, and Bluetooth APIs as
   well as typed host APIs such as notifications, displays, and secure storage.
3. Explain the user-visible purpose and request access from a direct user action.
4. Treat `partial`, denied, cancelled, busy, disconnected, and unavailable as
   normal product states.
5. Close streams, registrations, subscriptions, blockers, devices, ports, and
   connections explicitly. Host teardown is a safety net, not the primary path.

```typescript
import {
  getMoldableNativeCapabilities,
  getNativeCapability,
  supportsNativeCapability,
} from '@moldable-ai/ui'

const native = await getMoldableNativeCapabilities()
const camera = getNativeCapability(native, 'camera')

if (camera.support === 'unsupported') {
  // Hide the action or render an unavailable explanation.
} else if (camera.support === 'partial') {
  // Keep a fallback visible and use camera.reason in diagnostics.
} else if (supportsNativeCapability(native, 'camera')) {
  // The runtime path exists; permission and hardware can still reject a request.
}
```

`NativeCapabilityManifest` has a `platform` and one descriptor for every
`NATIVE_CAPABILITY_IDS` entry.
Each descriptor contains `support`, `transport`, `permission`, and an optional
`reason`. `supportsNativeCapability()` is only shorthand for “not
unsupported”; it intentionally returns `true` for `partial`.

The runtime result is authoritative. Do not infer support from a user agent,
`navigator.platform`, a manifest declaration, or the presence of an OS API.

## Bridge errors

Desktop-bridge failures reject with `NativeCapabilityBridgeError`. Its public
fields are `code: NativeCapabilityErrorCode`, `message`, optional `details`,
and optional `retryable`. Use `toNativeCapabilityBridgeError()` at a
bridge-backed API boundary when the caught value is unknown.

Error codes are grouped by response:

- Caller or bridge contract: `invalid_request`, `not_in_moldable`,
  `invalid_response`.
- Request lifecycle: `timeout`, `aborted`, `cancelled`.
- Capability or authorization: `unsupported`, `unavailable`,
  `permission_denied`.
- Unexpected host execution failure: `host_error`. The host returns this
  promptly with a generic message and does not expose raw platform errors.

Treat cancellation and denial as normal UI states. Retry only while the user
still intends the operation and `retryable === true`; never display or persist
`details` without validating that it is safe.

## Security boundaries

- The desktop derives app and workspace identity; app payloads cannot choose it.
- Privileged bridge operations use workspace-scoped
  `native-capabilities.<capability>` grants.
- Device fallbacks expose bounded descriptors and opaque handles, not arbitrary
  device paths.
- Embedded-web device declarations delegate only the matching iframe Permissions
  Policy token. They do not grant OS permission or skip a chooser.
- Do not log secrets, authentication reasons with sensitive data, device payloads,
  precise locations, or stable device identifiers.
