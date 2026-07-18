# Native API Support

This is the app-author contract. The runtime capability manifest is the final
authority for the current desktop, webview, policy, and hardware.

## Status key

- **Supported**: a typed app-facing path is implemented for the platform.
- **Partial**: a typed path exists, but a runtime, desktop service, hardware,
  driver, or packaged-validation limitation remains.
- **Unsupported**: the platform descriptor reports unavailable.

## Matrix

| Capability            | Public helper group               | macOS                   | Windows                 | Linux       |
| --------------------- | --------------------------------- | ----------------------- | ----------------------- | ----------- |
| Discovery             | `getMoldableNativeCapabilities()` | Supported               | Supported               | Supported   |
| Camera                | media + native permission helpers | Supported/runtime-gated | Supported/runtime-gated | Partial     |
| Microphone            | media + native permission helpers | Supported/runtime-gated | Supported/runtime-gated | Partial     |
| Screen/window capture | `getMoldableDisplayStream()`      | Partial                 | Partial                 | Unsupported |
| System audio          | typed capture/event helpers       | Supported/runtime-gated | Unsupported             | Unsupported |
| Current location      | location + authorization helpers  | Supported (native)      | Partial                 | Partial     |
| Clipboard read        | `readMoldableClipboardText()`     | Partial                 | Partial                 | Partial     |
| Clipboard write       | `writeMoldableClipboardText()`    | Supported               | Supported               | Partial     |
| Notifications         | notification helpers              | Supported               | Supported               | Partial     |
| Displays              | `getMoldableDisplays()`           | Supported               | Supported               | Partial     |
| Global shortcuts      | shortcut helpers                  | Supported               | Supported               | Partial     |
| Power state           | `getMoldablePowerState()`         | Supported               | Supported               | Supported   |
| Idle state            | idle helpers                      | Supported               | Supported               | Partial     |
| Session events        | `watchMoldablePowerSession()`     | Supported               | Partial                 | Partial     |
| Sleep blocker         | blocker helpers                   | Supported               | Supported               | Partial     |
| Local authentication  | local-auth helpers                | Supported               | Partial preview         | Unsupported |
| Haptics               | haptic helpers                    | Partial/request-only    | Unsupported             | Unsupported |
| Secure storage        | secure-storage helpers            | Supported               | Supported               | Partial     |
| USB                   | USB helpers, web/native           | Partial                 | Partial                 | Partial     |
| HID                   | HID helpers, web/native           | Partial                 | Partial                 | Partial     |
| Serial                | serial helpers, web/native        | Partial                 | Partial                 | Partial     |
| MIDI                  | MIDI helpers, web/native          | Partial                 | Partial                 | Partial     |
| Bluetooth LE          | Bluetooth helpers, web/native     | Partial                 | Partial                 | Partial     |

Every status above mirrors the runtime descriptor for that platform. `Supported`
still does not guarantee permission or attached hardware; `Partial` additionally
records a known transport, service, or validation limitation in the descriptor's
`reason`. Windows local authentication has a Windows Hello backend but remains
preview/partial until packaged hardware validation. Windows and Linux installers
are not part of the current artifact release.

The current thermal query and thermal change events use the supported macOS
process thermal-state API. A speed-limit change event is intentionally absent:
macOS does not provide a stable, supported signal for it.

## Permission and declaration summary

| Capability                                                                             | Gate                                                                                                 | Required app behavior                                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Camera, microphone, capture, location                                                  | OS/webview permission                                                                                | Ask from a clear action; stop streams; provide denial fallback.              |
| Native system audio                                                                    | Per-app workspace grant and macOS Screen & System Audio Recording permission                         | Start from a clear action; stop explicitly; handle interruption/degradation. |
| Clipboard                                                                              | focus/user gesture may apply                                                                         | Never poll; make Copy/Paste explicit.                                        |
| Notifications                                                                          | OS permission and app grant for request/send                                                         | Request in context; avoid sensitive lock-screen text.                        |
| Displays, shortcuts, power/idle/session, blockers, local auth, haptics, secure storage | Per-app workspace grant for privileged operations; read-only availability/diagnostics may be ungated | Explain the purpose; handle revocation/denial; release resources.            |
| USB, HID, serial, MIDI, Bluetooth                                                      | `nativeHardware` declaration, per-app grant for native fallback, chooser/OS permission               | Use restrictive filters; show a selector when required; close every handle.  |

See [Permission grants and manifests](native-api-permissions.md) for the exact
manifest format and grant boundary.

## General exclusions

The public API does not provide arbitrary Tauri access, input injection,
background location, clipboard monitoring, classic Bluetooth, unrestricted
device paths, contacts/calendar CRUD, or a general speech-recognition API.
