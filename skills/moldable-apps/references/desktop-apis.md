# Moldable Desktop APIs

Use this page as a router. App code should prefer typed helpers from
`@moldable-ai/ui`; use a raw `postMessage` protocol only when its reference says
to do so.

## Choose an integration

| Need                                                                                | Reference                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Camera, microphone, screen capture, location, clipboard, notifications, or displays | [Native APIs](native-apis.md)                           |
| Check native support by operating system                                            | [Native API support](native-api-support.md)             |
| Open URLs, reveal files, control chat context, save files, or publish artifacts     | [Desktop message APIs](desktop-message-apis.md)         |
| Call another Moldable app                                                           | [App-to-app communication](app-to-app-communication.md) |
| Publish a public unlisted static output                                             | [Artifact publishing](artifact-publishing.md)           |

## Rules

- Feature-detect native work with `getMoldableNativeCapabilities()` before
  presenting a control.
- Call the typed `@moldable-ai/ui` helper instead of constructing its underlying
  host message.
- Ask for a protected resource only after a user action and explain why it is
  needed before the operating-system prompt appears.
- Treat permission denial and unsupported runtime capabilities as normal product
  states, not exceptional crashes.
