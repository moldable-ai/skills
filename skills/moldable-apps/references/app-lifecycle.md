# Moldable App Lifecycle

This document covers how apps are created, started, managed, and deleted in Moldable.

## Creating Apps

Always use `scaffoldApp`. It creates the app in `~/.moldable/shared/apps/{appId}/`, installs dependencies, registers it in the active workspace, and returns the app path.

```ts
const result = await scaffoldApp({
  appId: "expense-tracker",
  name: "Expense Tracker",
  icon: "💰",
  description: "Track expenses and generate reports",
  extraDependencies: {
    zod: "^3.0.0",
  },
});
```

## What `scaffoldApp` Does

1. Creates the app directory in `~/.moldable/shared/apps/{appId}/`.
2. Copies the Vite + Hono template.
3. Substitutes placeholders for app id, name, icon, and description.
4. Runs `pnpm install`.
5. Registers the app with a route name in workspace config.
6. Returns the ready-to-edit app.

## After Scaffolding

Customize these files:

```text
src/client/app.tsx        # Full view
src/client/components/    # React components
src/server/app.ts         # Hono app and route registration (incl. GET /api/moldable/today)
src/server/routes/        # API route modules
src/server/moldable.ts    # Moldable API helpers
moldable.json             # App metadata
package.json              # Dependencies and scripts
```

There is no per-app widget view. An app participates in the home screen by implementing
`GET /api/moldable/today`, which the host-rendered **Today** view pulls from. See
[references/today.md](today.md).

## App Startup

The Moldable desktop owns the lifecycle. The agent should not start app dev servers unless the user explicitly asks for troubleshooting.

When an app starts, Moldable:

1. Checks `.moldable.instances.json` for an existing responding instance.
2. Starts the app command through Portless route-first local routing.
3. Sets environment variables:
   - `MOLDABLE_HOME`
   - `MOLDABLE_APP_ID`
   - `MOLDABLE_APP_DATA_DIR`
   - `MOLDABLE_AI_SERVER_URL`
   - `MOLDABLE_APP_TOKEN`
   - `MOLDABLE_APP_URL`
4. Displays the app at its `.localhost` route.

## Dev Script

`scripts/moldable-dev.mjs` launches the Hono server with `tsx watch` in development, forwards Moldable runtime environment, records the child process in `.moldable.instances.json`, and removes that record on exit. Watch mode is required because server/API modules are loaded by Node, not by Vite's client HMR pipeline.

Apps should keep:

```json
{
  "scripts": {
    "dev": "node ./scripts/moldable-dev.mjs",
    "build": "vite build",
    "start": "NODE_ENV=production tsx src/server/index.ts",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  }
}
```

## App States

| State    | Description                                            |
| -------- | ------------------------------------------------------ |
| Stopped  | No process is running                                  |
| Starting | Moldable spawned the process and is waiting for health |
| Running  | App responds to health checks                          |
| Error    | Process failed or health check failed                  |

## Managing Apps

Use app-management tools rather than editing workspace config by hand:

| Tool            | Scope             | Keeps Code | Keeps Data | Reversible |
| --------------- | ----------------- | ---------- | ---------- | ---------- |
| `getAppInfo`    | All workspaces    | Yes        | Yes        | N/A        |
| `unregisterApp` | Current workspace | Yes        | Yes        | Yes        |
| `deleteAppData` | Current workspace | Yes        | No         | No         |
| `deleteApp`     | All workspaces    | No         | No         | No         |

Check `getAppInfo` before destructive actions so the user understands workspace impact.

## Hot Reloading

Vite handles client HMR. Because Moldable serves apps through Portless `.localhost` routes, `src/server/index.ts` must build Vite's `server.hmr` options from `MOLDABLE_APP_URL` and set `protocol`, `host`, and `clientPort` so the webview opens the HMR websocket through the same public app route.

Server and API changes are handled by `tsx watch` in `scripts/moldable-dev.mjs`. The desktop only needs to restart apps when the user requests lifecycle controls or when the dev script itself changes.

## Common Operations

### Modify Full View

Edit `~/.moldable/shared/apps/my-app/src/client/app.tsx`.

### Contribute to the Home (Today)

Apps no longer ship a widget view. To surface something on the home screen, implement
`GET /api/moldable/today` in `src/server/app.ts` so the Today view can pull from it. Keep it quiet
by default — return items only when something genuinely needs the user. See
[references/today.md](today.md).

### Add an API Route

Add a handler in `src/server/app.ts` or a route module under `src/server/routes/`, then call it from the client with `fetchWithWorkspace('/api/...')`.

## Best Practices

1. Always use `scaffoldApp` for new apps.
2. Keep apps in `~/.moldable/shared/apps/`.
3. Use filesystem-backed API routes for persistence.
4. Include `workspaceId` in React Query keys.
5. Use `pnpm add` from the app directory for dependencies.
6. Let Moldable desktop handle process lifecycle.
