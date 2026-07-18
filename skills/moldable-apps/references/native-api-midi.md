# Native MIDI

Declare `"midi"` in `nativeHardware`. Use the fallback-aware entry point unless
the feature specifically requires the standard Web MIDI object model.

```typescript
import { requestMoldableMIDIWithFallback } from '@moldable-ai/ui'

const transport = await requestMoldableMIDIWithFallback({ sysex: false })

if (transport.kind === 'web-midi') {
  // Use getMoldableMIDIInputs/Outputs and openMoldableMIDIInput/Output.
} else {
  const output = await transport.access.requestPort('output')
  try {
    await output.send([0x90, 60, 100])
  } finally {
    await output.close()
  }
}
```

The web path also exports `requestMoldableMIDIAccess()`,
`getMoldableMIDIInputs()`, `getMoldableMIDIOutputs()`,
`observeMoldableMIDIState()`, `openMoldableMIDIInput()`, and
`openMoldableMIDIOutput()`. The desktop fallback exposes `requestPort()`,
`send()`, input `observeMessages()`, and `close()` through scoped opaque
handles. The fallback-aware access helper verifies the desktop bridge before
returning; it does not enumerate devices or open a port until `requestPort()` is
called.

## Rules

- Request from a user action. SysEx defaults to false; enable it only when the
  device workflow requires manufacturer-specific messages and explain why.
- Validate status/data bytes and bound messages; the fallback limit is 16,384
  bytes.
- Do not treat a port name or ID as stable identity.
- Close ports and remove state/message listeners on abort and unmount.
- Handle hotplug, reconnect, port contention, and unavailable MIDI services.

MIDI is partial on every platform because runtime support, services, devices,
and permission state vary.
