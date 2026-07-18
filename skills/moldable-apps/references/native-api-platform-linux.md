# Native APIs on Linux

Linux implementations are compile- and test-covered, but Linux installers are
not currently published. Runtime behavior varies by distribution, desktop,
compositor, X11/Wayland session, portal, WebKitGTK build, and system services.

## Current paths

- Camera, microphone, clipboard text, notifications, and display metadata are
  partial. Screen/window capture and native system audio are unsupported.
- Location remains runtime-gated and always needs manual entry fallback.
- Power state is supported. Global shortcuts, idle state, session events, and
  sleep blockers are partial because desktop/session services differ.
- Local authentication and haptics are unsupported.
- Secure storage is partial and requires a working Secret Service provider.
- USB and HID can depend on udev rules; serial can depend on group membership;
  MIDI depends on audio/MIDI services; Bluetooth LE depends on BlueZ and adapter
  policy. All five are partial hybrid paths.

## Validation rules

- Declare embedded device access in `nativeHardware` and use restrictive filters.
- Validate supported targets in representative X11 and Wayland sessions.
- Record distribution, desktop, compositor, webview, portal/service versions,
  installer type, and physical hardware.
- Do not promote a capability from partial based only on compilation.
