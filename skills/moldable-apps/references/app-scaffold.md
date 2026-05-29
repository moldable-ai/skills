# Moldable App Scaffold Requirements

Moldable-generated apps use a single Vite + React + Hono runtime. Keep routing in Hono API handlers and React client views.

## Required Files

Every Moldable app must live in `~/.moldable/shared/apps/{app-id}/` and include:

```text
moldable.json
package.json
index.html
vite.config.ts
eslint.config.js
tsconfig.json
scripts/moldable-dev.mjs
src/client/main.tsx
src/client/app.tsx
src/client/globals.css
src/client/query-provider.tsx
src/server/index.ts
src/server/app.ts
src/server/moldable.ts
src/server/static.ts
```

## Lint Rules Summary

| Rule                      | Severity | Requirement                                                                                  |
| ------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `moldable-json-exists`    | Error    | `moldable.json` must exist                                                                   |
| `moldable-json-valid`     | Error    | Manifest must be valid JSON                                                                  |
| `moldable-json-fields`    | Error    | Manifest must include `name`, `icon`, `description`                                          |
| `moldable-json-runtime`   | Error    | Manifest runtime must be `vite_hono`                                                         |
| `vite-config-exists`      | Error    | `vite.config.ts` must exist                                                                  |
| `hono-server-entry`       | Error    | `src/server/index.ts` must exist                                                             |
| `vite-hmr-portless`       | Error    | `src/server/index.ts` must configure Vite HMR from `MOLDABLE_APP_URL`                        |
| `moldable-dev-script`     | Error    | `scripts/moldable-dev.mjs` must exist                                                        |
| `moldable-dev-syntax`     | Error    | Dev script must launch the Hono server with `tsx watch` and track `.moldable.instances.json` |
| `package-json-dev-script` | Error    | `dev` script must use `node ./scripts/moldable-dev.mjs`                                      |
| `today-route`             | Warning  | `src/server/app.ts` should expose `GET /api/moldable/today` (contributes to the Today view)  |
| `health-route`            | Error    | `src/server/app.ts` must expose `/api/moldable/health`                                       |
| `gitignore-valid`         | Error    | `.gitignore` must ignore `dist` and `node_modules`                                           |
| `eslint-config-app`       | Error    | `eslint.config.js` must use `@moldable-ai/eslint-config/app`                                 |
| `no-localstorage`         | Warning  | Use filesystem storage, not browser storage                                                  |
| `workspace-provider`      | Error    | Client entry must use `WorkspaceProvider`                                                    |
| `app-registered`          | Error    | App must be registered in workspace `config.json`                                            |

## Core Templates

### `moldable.json`

```json
{
  "name": "My App",
  "version": "0.1.0",
  "runtime": "vite_hono",
  "visibility": "private",
  "description": "Brief description of what this app does",
  "author": "",
  "license": "FSL-1.1-ALv2",
  "icon": "🚀",
  "category": "custom",
  "tags": [],
  "moldableDependencies": {
    "@moldable-ai/ui": "^0.2.6",
    "@moldable-ai/storage": "^0.1.3"
  },
  "env": []
}
```

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node ./scripts/moldable-dev.mjs",
    "build": "vite build",
    "start": "NODE_ENV=production tsx src/server/index.ts",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit",
    "test": "vitest run --passWithNoTests"
  }
}
```

### `eslint.config.js`

```js
import app from "@moldable-ai/eslint-config/app";

export default app;
```

### `src/client/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, WorkspaceProvider } from "@moldable-ai/ui";
import { App } from "./app";
import { QueryProvider } from "./query-provider";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

### `src/server/app.ts`

The home screen is the host-rendered **Today** view. An app participates by exposing
`GET /api/moldable/today`, which returns `{ items, resume }` only when something genuinely needs
the user (quiet by default). See [references/today.md](today.md) for the full contract, item kinds,
actions, and signal-vs-noise guidance.

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

export const app = new Hono();

app.use("/api/*", cors());

app.get("/api/moldable/health", (c) => {
  return c.json({
    appId: process.env.MOLDABLE_APP_ID ?? "my-app",
    status: "ok",
  });
});

// Contribute to the Today home view. Return nothing when nothing needs the user.
app.get("/api/moldable/today", (c) => {
  const items: unknown[] = []; // push only when something earns attention
  const resume: unknown = null; // "pick up where you left off", or null
  return c.json({ items, resume, generatedAt: new Date().toISOString() });
});
```

### `.gitignore`

```gitignore
node_modules/
dist/
.turbo/
.env*.local
*.tsbuildinfo
.moldable.instances.json
```

## Common Validation Failures

### Dev Script Does Not Use Moldable Launcher

```json
// Wrong
"dev": "vite"

// Correct
"dev": "node ./scripts/moldable-dev.mjs"
```

### Missing Portless-Aware HMR

`src/server/index.ts` must configure Vite HMR from `MOLDABLE_APP_URL` so the webview connects through the same `.localhost` route that Portless exposes.

```ts
function createHmrOptions(server: HttpServer): HmrOptions {
  const appUrl = process.env.MOLDABLE_APP_URL;
  if (!appUrl) return { server };

  const url = new URL(appUrl);
  const isHttps = url.protocol === "https:";

  return {
    server,
    protocol: isHttps ? "wss" : "ws",
    host: url.hostname,
    clientPort: url.port ? Number(url.port) : isHttps ? 443 : 80,
  };
}
```

### Missing Server Watch Mode

`scripts/moldable-dev.mjs` must run the Hono server with `tsx watch --clear-screen=false src/server/index.ts` in development. Vite HMR updates client modules, but server/API files need the Node process to reload changed modules.

### Missing WorkspaceProvider

Wrap the client root with `ThemeProvider`, `WorkspaceProvider`, and `QueryProvider` in `src/client/main.tsx`.

### Missing Health Route

Expose `GET /api/moldable/health` from the Hono app and return the running `appId`.

### Browser Storage

Do not use `localStorage` or `sessionStorage` for app data. Persist via server APIs and `@moldable-ai/storage`.
