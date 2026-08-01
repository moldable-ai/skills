# Native Hardware Permissions

Native access has three independent layers: runtime capability discovery,
manifest delegation for embedded web APIs, and user/OS approval.

## Declare native capabilities

Add every native capability an app invokes to `moldable.json` under
`nativeCapabilities`:

```json
{
  "name": "Field Console",
  "nativeCapabilities": [
    "camera",
    "microphone",
    "screen-capture",
    "system-audio",
    "location",
    "clipboard-read",
    "clipboard-write",
    "notifications",
    "displays",
    "global-shortcuts",
    "power-monitor",
    "idle-state",
    "session-events",
    "sleep-blocker",
    "local-authentication",
    "haptics",
    "secure-storage",
    "usb",
    "hid",
    "serial",
    "midi",
    "bluetooth"
  ]
}
```

The values above are the native hardware capability IDs documented here.
`screen-capture` delegates the browser's `display-capture` policy and `location`
delegates `geolocation`. Declarations are deduplicated, unknown values are
ignored, and omission prevents the host request and sensitive browser delegation
for that capability. Restart or reload the app after changing the manifest so
its iframe is created with the new Permissions Policy.

A declaration is not permission. The host delegates the matching iframe
Permissions Policy token only when the app also has the corresponding active
App Access grant. Browser-owned media streams and permission prompts stay in
the webview; an OS chooser can still be required.

## Per-app grants

Privileged host requests are approved per caller app, workspace, and capability.
Grant scopes use `native-capabilities.<capability>`, for example:

- `native-capabilities.global-shortcuts`
- `native-capabilities.sleep-blocker`
- `native-capabilities.local-authentication`
- `native-capabilities.camera`
- `native-capabilities.microphone`
- `native-capabilities.screen-capture`
- `native-capabilities.system-audio`
- `native-capabilities.secure-storage`
- `native-capabilities.usb`

Moldable derives caller identity from the hosting app view. Never add an app ID,
workspace ID, raw Tauri invocation, or copied host protocol to app code. Denied
grants reject with a structured `permission_denied` error.

Camera, microphone, and screen-capture grants apply when an app explicitly asks
Moldable to request the native macOS permission. Reading current permission
status does not open hardware or create a grant. The later media stream call is
still governed by the webview/OS media policy and system source picker.

Location follows the same separation: reading authorization status is
non-prompting and does not create a grant, while requesting a current position
requires the scoped location grant and a visible view. A first-time grant
requires a direct user action; keep location requests user-triggered so any
operating-system approval UI has the expected context.

System-audio capability checks and stop requests are non-escalating. Permission,
start, status, and replay requests require the app's scoped `system-audio` grant;
permission and start also require a visible view and a direct user action.
The typed system-audio host API is not a browser delegation, but it still
requires the `system-audio` `nativeCapabilities` declaration. `captureMode:
'systemMicrophone'` does not require the separate `microphone` declaration
unless the app also uses the browser microphone APIs.

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
