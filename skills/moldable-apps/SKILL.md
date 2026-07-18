---
name: moldable
description: Complete guide for building Moldable apps. Use this skill when creating or modifying apps, implementing workspace-aware storage, using typed native APIs for media, location, clipboard, notifications, displays, shortcuts, power/session state, local authentication, haptics, secure storage, USB, HID, serial, MIDI, or Bluetooth, declaring nativeHardware permissions, integrating with Moldable desktop messages, publishing artifacts, configuring workspaces, managing skills/MCPs, or troubleshooting app issues.
---

# Moldable App Development

This skill provides comprehensive knowledge for building and modifying apps within the Moldable desktop application.

## Quick Reference

| Resource         | Path                                                        |
| ---------------- | ----------------------------------------------------------- |
| App source code  | `~/.moldable/shared/apps/{app-id}/`                         |
| App runtime data | `~/.moldable/workspaces/{workspace-id}/apps/{app-id}/data/` |
| Workspace config | `~/.moldable/workspaces/{workspace-id}/config.json`         |
| MCP config       | `~/.moldable/shared/config/mcp.json`                        |
| Skills           | `~/.moldable/shared/skills/{repo}/{skill}/`                 |
| Environment      | `~/.moldable/shared/.env`                                   |

## Default Tech Stack

- **Framework**: Vite + Hono + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (semantic colors only)
- **State**: TanStack Query v5
- **Storage**: Filesystem via `@moldable-ai/storage`
- **Dev Reloading**: Vite client HMR via Portless-aware `MOLDABLE_APP_URL`; Hono server reloads via `tsx watch`
- **Package Manager**: pnpm

## Creating Apps

**ALWAYS use the `scaffoldApp` tool** — never create app files manually.

```typescript
scaffoldApp({
  appId: 'expense-tracker', // lowercase, hyphens only
  name: 'Expense Tracker', // Display name
  icon: '💰', // Emoji icon
  description: 'Track expenses and generate reports',
  extraDependencies: {
    // Optional npm packages
    zod: '^3.0.0',
  },
})
```

**After scaffolding**, customize:

- `src/client/app.tsx` — Main app view
- `src/server/app.ts` or `src/server/routes/` — Hono API routes (including `/api/moldable/health` and `/api/moldable/today`)
- `src/client/components/` or `src/components/` — React components

### Today contribution

The home screen is the host-rendered **Today** view. Apps participate by implementing `GET /api/moldable/today`, which returns items/resume only when something genuinely needs the user (quiet by default). See [references/today.md](references/today.md).

## Detailed References

Read these for in-depth guidance:

### Core Concepts

- [references/app-lifecycle.md](references/app-lifecycle.md) — Creating, starting, managing, and deleting apps
- [references/app-scaffold.md](references/app-scaffold.md) — **Required files**, lint rules, templates for new apps
- [references/workspaces.md](references/workspaces.md) — Workspace system, data isolation, environment layering
- [references/configuration.md](references/configuration.md) — moldable.json, config.json, environment variables

### Implementation Patterns

- [references/design.md](references/design.md) — Moldable app design system for full app layouts, state handling, density, copy, motion, and UI polish. Read this before visible UI work.
- [references/today.md](references/today.md) — The **Today** home view: implementing `GET /api/moldable/today`, item kinds, actions, and the "quiet by default" rules.
- [references/ui.md](references/ui.md) — **@moldable-ai/ui components**, shadcn/ui, themes, rich text editor, Cmd+K app commands
- [references/storage-patterns.md](references/storage-patterns.md) — Filesystem storage, React Query, workspace-aware APIs
- [references/browser-storage-audit.md](references/browser-storage-audit.md) — Current browser storage usage and migration guidance
- [references/desktop-apis.md](references/desktop-apis.md) — Router for desktop integration APIs
- [references/desktop-message-apis.md](references/desktop-message-apis.md) — Window, chat, file, and artifact postMessage APIs
- [references/native-apis.md](references/native-apis.md) — Typed native capability API overview and usage rules
- [references/native-api-support.md](references/native-api-support.md) — Native capability support matrix and permission summary
- [references/native-api-permissions.md](references/native-api-permissions.md) — `nativeHardware` declarations and per-app workspace grants
- [references/native-api-media.md](references/native-api-media.md) — Camera, microphone, display capture, macOS permission status/request/diagnostics, and system audio
- [references/native-api-location.md](references/native-api-location.md) — Current-position API and permission behavior
- [references/native-api-clipboard.md](references/native-api-clipboard.md) — Native clipboard text APIs
- [references/native-api-notifications.md](references/native-api-notifications.md) — Native system notifications and permissions
- [references/native-api-displays.md](references/native-api-displays.md) — Connected display metadata
- [references/native-api-global-shortcuts.md](references/native-api-global-shortcuts.md) — Global shortcut registration, events, conflicts, and cleanup
- [references/native-api-power-session.md](references/native-api-power-session.md) — Power, current thermal and idle state, lifecycle events, plus queryable sleep blockers
- [references/native-api-local-authentication.md](references/native-api-local-authentication.md) — Biometric-only or device-owner verification policies
- [references/native-api-haptics.md](references/native-api-haptics.md) — API acceptance and honest physical-feedback semantics
- [references/native-api-secure-storage.md](references/native-api-secure-storage.md) — Scoped credential values and non-secret backend diagnostics
- [references/native-api-usb.md](references/native-api-usb.md) — Filtered WebUSB/native device access and transfers
- [references/native-api-hid.md](references/native-api-hid.md) — Filtered WebHID/native reports and listeners
- [references/native-api-serial.md](references/native-api-serial.md) — Web Serial/native ports, streams, and signals
- [references/native-api-midi.md](references/native-api-midi.md) — Web MIDI/native ports, messages, and SysEx rules
- [references/native-api-bluetooth.md](references/native-api-bluetooth.md) — Web Bluetooth/native BLE GATT access
- [references/native-api-platform-macos.md](references/native-api-platform-macos.md) — macOS permission and support notes
- [references/native-api-platform-windows.md](references/native-api-platform-windows.md) — Windows permission and support notes
- [references/native-api-platform-linux.md](references/native-api-platform-linux.md) — Linux runtime and validation notes
- [references/artifact-publishing.md](references/artifact-publishing.md) — Publishing public unlisted HTML/CSS/asset bundles through Moldable Artifacts
- [references/app-to-app-communication.md](references/app-to-app-communication.md) — App-to-app RPC, capability manifests, workspace-scoped grants, Calendar-owned OAuth/data access
- [references/skills-mcps.md](references/skills-mcps.md) — Skills library, MCP configuration, custom MCP servers

## Essential Patterns

For any visible app UI, read [references/design.md](references/design.md) before editing `src/client/app.tsx` or client components. The design reference is self-contained and does not require other apps to be installed.

### 1. UI Components (@moldable-ai/ui)

**Always use `@moldable-ai/ui`** for all UI work. It includes shadcn/ui components, theme support, and a rich text editor.

```tsx
// Import components from @moldable-ai/ui (NOT from shadcn directly)
// For rich text editing
import { MarkdownEditor } from '@moldable-ai/editor'
import {
  Button,
  Card,
  CodeBlock,
  Dialog,
  Input,
  Markdown,
  Select,
  Tabs,
  ThemeProvider,
  WorkspaceProvider,
  downloadFile,
  sendToMoldable,
  useTheme,
} from '@moldable-ai/ui'
```

**Use semantic colors only:**

```tsx
// ✅ Correct
<div className="bg-background text-foreground border-border" />
<Button className="bg-primary text-primary-foreground" />

// ❌ Wrong - raw colors don't adapt to theme
<div className="bg-white text-gray-900" />
```

See [references/ui.md](references/ui.md) for complete component list and usage.

### 2. Workspace-Aware Storage

All apps **must** isolate data per workspace:

```tsx
// Server - extract workspace from request
import { getAppDataDir, getWorkspaceFromRequest } from '@moldable-ai/storage'

// Client - use workspaceId in query keys
const { workspaceId, fetchWithWorkspace } = useWorkspace()
const { data } = useQuery({
  queryKey: ['items', workspaceId], // ← Include workspace!
  queryFn: () => fetchWithWorkspace('/api/items').then((r) => r.json()),
})

export async function GET(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request)
  const dataDir = getAppDataDir(workspaceId)
  // Read/write files in dataDir
}
```

### 3. Desktop Integration

Apps communicate with Moldable desktop via postMessage:

```typescript
// Open external URL
window.parent.postMessage(
  { type: 'moldable:open-url', url: 'https://...' },
  '*',
)

// Show file in Finder
window.parent.postMessage(
  { type: 'moldable:show-in-folder', path: '/path/to/file' },
  '*',
)

// Pre-populate chat input
window.parent.postMessage(
  { type: 'moldable:set-chat-input', text: 'Help me...' },
  '*',
)

// Provide context to AI
window.parent.postMessage(
  {
    type: 'moldable:set-chat-instructions',
    text: 'User is viewing meeting #123...',
  },
  '*',
)
```

For public, shareable static outputs such as slides, meeting notes, reports,
HTML/CSS demos, image galleries, or generated app snapshots, prefer
`publishMoldableArtifact()` from `@moldable-ai/ui` instead of hand-rolled
network calls. See [references/artifact-publishing.md](references/artifact-publishing.md).

### 4. Layout Setup

Required providers for Moldable apps:

```tsx
// src/client/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, WorkspaceProvider } from '@moldable-ai/ui'
import { App } from './app'
import { QueryProvider } from './query-provider'

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

### 5. Adding Dependencies

Use `sandbox: false` for package manager commands:

```typescript
await runCommand({
  command: 'cd ~/.moldable/shared/apps/my-app && pnpm add zod',
  sandbox: false, // Required for network access
})
```

## App Management Tools

| Tool            | Purpose                                    | Reversible         |
| --------------- | ------------------------------------------ | ------------------ |
| `scaffoldApp`   | Create new app                             | —                  |
| `getAppInfo`    | Check which workspaces use an app          | —                  |
| `unregisterApp` | Remove from current workspace only         | ✅ Re-add later    |
| `deleteAppData` | Delete app's data (keep installed)         | ❌ Data lost       |
| `deleteApp`     | **Permanently** delete from ALL workspaces | ❌ Everything lost |

## File Structure

```
~/.moldable/
├── shared/
│   ├── apps/{app-id}/              # App source code
│   │   ├── moldable.json           # App manifest
│   │   ├── package.json
│   │   └── src/
│   ├── skills/{repo}/{skill}/      # Skills library
│   ├── mcps/{mcp-name}/            # Custom MCP servers
│   └── config/mcp.json             # Shared MCP config
│
└── workspaces/{workspace-id}/
    ├── config.json                 # Registered apps
    ├── .env                        # Workspace env overrides
    ├── apps/{app-id}/data/         # App runtime data
    └── conversations/              # Chat history
```

## Common Mistakes to Avoid

1. **❌ Creating apps manually** — Always use `scaffoldApp`
2. **❌ Using localStorage/sessionStorage for app data or settings** — Use workspace-scoped server APIs and `@moldable-ai/storage`; browser storage is only acceptable for disposable same-session UI state.
3. **❌ Forgetting workspaceId** — Include in query keys and API calls
4. **❌ Hardcoding paths** — Use `getAppDataDir()` for portability
5. **❌ Using raw colors** — Use shadcn semantic colors (`bg-background`, not `bg-gray-100`)
6. **❌ Running pnpm with sandbox** — Set `sandbox: false` for network access

## Study Existing Apps

For complex features, reference apps in `~/.moldable/shared/apps/`:

- **scribo** — Translation journal with language selection
- **meetings** — Audio recording with real-time transcription
- **calendar** — Google Calendar integration with OAuth

These demonstrate data fetching, storage patterns, API routes, and UI components.
