# Native Clipboard Text

The clipboard API intentionally handles text only.

Declare `clipboard-read`, `clipboard-write`, or both in `nativeHardware`,
matching the operations the app actually exposes.

```typescript
import {
  readMoldableClipboardText,
  writeMoldableClipboardText,
} from '@moldable-ai/ui'

await writeMoldableClipboardText('Copied from my Moldable app')
const text = await readMoldableClipboardText()
```

## Rules

- Read only from an explicit Paste, Import, or Inspect clipboard action.
- Write only from an explicit Copy action and show brief success feedback.
- Never poll the clipboard.
- Do not log clipboard contents or include them in analytics.
- Validate and constrain pasted text before treating it as a URL, filename,
  command, or markup.
- Expect read access to require focus, a user gesture, or platform approval.
- Treat an empty string as valid clipboard content, not necessarily an error.

Images, HTML, rich text, files, custom formats, pasteboard history, and change
events are not part of the app contract.

See [Native API support](native-api-support.md) for current platform status.
