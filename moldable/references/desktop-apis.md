# Moldable Desktop APIs

Apps communicate with the Moldable desktop via `window.parent.postMessage()`. The desktop listens for specific message types and performs actions.

## Available APIs

### moldable:open-url

Open an external URL in the system's default browser.

```typescript
window.parent.postMessage({
  type: 'moldable:open-url',
  url: 'https://example.com'
}, '*')
```

### moldable:show-in-folder

Reveal a file or folder in the system file manager (Finder on macOS).

```typescript
window.parent.postMessage({
  type: 'moldable:show-in-folder',
  path: '/path/to/file.mp4'
}, '*')
```

**Use case**: Let users quickly access exported files, recordings, or downloads.

### moldable:set-chat-input

Populate the floating chat input with suggested text. Also opens/expands the chat panel.

```typescript
window.parent.postMessage({
  type: 'moldable:set-chat-input',
  text: 'Help me fix the bug in...'
}, '*')
```

**Use case**: Pre-populate prompts based on app context (e.g., "Summarize this meeting").

### moldable:set-chat-instructions

Set app-specific context that's included in every chat request's system prompt. Cleared automatically when user switches apps or workspaces.

```typescript
// Set instructions
window.parent.postMessage({
  type: 'moldable:set-chat-instructions',
  text: `The user is viewing meeting #123 from 2024-01-15.
Transcript: "Hello everyone, let's discuss Q1 goals..."`
}, '*')

// Clear instructions (empty or undefined text)
window.parent.postMessage({
  type: 'moldable:set-chat-instructions',
  text: ''
}, '*')
```

**Use case**: Provide app-specific context so the AI can answer questions about what the user is viewing.

### moldable:save-file

Prompt the user to save a file using the native save dialog.

```typescript
// Request ID for matching response
const requestId = crypto.randomUUID()

window.parent.postMessage({
  type: 'moldable:save-file',
  requestId,
  filename: 'meeting-notes.md',
  data: '# Meeting Notes\n\n...',
  mimeType: 'text/markdown',
  isBase64: false  // true if data is base64 encoded
}, '*')

// Listen for response
window.addEventListener('message', (event) => {
  if (event.data?.type === 'moldable:save-file-result' && 
      event.data?.requestId === requestId) {
    if (event.data.success) {
      console.log('File saved!')
    } else if (event.data.cancelled) {
      console.log('User cancelled')
    } else {
      console.error('Save failed:', event.data.error)
    }
  }
})
```

**Parameters**:
- `requestId`: Unique ID to match the response
- `filename`: Suggested filename with extension
- `data`: File content (string or base64)
- `mimeType`: MIME type for file filter (e.g., 'video/mp4', 'text/markdown')
- `isBase64`: Set to `true` if data is base64 encoded (for binary files)

**Use case**: Export transcripts, recordings, reports, or any user data.

## Security Notes

- Messages are only accepted from `http://127.0.0.1:*` and `http://localhost:*` origins
- File operations are sandboxed to prevent malicious access
- All path operations validate against directory traversal

## Example: Complete Integration

```tsx
// In a React component
function ExportButton({ recording }) {
  const handleExport = async () => {
    const requestId = crypto.randomUUID()
    
    // Save the file
    window.parent.postMessage({
      type: 'moldable:save-file',
      requestId,
      filename: `${recording.title}.mp4`,
      data: recording.base64Data,
      mimeType: 'video/mp4',
      isBase64: true
    }, '*')

    // Wait for response
    const result = await new Promise((resolve) => {
      const handler = (event) => {
        if (event.data?.type === 'moldable:save-file-result' &&
            event.data?.requestId === requestId) {
          window.removeEventListener('message', handler)
          resolve(event.data)
        }
      }
      window.addEventListener('message', handler)
    })

    if (result.success) {
      // Offer to show in Finder
      window.parent.postMessage({
        type: 'moldable:show-in-folder',
        path: result.path // If the desktop returns the saved path
      }, '*')
    }
  }

  return <button onClick={handleExport}>Export Recording</button>
}
```
