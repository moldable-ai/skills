# Native Bluetooth Low Energy

Declare `"bluetooth"` in `nativeHardware` and use the fallback-aware request
helper with restrictive filters and an explicit service allowlist.

```typescript
import { requestMoldableBluetoothWithFallback } from '@moldable-ai/ui'

const transport = await requestMoldableBluetoothWithFallback({
  filters: [{ services: ['180d'] }],
  optionalServices: ['180f'],
})

if (transport.kind === 'desktop-bridge') {
  const device = transport.device
  try {
    const services = await device.getServices()
    const value = await device.read('180f', '2a19')
  } finally {
    await device.disconnect()
  }
}
```

When Web Bluetooth is available, the transport contains the standard-shaped
selected device. Use `getMoldableBluetoothAvailability()` for adapter status,
`requestMoldableBluetoothDevice()` for the direct Web Bluetooth chooser,
`connectMoldableBluetoothDevice()` to connect, and
`getMoldableBluetoothCharacteristic()`, `readMoldableBluetoothValue()`,
`writeMoldableBluetoothValue()`, and
`observeMoldableBluetoothNotifications()` for GATT operations. The desktop
fallback returned by `requestMoldableBluetoothWithFallback()` provides the
equivalent allowed-service discovery, read/write, notification observation, and
disconnect operations through its scoped device.

## Connection lifecycle

The desktop fallback exposes `device.connected` and emits one
`gattserverdisconnected` event after an explicit disconnect, physical peripheral
loss, or adapter loss. The event also tears down local notification observers;
later GATT operations reject until the app requests a new connection.

```typescript
device.addEventListener(
  'gattserverdisconnected',
  () => {
    stopBluetoothWork()
    showDisconnectedState()
  },
  { once: true },
)
```

Treat the event as final for that desktop connection and request a new device
instead of silently reconnecting.

## Rules

- The native fallback rejects `acceptAllDevices`; always filter by service,
  exact name, or name prefix. Manufacturer/service data filters are not yet
  supported by that fallback.
- Put every service the app will access in the requested/optional allowlist.
- Values are limited to 512 bytes; validate characteristic framing and content.
- Await the async cleanup returned by `observe()` before disconnecting.
- Treat names and connection IDs as non-durable, handle adapter-off and
  disconnect states, and avoid silent reconnect loops.
- This contract is Bluetooth Low Energy GATT, not Bluetooth Classic.

Bluetooth is partial on every platform because adapters, OS policy, runtime
support, services, and physical devices vary.
