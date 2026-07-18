# Native APIs on macOS

macOS is the shipping packaged desktop target. Always feature-detect at runtime
and complete packaged-app hardware QA for the exact release build.

## Supported paths

- Camera, microphone, display capture, location, clipboard text, notifications,
  and display geometry use typed app helpers; privacy settings and hardware can
  still make a request unavailable.
- Camera, microphone, and screen-recording expose native permission status,
  explicit request, and diagnostic helpers. These do not enumerate capture
  sources; source choice remains in the system/webview picker.
- System audio has typed capability, permission, capture, status, replay, and
  event helpers. Capture events can keep system and microphone PCM separated.
- Global shortcuts, power state, current thermal state, idle state,
  lock/unlock/suspend/resume events, and sleep blockers have scoped native
  implementations. macOS does not expose a stable, supported speed-limit
  change signal, so the app API does not synthesize one.
- Local authentication uses the system authentication prompt. Apps receive only
  an outcome and method, never biometric data.
- The haptic request API is available, but physical feedback remains unknown
  because macOS does not expose a reliable hardware or completion probe.
- Secure storage uses the user's OS credential store and is isolated by trusted
  app/workspace identity.
- USB, HID, serial, MIDI, and Bluetooth LE are partial hybrid APIs. The helper
  uses a standard web API when present and otherwise a scoped desktop fallback.

## Permission behavior

- Camera and microphone can be changed under **System Settings → Privacy &
  Security → Camera/Microphone**.
- Display and existing system-audio capture can require **Screen & System Audio
  Recording** permission and a desktop restart after settings changes.
- Location depends on Location Services.
- Notifications can be disabled, silenced by Focus, or hidden on the lock screen.
- Bluetooth needs a working adapter and OS consent. USB/HID/serial/MIDI access
  also depends on the device, driver, ownership, and contention.

## App rules

- Declare embedded USB/HID/serial/MIDI/Bluetooth access in `nativeHardware`.
- Do not treat display names, device IDs, serial numbers, MIDI port names, or BLE
  names as durable identity.
- Release blockers, shortcut registrations, event subscriptions, ports, devices,
  and BLE connections before unmount; the desktop also cleans up on teardown.
- Subscribe before starting system audio, detect event sequence gaps, and stop
  the owned session explicitly before unmount.
