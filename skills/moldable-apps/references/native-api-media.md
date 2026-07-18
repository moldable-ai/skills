# Native Media

Use the media helpers from `@moldable-ai/ui` for camera, microphone, and display
capture. They return standard `MediaStream` objects and preserve familiar web
constraints.

Declare each browser media source the app uses in `nativeHardware`: `camera`,
`microphone`, and/or `screen-capture`. The declaration delegates the browser
capability but does not replace the browser/OS prompt or system-owned capture
picker. The typed system-audio host API uses its own scoped App Access grant and
does not add a `nativeHardware` value.

```typescript
import {
  enumerateMoldableMediaDevices,
  getMoldableCameraStream,
  getMoldableDisplayStream,
  getMoldableMediaPermissionDiagnostics,
  getMoldableMediaPermissionStatus,
  getMoldableMicrophoneStream,
  getMoldableNativeCapabilities,
  getMoldableSystemAudioCapabilities,
  getMoldableSystemAudioStatus,
  replayMoldableSystemAudioFrames,
  requestMoldableMediaPermission,
  requestMoldableSystemAudioPermission,
  startMoldableSystemAudioCapture,
  stopMoldableMediaStream,
  stopMoldableSystemAudioCapture,
  subscribeMoldableSystemAudioEvents,
  supportsNativeHardwareCapability,
} from '@moldable-ai/ui'
```

## Native permission status on macOS

Read native authorization without opening hardware or prompting:

```typescript
const camera = await getMoldableMediaPermissionStatus('camera')

if (camera.status === 'not-determined') {
  // Keep the action enabled and explain why the OS prompt will appear.
}
```

From the user's click handler, request `camera`, `microphone`, or
`screen-recording` explicitly:

```typescript
const permission = await requestMoldableMediaPermission("microphone");
if (permission.status !== "granted") {
  // Render a denial/settings fallback; do not loop or auto-prompt.
  return;
}
```

`getMoldableMediaPermissionDiagnostics()` returns a current snapshot for all
three permissions. Its `captureSourceBoundary` is `system-picker`: the API does
not list screens/windows, return thumbnails, or replace display source consent.
On Windows and Linux these native permission helpers return `unsupported`; use
the standard media helpers and their webview permission behavior there.

## Discover devices

```typescript
const native = await getMoldableNativeCapabilities();
if (
  !supportsNativeHardwareCapability(native, "camera") &&
  !supportsNativeHardwareCapability(native, "microphone")
)
  return;

const devices = await enumerateMoldableMediaDevices();
const cameras = devices.filter((device) => device.kind === "videoinput");
const microphones = devices.filter((device) => device.kind === "audioinput");
```

Device labels can be blank until the user grants a media permission. Persist a
device ID only as a preference, then recover if it disappears.

## Camera

```typescript
const stream = await getMoldableCameraStream({
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: 'user',
})

videoElement.srcObject = stream
await videoElement.play()
```

## Microphone

```typescript
const stream = await getMoldableMicrophoneStream({
  echoCancellation: true,
  noiseSuppression: true,
})
```

Do not assume browser voice processing is appropriate for music, measurement, or
source-separated recording. Give advanced recorder apps an explicit capture-mode
choice.

## Display capture

```typescript
const stream = await getMoldableDisplayStream({
  video: true,
  audio: false,
})
```

The operating system or webview owns the source picker. Do not build a fake
screen/window list; the current API intentionally leaves selection to the
system/runtime picker.
Display-audio availability varies; feature-detect the returned audio tracks.

## Stop capture

```typescript
stopMoldableMediaStream(stream)
videoElement.srcObject = null
```

Stop every stream when the user stops capture, the component unmounts, the app
moves to the background, or an error makes the stream unusable.

## System audio on macOS

The typed system-audio helpers provide an owner-scoped capture session on macOS.
They can emit system audio alone or keep native microphone and system audio as
separate sources. The API returns interleaved signed 16-bit little-endian PCM,
not a `MediaStream`. Its runtime capability ID is `system-audio`.

Read support without prompting:

```typescript
const support = await getMoldableSystemAudioCapabilities();
if (!support.available) {
  // Show support.capabilities.degradedReason or permission guidance.
  return;
}
```

Permission and start requests must each run directly from a user action. The
first privileged request also uses Moldable's per-app, per-workspace grant UI.
After a first-time OS permission prompt, render a separate Start action rather
than assuming activation survives the system UI.

```typescript
async function enableSystemAudioFromUserAction(signal: AbortSignal) {
  const permission = await requestMoldableSystemAudioPermission({ signal })
  return permission.available
}
```

After Enable succeeds, start capture from the next click or keyboard action.
Subscribe before starting so the first lifecycle event is observable, and clean
up immediately if start fails:

```typescript
const abortController = new AbortController()

const unsubscribe = subscribeMoldableSystemAudioEvents(
  (event) => {
    if (event.kind === 'data') {
      // event.source is 'system' or 'microphone'.
      // event.sequence supports gap detection.
      // event.data is an ArrayBuffer containing interleaved Int16 LE PCM bytes.
    } else if (event.kind === 'error') {
      // Treat interruption and recoverable degradation as normal states.
    }
  },
  { signal: abortController.signal },
)

let capture
try {
  capture = await startMoldableSystemAudioCapture({
    captureMode: 'systemMicrophone',
    sampleRate: 48_000,
    channels: 1,
    signal: abortController.signal,
  })
} catch (error) {
  unsubscribe()
  abortController.abort()
  throw error
}
```

`capture` is `{ started: true; sessionId: string }`; a start that cannot become
active rejects instead of resolving a false success. Use
`captureMode: 'systemAudio'` for system audio only; `systemMicrophone` does not
require a browser `microphone` declaration unless the app separately uses the
browser microphone helpers. If event sequence numbers show a gap, replay up to
500 frames from the native owner-scoped buffer into the active subscription:

```typescript
await replayMoldableSystemAudioFrames({
  afterSequence: lastSequence,
  limit: 100,
  signal: abortController.signal,
})

const status = await getMoldableSystemAudioStatus()
```

Stop explicitly and clean up on unmount. The desktop also stops an owned session
when the view reloads, closes, changes workspace, or loses its generation.

```typescript
try {
  await stopMoldableSystemAudioCapture({ reason: 'recording-complete' })
} finally {
  unsubscribe()
  abortController.abort()
}
```

Do not copy or send desktop messages yourself. Treat unsupported,
permission-denied, interrupted, and degraded capture as normal states. Windows
and Linux system-audio capture remain unsupported by the current app API.

See [Native API support](native-api-support.md) and the platform notes for
[macOS](native-api-platform-macos.md),
[Windows](native-api-platform-windows.md), and
[Linux](native-api-platform-linux.md).
