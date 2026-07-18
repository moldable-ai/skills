# Native USB

Declare `"usb"` in `nativeHardware`, check capability support, then request a
device from a direct user action with restrictive filters.

```typescript
import {
  closeMoldableUsbDevice,
  openMoldableUsbDevice,
  readMoldableUsbEndpoint,
  requestMoldableUsbDevice,
  writeMoldableUsbEndpoint,
} from '@moldable-ai/ui'

const device = await requestMoldableUsbDevice({
  filters: [{ vendorId: 0x1234, productId: 0x0001 }],
  selectNativeDevice: async (matches) => showUsbPicker(matches),
})

await openMoldableUsbDevice(device, {
  configurationValue: 1,
  claimInterfaces: [0],
})
try {
  await writeMoldableUsbEndpoint(device, 1, new Uint8Array([0x01]))
  const response = await readMoldableUsbEndpoint(device, 1, 64)
} finally {
  await closeMoldableUsbDevice(device, [0])
}
```

The helpers prefer WebUSB. When it is unavailable, the desktop fallback lists
bounded descriptors and returns an opaque, app-scoped device. If more than one
native device matches, `selectNativeDevice` is required; render the candidates
and return exactly one supplied object.

Also available: control transfers, halt clear, and reset helpers.
`getMoldableUsbDevices()` lists browser-granted WebUSB devices only and returns an
empty list on the native fallback. `forgetMoldableUsbDevice()` revokes WebUSB
permission only when the runtime supports it; on the native fallback it closes
the scoped handle and does not revoke the app's Moldable access grant.

## Connection lifecycle

Native fallback devices emit one `disconnect` event when an I/O operation
confirms physical removal. At that point `device.opened` is `false`; stop issuing
transfers, release app state, and still call `closeMoldableUsbDevice()` to clean
up the stale host handle.

```typescript
device.addEventListener(
  'disconnect',
  () => {
    stopUsbWork()
    showDisconnectedState()
  },
  { once: true },
)
```

Request a fresh native fallback device before reconnecting. Its opaque selector
is single-use and is not a durable hardware identity.

## Rules

- Never use an empty filter for a broad device browser in production.
- Treat IDs and serial numbers as sensitive and non-durable.
- Validate protocol framing and bound transfer sizes in app code.
- Claim only required interfaces and release them before close.
- Handle detach, busy interfaces, driver ownership, stalls, and permission
  revocation.
- Always close in `finally`; the host releases fallback handles at teardown.

USB is partial on every platform because devices, drivers, webview support, and
OS policy vary.
