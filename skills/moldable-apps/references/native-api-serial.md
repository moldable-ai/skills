# Native Serial

Declare `"serial"` in `nativeHardware`, filter where possible, and request a port
from a direct user action.

```typescript
import {
  closeMoldableSerialPort,
  openMoldableSerialPort,
  readMoldableSerialPort,
  requestMoldableSerialPort,
  writeMoldableSerialPort,
} from '@moldable-ai/ui'

const port = await requestMoldableSerialPort({
  filters: [{ usbVendorId: 0x1234, usbProductId: 0x0001 }],
  selectNativePort: async (matches) => showSerialPicker(matches),
})

await openMoldableSerialPort(port, { baudRate: 115_200 })
try {
  await writeMoldableSerialPort(port, new Uint8Array([0x01, 0x0a]))
  const chunk = await readMoldableSerialPort(port)
} finally {
  await closeMoldableSerialPort(port)
}
```

The helpers prefer Web Serial and otherwise use an opaque native port. When
multiple native ports match, `selectNativePort` is required. Signal read/write,
port listing, and permission-forget helpers are also exported.
`getMoldableSerialPorts()` lists browser-granted Web Serial ports only and
returns an empty list on the native fallback. `forgetMoldableSerialPort()`
revokes browser permission only when the runtime supports it; on the native
fallback it closes the scoped handle and does not revoke the app's Moldable
access grant.

## Connection lifecycle

Native fallback ports expose `port.connected`. It becomes `false` and the port
emits one `disconnect` event when a read, write, or signal operation confirms
physical removal. Release stream readers/writers, stop app work, and then call
`closeMoldableSerialPort()` to clean up the stale host handle.

```typescript
port.addEventListener(
  'disconnect',
  () => {
    stopSerialWork()
    showDisconnectedState()
  },
  { once: true },
)

Request a fresh native fallback port before reconnecting. Its opaque selector is
single-use and is not a durable hardware identity.

## Rules

- Make baud rate, data bits, parity, stop bits, and flow control explicit for the
  device protocol.
- Implement framing, timeouts, maximum message size, and checksums above the byte
  stream.
- Treat received bytes as untrusted input.
- Abort reads during teardown and release all stream readers/writers before
  calling close.
- Handle detach, busy ports, driver errors, and Linux group membership.

Serial is partial on every platform because device drivers, ownership, webview
support, and hardware vary.
```
