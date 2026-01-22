# Moldable Configuration

This document covers the configuration files that define how Moldable apps work.

## App Manifest (moldable.json)

Every app has a `moldable.json` in its root directory:

```json
{
  "name": "My App",
  "version": "0.1.0",
  "visibility": "private",
  "description": "A brief description of what this app does",
  "author": "",
  "license": "MIT",
  "icon": "🚀",
  "widgetSize": "medium",
  "category": "custom",
  "tags": [],
  "moldableDependencies": {
    "@moldable-ai/ui": "^0.1.0"
  },
  "env": []
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name shown in the UI |
| `version` | Yes | Semantic version |
| `description` | Yes | Brief description |
| `icon` | Yes | Emoji icon for the app |
| `widgetSize` | No | `small`, `medium`, or `large` (default: `medium`) |
| `visibility` | No | `private` (default) or `public` |
| `category` | No | App category: `productivity`, `developer`, `media`, `custom` |
| `tags` | No | Array of searchable tags |
| `moldableDependencies` | No | Required Moldable packages |
| `env` | No | Required environment variables |

### Widget Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| `small` | 1×1 | Status indicator, quick action |
| `medium` | 2×1 | Summary + one action |
| `large` | 2×2 | Rich preview, multiple actions |

### Environment Variables

Apps can declare required env vars:

```json
{
  "env": [
    {
      "name": "DEEPL_API_KEY",
      "description": "API key for DeepL translation service",
      "required": true
    },
    {
      "name": "OPENAI_API_KEY",
      "description": "OpenAI API key for AI features",
      "required": false
    }
  ]
}
```

Environment variables are stored in `~/.moldable/shared/.env`:

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEEPL_API_KEY=...
```

## Workspace Configuration (config.json)

Each workspace has a `config.json` that lists registered apps:

**Path**: `~/.moldable/workspaces/{workspace-id}/config.json`

```json
{
  "apps": [
    {
      "id": "scribo",
      "name": "Scribo Languages",
      "icon": "✍️",
      "port": 3001,
      "path": "/Users/rob/.moldable/shared/apps/scribo",
      "command": "pnpm",
      "args": ["dev"],
      "widget_size": "medium",
      "requires_port": false
    },
    {
      "id": "meetings",
      "name": "Meeting Notes",
      "icon": "🎙️",
      "port": 3002,
      "path": "/Users/rob/.moldable/shared/apps/meetings",
      "command": "pnpm",
      "args": ["dev"],
      "widget_size": "large"
    }
  ]
}
```

### App Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique app identifier (lowercase, hyphens) |
| `name` | Yes | Display name |
| `icon` | Yes | Emoji icon |
| `port` | Yes | Preferred port (auto-incremented if busy) |
| `path` | Yes | Absolute path to app source code |
| `command` | Yes | Command to start the app (`pnpm`, `npm`, `node`) |
| `args` | Yes | Command arguments (`["dev"]`, `["start"]`) |
| `widget_size` | No | Widget size override |
| `requires_port` | No | If `true`, fail if preferred port is busy |

### Port Assignment

- `port` is the **preferred** starting port
- Moldable auto-finds the next free port if busy (unless `requires_port: true`)
- The app receives `-p <port> --hostname 127.0.0.1` automatically

## Global Workspaces Config (workspaces.json)

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

### Workspace Fields

| Field | Description |
|-------|-------------|
| `id` | Unique workspace identifier |
| `name` | Display name |
| `color` | Hex color for visual distinction |
| `createdAt` | ISO timestamp |

## Environment Variable Layering

Moldable uses layered environment variables:

1. **Base** (`~/.moldable/shared/.env`) — Shared across all workspaces
2. **Workspace** (`~/.moldable/workspaces/{id}/.env`) — Workspace-specific overrides

```bash
# shared/.env (base values)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-personal-...

# workspaces/work/.env (overrides for work)
OPENAI_API_KEY=sk-work-...     # Override
COMPANY_API_KEY=secret         # Work-only
```

## App Process Environment

When Moldable starts an app, it sets these environment variables:

| Variable | Description |
|----------|-------------|
| `MOLDABLE_APP_ID` | The app's unique identifier |
| `MOLDABLE_PORT` | Assigned port number |
| `PORT` | Same as MOLDABLE_PORT (for framework compatibility) |
| `MOLDABLE_WORKSPACE_ID` | Active workspace ID |
| `MOLDABLE_HOME` | Path to `~/.moldable` |
| `MOLDABLE_APP_DATA_DIR` | Full path to app's data directory |

## Modifying Configuration

### Register a New App

The `scaffoldApp` tool handles this automatically. For manual registration:

```typescript
// Read config
const configPath = '~/.moldable/workspaces/personal/config.json'
const config = JSON.parse(await readFile(configPath, 'utf-8'))

// Add app
config.apps.push({
  id: 'my-app',
  name: 'My App',
  icon: '🚀',
  port: 3010,
  path: '/Users/rob/.moldable/shared/apps/my-app',
  command: 'pnpm',
  args: ['dev'],
  widget_size: 'medium'
})

// Save
await writeFile(configPath, JSON.stringify(config, null, 2))
```

### Unregister an App

Remove from workspace config (keeps code):

```typescript
config.apps = config.apps.filter(app => app.id !== 'my-app')
await writeFile(configPath, JSON.stringify(config, null, 2))
```

### Delete an App Completely

Use the `deleteApp` tool or manually:

1. Remove from all workspace configs
2. Delete source: `rm -rf ~/.moldable/shared/apps/my-app`
3. Delete data: `rm -rf ~/.moldable/workspaces/*/apps/my-app`

## Best Practices

1. **Use scaffoldApp** - It handles all configuration correctly
2. **Don't hardcode paths** - Use environment variables
3. **Workspace-aware** - Always pass workspaceId to storage functions
4. **Validate env vars** - Check required variables exist at startup
5. **Port flexibility** - Don't rely on specific ports unless necessary
