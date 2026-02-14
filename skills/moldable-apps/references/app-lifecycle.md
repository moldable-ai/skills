# Moldable App Lifecycle

This document covers how apps are created, started, managed, and deleted in Moldable.

## Creating Apps

**ALWAYS use `scaffoldApp`** — it handles everything in one call:

```typescript
const result = await scaffoldApp({
  appId: 'expense-tracker',     // lowercase, hyphens only
  name: 'Expense Tracker',      // Display name
  icon: '💰',                   // Emoji icon
  description: 'Track expenses and generate reports',
  widgetSize: 'medium',         // small, medium, or large
  extraDependencies: {          // Optional npm packages
    'zod': '^3.0.0',
    'recharts': '^2.0.0'
  },
  extraDevDependencies: {}      // Optional dev dependencies
})

// Result:
// {
//   success: true,
//   appId: 'expense-tracker',
//   name: 'Expense Tracker',
//   icon: '💰',
//   port: 3005,
//   path: '/Users/rob/.moldable/shared/apps/expense-tracker',
//   files: ['package.json', 'moldable.json', 'src/app/page.tsx', ...],
//   pnpmInstalled: true,
//   registered: true
// }
```

### What scaffoldApp Does

1. Creates app directory in `~/.moldable/shared/apps/{appId}/`
2. Copies the Next.js template with all boilerplate
3. Substitutes placeholders (name, icon, description)
4. Runs `pnpm install`
5. Finds an available port
6. Registers the app in workspace config
7. Returns the ready-to-use app

### After Scaffolding

Customize these files:

```
~/.moldable/shared/apps/{appId}/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main app view ← CUSTOMIZE
│   │   ├── widget/
│   │   │   └── page.tsx          # Widget view ← CUSTOMIZE
│   │   ├── api/                  # API routes ← ADD
│   │   └── layout.tsx            # App layout
│   ├── components/               # React components ← ADD
│   └── lib/                      # Utilities ← ADD
├── moldable.json                 # App manifest
└── package.json
```

## App Startup

When the user opens an app, Moldable:

1. **Checks if already running** via `.moldable.instances.json`
2. **Finds available port** starting from configured port
3. **Spawns process**: `pnpm dev -p {port} --hostname 127.0.0.1`
4. **Sets environment**:
   - `MOLDABLE_APP_ID`: App identifier
   - `MOLDABLE_PORT` / `PORT`: Assigned port
   - `MOLDABLE_WORKSPACE_ID`: Active workspace
   - `MOLDABLE_APP_DATA_DIR`: Data directory path
5. **Displays webview** at `http://127.0.0.1:{port}?workspace={workspaceId}`

### Dev Script (moldable-dev.mjs)

Apps use a custom dev script that:
- Resolves the `next` binary
- Registers the running instance
- Cleans up on exit

```javascript
// scripts/moldable-dev.mjs (in app template)
const child = spawn(nextBin, ['dev', '--turbopack', ...args], {
  env: {
    ...process.env,
    MOLDABLE_APP_ID: '__APP_ID__',
    ...(port ? { MOLDABLE_PORT: port, PORT: port } : {})
  },
  stdio: 'inherit'
})
```

## App States

| State | Description | Visual |
|-------|-------------|--------|
| Stopped | Not running | Gray dot, "Click to start" overlay |
| Starting | Process spawning | Loading spinner |
| Running | Healthy and responding | Green dot |
| Error | Failed to start or crashed | Red dot, error message |

## Managing Apps

### Get App Info

Before deleting, check which workspaces use the app:

```typescript
const info = await getAppInfo({ appId: 'my-app' })
// {
//   success: true,
//   appId: 'my-app',
//   appName: 'My App',
//   appPath: '/Users/rob/.moldable/shared/apps/my-app',
//   installedInWorkspaces: ['personal', 'work'],
//   hasWorkspaceData: true
// }
```

### Remove from Workspace (Soft Delete)

Removes app from current workspace only. **Keeps code and data**.

```typescript
await unregisterApp({ appId: 'my-app' })
// App can be re-added later from app gallery
```

**Use when**: User wants to hide an app temporarily

### Delete App Data (Reset)

Clears app's data in current workspace. **Keeps app installed**.

```typescript
await deleteAppData({ appId: 'my-app' })
// Deletes: ~/.moldable/workspaces/{workspace}/apps/my-app/data/
// App starts fresh next time
```

**Use when**: User wants to reset an app to initial state

### Delete App Permanently

**DANGEROUS**: Removes app from ALL workspaces and deletes ALL code and data.

```typescript
// Always check impact first!
const info = await getAppInfo({ appId: 'my-app' })
console.log(`Will affect ${info.installedInWorkspaces.length} workspaces`)

// Then delete
await deleteApp({ appId: 'my-app' })
// Deletes:
// - ~/.moldable/shared/apps/my-app/ (source code)
// - ~/.moldable/workspaces/*/apps/my-app/ (all workspace data)
// - Entries from all workspace configs
```

**Use when**: User explicitly wants to permanently remove an app

## App Management Tools Summary

| Tool | Scope | Keeps Code | Keeps Data | Reversible |
|------|-------|------------|------------|------------|
| `unregisterApp` | Current workspace | ✅ | ✅ | ✅ Re-add from gallery |
| `deleteAppData` | Current workspace | ✅ | ❌ | ❌ Data lost |
| `deleteApp` | ALL workspaces | ❌ | ❌ | ❌ Everything lost |

## Approval Requirements

These tools require user approval before executing:

- `unregisterApp` — Confirm removal from workspace
- `deleteAppData` — Confirm data deletion (irreversible)
- `deleteApp` — Confirm permanent deletion (shows affected workspaces)

## Process Management

**The Moldable desktop handles app lifecycle** — the agent should NOT try to start, stop, or restart apps directly unless the user says it's having trouble and asks the agent to help.

- **Starting**: User clicks app in canvas, or desktop auto-starts
- **Stopping**: Apps are shutdown automatically when the desktop shuts down
- **Restarting**: Desktop handles automatically after code changes

The `moldable-dev.mjs` script tracks running instances in `.moldable.instances.json` and cleans up on exit.

## Adding Dependencies

After scaffolding, add npm packages:

```bash
cd ~/.moldable/shared/apps/my-app
pnpm add zod recharts
```

**Important**: Use `sandbox: false` in the `runCommand` tool for package installs (sandbox blocks network access).

```typescript
await runCommand({
  command: 'cd ~/.moldable/shared/apps/my-app && pnpm add zod',
  sandbox: false  // Required for network access
})
```

## Hot Reloading

Apps use Next.js with Turbopack for fast refresh:
- Code changes → Automatic HMR
- No need to restart the app
- State preserved when possible

## Common Operations

### Modify an Existing App

1. Read the file: `readFile({ path: '~/.moldable/shared/apps/my-app/src/app/page.tsx' })`
2. Make changes: `editFile({ path, oldString, newString })`
3. App auto-refreshes via HMR

### Add a New Page

1. Create the route: `writeFile({ path: '~/.moldable/shared/apps/my-app/src/app/settings/page.tsx', content: '...' })`
2. Add navigation component
3. App auto-refreshes

### Add an API Route

1. Create the route file: `writeFile({ path: '~/.moldable/shared/apps/my-app/src/app/api/items/route.ts', content: '...' })`
2. Call from client: `fetch('/api/items')`

## Best Practices

1. **Always use scaffoldApp** for new apps
2. **Check app info** before destructive operations
3. **Use unregisterApp** instead of deleteApp when possible
4. **Use sandbox: false** for package manager commands
5. **Study existing apps** (`scribo`, `meetings`) for patterns
6. **Keep apps focused** — one purpose per app
