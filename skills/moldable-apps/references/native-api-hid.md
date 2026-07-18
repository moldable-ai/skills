# Native HID

Declare `"hid"` in `nativeHardware` and request only the device usages needed by
the feature.

```typescript
import {
  closeMoldableHidDevice,
  listenForMoldableHidInputReports,
  openMoldableHidDevice,
  requestMoldableHidDevices,
  sendMoldableHidReport,
} from "@moldable-ai/ui";

const [device] = await requestMoldableHidDevices({
  filters: [{ vendorId: 0x1234, productId: 0x0001 }],
});
if (!device) return;

await openMoldableHidDevice(device);
const stopReports = listenForMoldableHidInputReports(device, (event) => {
  consumeReport(event.reportId, event.data);
});
try {
  await sendMoldableHidReport(device, 1, new Uint8Array([0x01]));
} finally {
  stopReports();
  await closeMoldableHidDevice(device);
}
```

The helpers use WebHID when present and a scoped native fallback otherwise. Use
`receiveMoldableHidFeatureReport()` and `sendMoldableHidFeatureReport()` for
feature reports. `getMoldableHidDevices()`
lists browser-granted WebHID devices only and rejects with `unsupported` when
WebHID is absent. It does not run native discovery or turn the absence of a
passive grant registry into an empty list. Use `requestMoldableHidDevices()`
from a user action for native fallback discovery. `forgetMoldableHidDevice()`
revokes WebHID permission only when the runtime supports it; on the native
fallback it closes the scoped handle and does not revoke the app's Moldable
access grant.

## Connection lifecycle

Native fallback devices emit one `disconnect` event when the input pump or
another operation confirms physical removal. The fallback then reports
`device.opened === false`, stops its input pump, and rejects later I/O. Stop app
listeners and call `closeMoldableHidDevice()` to clean up the stale host handle.

```typescript
device.addEventListener(
  'disconnect',
  () => {
    stopReports()
    showDisconnectedState()
  },
  { once: true },
)
```

Request a fresh native fallback device before reconnecting. Its opaque selector
is single-use and is not a durable hardware identity.

## Rules

- Use vendor/product and, when supported, usage filters; exclude unrelated
  devices.
- Validate every report ID, length, and byte layout before acting on it.
- Do not treat product names or IDs as authentication.
- Stop input listeners before close and handle disconnect/reconnect explicitly.
- Avoid devices the OS reserves for core keyboard/mouse input.

HID is partial on every platform because visibility, drivers, OS reservations,
udev policy, and webview support vary.
