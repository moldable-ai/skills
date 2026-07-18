# Native APIs on Windows

Windows implementations and CI coverage exist, but Windows installers are not
currently published. Treat packaged hardware behavior as preview until Windows
sidecars, signing, updater output, and the release QA matrix are complete.

## Current paths

- Camera, microphone, display capture, location, clipboard text, notifications,
  and display geometry use typed helpers. Windows privacy settings,
  organization policy, remote sessions, and WebView2 can change availability.
- Global shortcuts, power state, idle state, and sleep blockers have native
  implementations.
- Session events are partial: power-source events exist, while lock and suspend
  behavior still needs packaged runtime validation.
- Local authentication has a Windows Hello `UserConsentVerifier` backend and is
  preview/partial pending packaged hardware validation.
- Secure storage uses Windows Credential Manager.
- Haptics and native system-audio capture are unsupported.
- USB, HID, serial, MIDI, and Bluetooth LE are partial hybrid paths whose
  behavior depends on WebView2/native fallback support, drivers, hardware, and
  consent.

## App rules

- Declare embedded device API use in `nativeHardware`; never assume a Chromium
  API is enabled merely because WebView2 can implement it.
- Expect global or per-desktop-app privacy switches and managed-device policy.
- Handle remote-session differences and device contention.
- Do not publish a Windows support claim based on compilation alone.
