# Moldable Workspaces

Workspaces allow users to organize their Moldable environment into separate contexts—like having different desks for different projects or life areas.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Workspace** | An isolated environment with its own apps, data, and config |
| **Active Workspace** | The workspace currently displayed in the UI |
| **Shared Resources** | Apps, skills, and base `.env` shared across workspaces |
| **Instant Switch** | All apps run always; switching is instant (no boot time) |

## Example Workspaces

- **Personal** — Default workspace for personal projects
- **Work** — Company tools, work-related apps
- **Side Project** — Isolated environment for a specific project

## Directory Structure

```
~/.moldable/
├── workspaces.json                 # Global workspace list
│
├── shared/                         # Shared across ALL workspaces
│   ├── .env                        # Base environment variables
│   ├── apps/                       # App source code (shared)
│   ├── skills/                     # Skills library
│   ├── mcps/                       # Custom MCP servers
│   └── config/mcp.json             # Shared MCP config
│
└── workspaces/
    ├── personal/                   # Personal workspace
    │   ├── config.json             # Registered apps for this workspace
    │   ├── .env                    # Workspace-specific env overrides
    │   ├── apps/                   # App runtime data
    │   │   └── {app-id}/data/      # Per-app data
    │   ├── conversations/          # Chat history
    │   └── config/
    │       ├── mcp.json            # Workspace-specific MCPs
    │       └── skills.json         # Enabled skills
    │
    └── work/                       # Work workspace
        └── ...                     # Same structure
```

## All Apps Run Always

Unlike traditional workspace models that stop/start processes, Moldable keeps all apps from all workspaces running simultaneously. Switching workspaces simply changes which apps are visible—making switches instant.

## Workspace Configuration

### Global Config (workspaces.json)

**Path**: `~/.moldable/workspaces.json`

```json
{
  "activeWorkspace": "personal",
  "workspaces": [
    {
      "id": "personal",
      "name": "Personal",
      "color": "#10b981",
      "createdAt": "2026-01-14T10:00:00Z"
    },
    {
      "id": "work",
      "name": "Work",
      "color": "#3b82f6",
      "createdAt": "2026-01-14T10:00:00Z"
    }
  ]
}
```

### Per-Workspace Config (config.json)

**Path**: `~/.moldable/workspaces/{workspace-id}/config.json`

```json
{
  "apps": [
    {
      "id": "todo",
      "name": "Todo App",
      "icon": "✅",
      "port": 3001,
      "path": "/Users/rob/.moldable/shared/apps/todo",
      "command": "pnpm",
      "args": ["dev"],
      "widget_size": "medium"
    }
  ]
}
```

## Data Isolation

Each workspace has its own data directory for each app:

```
~/.moldable/workspaces/
├── personal/apps/
│   ├── todo/data/
│   │   └── items.json         # Personal todo items
│   └── meetings/data/
│       └── recordings/        # Personal meeting recordings
│
└── work/apps/
    ├── todo/data/
    │   └── items.json         # Work todo items (separate!)
    └── meetings/data/
        └── recordings/        # Work meeting recordings
```

**The same app with different data per workspace.**

## Implementing Workspace Awareness

### Client Side

Use `WorkspaceProvider` and `useWorkspace`:

```tsx
// Layout
import { WorkspaceProvider } from '@moldable-ai/ui'

export default function Layout({ children }) {
  return (
    <WorkspaceProvider>
      {children}
    </WorkspaceProvider>
  )
}

// Component
import { useWorkspace } from '@moldable-ai/ui'

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()
  
  // Include workspaceId in query keys
  const { data } = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: () => fetchWithWorkspace('/api/items').then(r => r.json())
  })
}
```

### Server Side

Extract workspace from request headers:

```tsx
import { getWorkspaceFromRequest, getAppDataDir } from '@moldable-ai/storage'

export async function GET(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request)
  const dataDir = getAppDataDir(workspaceId)
  // dataDir = ~/.moldable/workspaces/{workspaceId}/apps/{appId}/data
}
```

## Environment Variable Layering

Variables are resolved in order:

1. **Base** (`shared/.env`) — API keys used everywhere
2. **Workspace** (`workspaces/{id}/.env`) — Overrides

```bash
# shared/.env (base)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-personal-...

# workspaces/work/.env (work overrides)
OPENAI_API_KEY=sk-work-...    # Different key for work
COMPANY_API_KEY=secret        # Work-only
```

## How Workspace ID Flows

1. **Desktop** → Sets `?workspace={id}` in iframe URL
2. **Client** → `WorkspaceProvider` reads from URL params
3. **API calls** → `fetchWithWorkspace` adds `x-moldable-workspace` header
4. **Server** → `getWorkspaceFromRequest` extracts from header
5. **Storage** → `getAppDataDir(workspaceId)` returns correct path

## Switching Workspaces

When user switches workspace:

1. Desktop updates the active workspace in `workspaces.json`
2. Canvas shows apps from new workspace's `config.json`
3. Iframe URLs get new `?workspace={id}` param
4. React Query caches are isolated by `workspaceId` in keys
5. **Apps don't restart** — they continue running

## Creating a New Workspace

```typescript
// Read current config
const configPath = '~/.moldable/workspaces.json'
const config = JSON.parse(await readFile(configPath))

// Add workspace
config.workspaces.push({
  id: 'side-project',
  name: 'Side Project',
  color: '#f59e0b',
  createdAt: new Date().toISOString()
})

// Save
await writeFile(configPath, JSON.stringify(config, null, 2))

// Create workspace directory
await mkdir('~/.moldable/workspaces/side-project')
await writeFile('~/.moldable/workspaces/side-project/config.json', 
  JSON.stringify({ apps: [] }, null, 2))
```

## Installing Apps in Workspaces

Apps are installed into workspaces via `config.json`:

```typescript
// Add to Personal workspace
const config = JSON.parse(await readFile(
  '~/.moldable/workspaces/personal/config.json'
))
config.apps.push(newAppEntry)
await writeFile('...', JSON.stringify(config, null, 2))

// The same app can be in multiple workspaces
// with different data in each
```

## Common Patterns

### Workspace Selector UI

The header displays a workspace badge:

```
┌─────────────────────────────────────────────────────────────────┐
│  [◀]  📓 Scribo Languages  │  ● Personal ▾      [:3001] [↻]    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                     Workspace selector (with color dot)
```

### Workspace-Aware Query Keys

Always include workspaceId in TanStack Query keys:

```typescript
// ✅ Correct - isolated per workspace
queryKey: ['meetings', workspaceId]

// ❌ Wrong - data leaks between workspaces
queryKey: ['meetings']
```

### Workspace-Aware Mutations

Invalidate with workspaceId:

```typescript
const { workspaceId } = useWorkspace()
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: (data) => fetchWithWorkspace('/api/items', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items', workspaceId] })
  }
})
```

## Best Practices

1. **Always pass workspaceId** to storage functions
2. **Include workspaceId in query keys** for cache isolation
3. **Use fetchWithWorkspace** for all API calls
4. **Clear app-specific state** on workspace change
5. **Don't store workspace data in localStorage** — use filesystem
6. **Test with multiple workspaces** to ensure isolation
