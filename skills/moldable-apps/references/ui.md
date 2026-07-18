# Moldable UI Components

Use `@moldable-ai/ui` for Moldable app UI. It provides shadcn/ui components, theme support, workspace integration, and Moldable desktop helpers.

## Required Setup

Apps scaffolded by Moldable already include this provider shape:

```tsx
// src/client/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, WorkspaceProvider } from '@moldable-ai/ui'
import { App } from './app'
import { QueryProvider } from './query-provider'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

```css
/* src/client/globals.css */
@import 'tailwindcss';
@import '@moldable-ai/ui/styles';
```

## Components

Import components from `@moldable-ai/ui`:

```tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  Tabs,
  Tooltip,
} from '@moldable-ai/ui'
```

## Hardware Components

`@moldable-ai/ui` also ships polished, drop-in components for every native
hardware capability — permission flows, device pickers, live states, and error
handling built in. **Prefer these over hand-rolling UI on the imperative
`getMoldable*` helpers.**

```tsx
import {
  // Full surfaces (one per capability)
  CameraPreview,        // live camera: device switching, snapshots, permission states
  MicrophoneMeter,      // live input level visualizer
  ScreenSharePreview,   // display capture surface
  SystemAudioMonitor,   // macOS system-audio capture + level meter
  LocationPanel,        // one-shot position with mono coordinate readout
  PowerPanel, BatteryGauge,
  DisplayMap,           // to-scale monitor arrangement map
  NotificationsPanel,
  SecureStoragePanel,
  SerialConsole,        // terminal-style RX/TX console
  UsbDevicePanel, HidDevicePanel,
  MidiMonitor, BluetoothPanel,
  CapabilityMatrix,     // support grid for all 22 capabilities
  // Controls
  LocalAuthButton,      // Touch ID / Windows Hello
  HapticButton, ClipboardCopyButton, ShortcutRecorder,
  // Building blocks for custom hardware UI
  CapabilityBadge, HardwarePanel, DeviceList, StreamLog, Readout, LiveIndicator,
  // Hooks (same state machines, bring your own UI)
  useMoldableCapability, useMoldableCamera, useMoldableMicrophone,
  useMoldableScreenShare, useMoldableSystemAudio, useMoldableLocation,
  useMoldableDisplays, useMoldableNotifications, useMoldablePower,
  useMoldableLocalAuth, useMoldableHaptics, useMoldableSecureStorage,
  useMoldableUsb, useMoldableHid, useMoldableSerial, useMoldableMidi,
  useMoldableBluetooth, useMoldableClipboard, useMoldableGlobalShortcut,
} from '@moldable-ai/ui'
```

Every component degrades gracefully outside Moldable and handles
checking/unsupported/denied/idle/active/error states itself. The hooks listed
above expose the same state machines when you need custom visuals.

Discover props and patterns by reading the source — one file per capability in
`node_modules/@moldable-ai/ui/dist/components/hardware/` (or
`packages/ui/src/components/hardware/` in the desktop repo; start with its
`README.md`). The `native-lab-*` apps in `shared/apps/` are working examples.

## Semantic Colors

Always use semantic colors:

```tsx
// Correct
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />

// Wrong
<div className="bg-white text-gray-900" />
```

## Workspace Integration

```tsx
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@moldable-ai/ui'

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()

  const { data } = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: async () => {
      const res = await fetchWithWorkspace('/api/items')
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })
}
```

## Desktop Communication

```tsx
import { downloadFile, isInMoldable, sendToMoldable } from '@moldable-ai/ui'

if (isInMoldable()) {
  sendToMoldable({ type: 'moldable:open-url', url: 'https://example.com' })
}

await downloadFile({
  filename: 'data.csv',
  data: 'name,value\nfoo,1',
  mimeType: 'text/csv',
})
```

## Commands

Apps can add app-specific actions to the desktop Cmd+K menu. The desktop
fetches commands from the active app's Hono server at
`GET /api/moldable/commands` and includes the current workspace in the
`x-moldable-workspace` header. Use `getWorkspaceFromRequest(c.req.raw)` when
commands depend on workspace-scoped state.

```ts
// src/server/app.ts
app.get('/api/moldable/commands', (c) => {
  return c.json({
    commands: [
      {
        id: 'add-item',
        label: 'Add New Item',
        shortcut: 'n',
        icon: 'plus',
        group: 'Actions',
        action: { type: 'message', payload: { action: 'add' } },
      },
    ],
  })
})
```

For dynamic lists, return one command per item and use `action.command` to send
all items to the same client handler with different payloads. `description` is
shown as muted secondary text and is also searchable. `indicator` renders an
app-defined visual marker next to the command label; include a human-readable
`label` for accessibility and hover help.

```ts
app.get('/api/moldable/commands', async (c) => {
  const workspaceId = getWorkspaceFromRequest(c.req.raw)
  const repos = await getRecentRepos(workspaceId)

  return c.json({
    commands: repos.map((repo) => ({
      id: `switch-repository:${encodeURIComponent(repo.path)}`,
      label: repo.name,
      description: repo.path,
      icon: 'folder',
      indicator: repo.isDirty
        ? {
            type: 'dot',
            label: 'Has uncommitted changes',
            color: 'var(--primary)',
          }
        : undefined,
      group: 'Repositories',
      action: {
        type: 'message',
        command: 'switch-repository',
        payload: { repoPath: repo.path },
      },
    })),
  })
})
```

```tsx
import { useMoldableCommands } from '@moldable-ai/ui'

function App() {
  useMoldableCommands({
    'add-item': () => setShowAddForm(true),
    'switch-repository': (payload) => {
      const repoPath = (payload as { repoPath?: unknown } | null)?.repoPath
      if (typeof repoPath === 'string') switchRepository(repoPath)
    },
  })
}
```

Supported action types:

- `message`: posts `moldable:command` to the app iframe.
- `navigate`: changes the active iframe path.
- `focus`: shorthand for a focus-target message.

Known icon keys include `plus`, `trash-2`, `filter`, and `folder`. Add new
keys to `desktop/src/components/global-command-menu.tsx` when an app needs a
new Lucide icon.

## Home: the Today view

The home screen is the host-rendered **Today** view. An app participates by implementing
`GET /api/moldable/today` — returning something only when it genuinely needs the user
(quiet by default). See [today.md](today.md) for the contribution contract, return shape,
and examples.

## Markdown And Rich Text

```tsx
import { Markdown } from '@moldable-ai/ui'
import { MarkdownEditor } from '@moldable-ai/editor'
```

Use `Markdown` for read-only rendered markdown and `MarkdownEditor` for editable markdown/prose. Do not build markdown editors with raw `contenteditable` or a textarea when `@moldable-ai/editor` fits the job.

Import the editor styles in `src/client/globals.css`:

```css
@import '@moldable-ai/editor/styles';
@source '../../node_modules/@moldable-ai/editor/dist/**/*.{js,jsx,ts,tsx}';
```

For code, SQL, JSON, config, scripts, and other syntax-heavy editing, use Monaco through `@monaco-editor/react` instead of a textarea.

```bash
pnpm add @monaco-editor/react monaco-editor
```

Use Monaco in a stable-height pane with `height="100%"`, `automaticLayout: true`, Moldable light/dark themes from `useTheme().resolvedTheme`, and semantic Moldable UI for the surrounding toolbar/status/result surfaces. See [design.md](design.md) for the full editor patterns.
