# Desktop Message APIs

These integrations predate the typed native-capability layer. Apps communicate
with the Moldable desktop using `window.parent.postMessage()`.

Prefer an exported `@moldable-ai/ui` helper when one exists, such as
`downloadFile()` or `publishMoldableArtifact()`.

## Open an external URL

```typescript
window.parent.postMessage(
  { type: 'moldable:open-url', url: 'https://example.com' },
  '*',
)
```

## Reveal a file or folder

```typescript
window.parent.postMessage(
  { type: 'moldable:show-in-folder', path: '/path/to/file.mp4' },
  '*',
)
```

The host opens Finder on macOS, Explorer on Windows, or the platform file
manager on supported Linux desktops.

## Populate the Moldable chat input

```typescript
window.parent.postMessage(
  { type: 'moldable:set-chat-input', text: 'Help me summarize this view' },
  '*',
)
```

This also expands the chat panel.

## Set app-specific chat context

```typescript
window.parent.postMessage(
  {
    type: 'moldable:set-chat-instructions',
    text: 'The user is viewing meeting 123.',
  },
  '*',
)

// Clear the context.
window.parent.postMessage(
  { type: 'moldable:set-chat-instructions', text: '' },
  '*',
)
```

The host clears these instructions when the user switches apps or workspaces.
Send only the minimum context the agent needs.

## Save a file

Use `downloadFile()` for normal exports:

```typescript
import { downloadFile } from '@moldable-ai/ui'

await downloadFile({
  filename: 'meeting-notes.md',
  data: '# Meeting notes\n',
  mimeType: 'text/markdown',
})
```

The helper wraps the `moldable:save-file` request/result protocol and falls back
to a browser download outside Moldable. It accepts `isBase64: true` for binary
content.

## Publish an artifact

Use `publishMoldableArtifact()` rather than calling the artifact service or
constructing `moldable:artifact-publish` messages. See
[Artifact publishing](artifact-publishing.md) for staging rules, security, and a
complete example.

## Raw-message safety

- The desktop accepts app messages only from its approved local app origins.
- File operations validate paths and reject traversal.
- Use a unique `requestId` for request/result protocols.
- Remove response listeners after success, error, or timeout.
- Never put service credentials in app messages.
