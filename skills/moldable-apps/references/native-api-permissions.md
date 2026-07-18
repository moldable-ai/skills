# Native Hardware Permissions

Native access has three independent layers: runtime capability discovery,
manifest delegation for embedded web APIs, and user/OS approval.

## Declare embedded web capabilities

Add only the browser-delegated capabilities an app uses to `moldable.json`:

```json
{
  "name": "Field Console",
  "nativeHardware": [
    "camera",
    "microphone",
    "screen-capture",
    "location",
    "clipboard-read",
    "clipboard-write",
    "usb",
    "hid",
    "serial",
    "midi",
    "bluetooth"
  ]
}
```

The allowlist is exactly the values above. `screen-capture` delegates the
browser's `display-capture` policy and `location` delegates `geolocation`.
Declarations are deduplicated, unknown values are ignored, and omission means
no sensitive browser capability is delegated. Restart or reload the app after
changing the manifest so its iframe is created with the new Permissions Policy.

A declaration is not permission. It only allows the embedded app to attempt the
corresponding web API. Browser-owned media streams and permission prompts stay
in the webview; an OS chooser and Moldable's native-fallback grant can still be
required.

## Per-app grants

Privileged host requests are approved per caller app, workspace, and capability.
Grant scopes use `native-hardware.<capability>`, for example:

- `native-hardware.global-shortcuts`
- `native-hardware.sleep-blocker`
- `native-hardware.local-authentication`
- `native-hardware.camera`
- `native-hardware.microphone`
- `native-hardware.screen-capture`
- `native-hardware.system-audio`
- `native-hardware.secure-storage`
- `native-hardware.usb`

Moldable derives caller identity from the hosting app view. Never add an app ID,
workspace ID, raw Tauri invocation, or copied host protocol to app code. Denied
grants reject with a structured `permission_denied` error.

Camera, microphone, and screen-capture grants apply when an app explicitly asks
Moldable to request the native macOS permission. Reading current permission
status does not open hardware or create a grant. The later media stream call is
still governed by the webview/OS media policy and system source picker.

Location follows the same separation: reading authorization status is
non-prompting and does not create a grant, while requesting a current position
requires the scoped location grant, a visible view, and fresh user activation.

System-audio capability checks and stop requests are non-escalating. Permission,
start, status, and replay requests require the app's scoped `system-audio` grant;
permission and start also require a visible view and a direct user action.
The typed system-audio host API is not a browser delegation and `system-audio`
is not a `nativeHardware` manifest value. `captureMode: 'systemMicrophone'` does
not require a `microphone` declaration unless the app also uses the browser
microphone APIs.

Treat a first-time OS permission prompt and capture start as two user actions:
request permission from an Enable action, then render a Start action. If
permission is already granted, Start can remain the only prompting action.

## Request pattern

1. Check the runtime capability.
2. Explain what will happen and why.
3. Call the helper directly from a user action.
4. Let Moldable and the OS/webview own their approval UI.
5. Handle denial without automatically asking again.
6. Close or unregister explicitly; cleanup calls do not create a new grant.

Do not interpret a manifest declaration, active grant, or OS permission as proof
that compatible hardware is attached.
