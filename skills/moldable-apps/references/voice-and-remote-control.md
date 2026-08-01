# Voice and remote control

Use this reference when an app must work well with Moldable Voice or the paired
iPhone remote. Build one workspace-scoped, app-owned semantic experience; do
not create separate desktop, phone, or relay implementations of behavior.

## Product surfaces

- Desktop apps open in dedicated windows by default and use their complete
  React interfaces.
- Voice mode is a host capability, not an app feature flag.
- A typed scope can declare `"surfaces": ["voice"]` when its interface is
  compatible with Voice, independently of risk. People decide which eligible
  low-risk scopes are **in prompt** for the fast path in each workspace;
  important and destructive scopes stay on demand with confirmation. See
  [app-to-app communication](app-to-app-communication.md#interface-eligibility).
- Moldable for iOS is a paired SwiftUI observer, not a second app runtime. For
  iPhone-originated structured results, use `nativeUI`; follow
  [native-ui.md](native-ui.md), [native-ui-patterns.md](native-ui-patterns.md),
  and [native-ui-catalog.md](native-ui-catalog.md).

## One semantic experience

The paired Mac owns workspace state, conversations, agent execution,
approvals, files, and authoritative app APIs. Desktop, Voice, and iPhone are
different materializations of that state.

1. Put important verbs behind the app's workspace-scoped typed API. New apps
   implement the drive capability and its `ui.describe`, `ui.navigate`, and
   `ui.read` scopes; see
   [app-to-app-communication.md](app-to-app-communication.md#drive-contract-voice--chat-steering).
2. Give interfaces stable semantic actions with bounded identifying context.
   Never expose arbitrary RPC names, paths, secrets, or mutable state as the
   action contract.
3. Route each meaningful action into the visible conversation once. The agent
   resolves it through the app API, then projects authoritative state to every
   observer. Do not add a phone-only mutation path.
4. After an app API call, clients react to `moldable:app-api-changed` for the
   exact app/workspace and refresh affected state.

NativeUI uses A2UI v1.0 as its component/data protocol. Relay delivery, the
`nativeUI` tool envelope, revisions, safe asset aliases, render traces,
PageDeck prefetch, and Voice response policy are Moldable extensions. Keep
those extensions out of app domain contracts.

## Voice observation versus response

- Active Voice passively subscribes to finalized semantic events in its exact
  workspace/conversation: bounded user messages, completed assistant messages,
  meaningful UI actions, confirmed presentations, and authoritative app-state
  events.
- Observation updates context and must not itself produce speech. A response
  requires an explicit continuation/response path.
- A NativeUI action explicitly requesting spoken help may set the scalar event
  context value `"voiceResponse": "respond-after-agent"`. The host first lets
  the chat agent obtain the authoritative result, then emits the response-now
  continuation to Voice. Omitted means observation-only.
- Never infer response policy from labels. Navigation, selection, mutation,
  approval, next/previous, and refresh actions remain observation-only.
- Voice-originated delegations already have a speakable terminal return; do not
  echo them through passive context. Reconnect replay is observation-only, so a
  historical response request cannot speak twice.
- Project bounded semantic summaries with stable source IDs, cursors, and
  deduplication keys. Do not project token deltas, raw component trees, opaque
  tool payloads, or binary media into Voice context.

## Remote boundaries

- Desktop and iPhone establish paired encrypted Relay sessions. Relay forwards
  bounded ciphertext and routing metadata; it is not an app backend, database,
  file store, or general-purpose app RPC channel.
- iPhone Voice negotiates with desktop, while microphone audio and realtime
  provider traffic travel directly between phone and provider over WebRTC.
  Relay carries bounded control, SDP, delegation intent/result, and replay.
- Use voice-friendly semantic actions and succinct stateful results. Voice can
  steer the same experience as chat; apps do not implement a separate audio
  protocol.
- Keep binary data out of conversation and A2UI streams. The host converts
  app-owned images into safe `asset:<alias>` references; opaque authorization
  stays host-private. Never send base64, paths, credentials, or arbitrary URLs.

## Progressive native presentation

When an iOS turn requests a visual result, the host may show a native
preparation state immediately. The first valid component tree renders before
noncritical assets arrive. Image slots reserve final geometry, show automatic
native skeletons, fetch/verify/cache in parallel, and hydrate independently.
The first-frame acknowledgement and later asset-hydration traces remain
distinct so latency is diagnosable.

For predictable read-only navigation, the Moldable PageDeck extension may
prefetch a bounded frontier. It does not predict mutations or fresh app state.
Record navigation in conversation even when the local page transition is
instant.

## Recovery and delivery

Remote Voice uses a session sequence cursor. iPhone reconnects, renegotiates
its provider epoch when needed, and requests bounded replay after its last
accepted sequence. Desktop may require reset when retained state is unusable.
Make retried app operations idempotent where needed and treat replay as
delivery recovery, not another user request.

Native surfaces are scoped to workspace and conversation. Asset fetches are
verified against the active view, asset ID, and SHA-256; render acknowledgement
is valid only for the current revision. On stale projection, missing asset, or
disconnect, re-read app state and re-project it—never guess or mutate from the
client.

## Current limits

- Remote control supports the paired first-party iPhone client, not arbitrary
  clients or direct app-server control.
- Use only components advertised by the active renderer. Keep unsupported
  experiences in conversation instead of inventing components or silently
  falling back to desktop.
- Audio, video, and WebView remain unavailable to agents until verified asset,
  lifecycle, and security contracts ship.
- Voice still depends on desktop connector capability plus normal device and
  provider connectivity. Report unavailability honestly.
