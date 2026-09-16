# App implementation patterns

### 1. UI Components (@moldable-ai/ui)

**Always use `@moldable-ai/ui`** for established interactive controls and app structure. Semantic HTML and Tailwind layout utilities remain appropriate for layout gaps the package does not cover.

**Use semantic colors only:**

```tsx
// ✅ Correct
<div className="bg-background text-foreground border-border" />
<Button className="bg-primary text-primary-foreground" />

// ❌ Wrong - raw colors don't adapt to theme
<div className="bg-white text-gray-900" />
```

See [references/ui.md](ui.md) for source routing, component
decisions, standalone windows, and fallback-first host services. Confirm an
export before using it, then read the guide for each selected family.

Install the shared frame lifecycle once in the client entry and begin full app
views with `AppFrame`. Use adaptive `Material` only for navigation and control
chrome; keep primary content opaque. Do not add app-local channel-layout
listeners: desktop currently publishes `--chat-safe-padding: 0px`.

For native capability UI (camera, microphone, location, serial, Bluetooth,
and related services), start with the package's
`src/components/native-capabilities/` public surface instead of building UI
directly on the imperative helpers. Route through
[references/ui.md](ui.md) and the package README rather than
guessing exports or props.

### 2. Workspace-Aware Storage

All apps **must** isolate data per workspace:

```tsx
// Server - extract workspace from request
import {
  getAppCacheDir,
  getAppDataDir,
  getWorkspaceFromRequest,
} from "@moldable-ai/storage";

// Client - use workspaceId in query keys
const { workspaceId, fetchWithWorkspace } = useWorkspace();
const { data } = useQuery({
  queryKey: ["items", workspaceId], // ← Include workspace!
  queryFn: () => fetchWithWorkspace("/api/items").then((r) => r.json()),
});

export async function GET(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request);
  const dataDir = getAppDataDir(workspaceId);
  const cacheDir = getAppCacheDir(workspaceId);
  // User-authored/irreplaceable state and event-loss-prevention cursors go in
  // dataDir. Provider responses, derived indexes, thumbnails, and other safely
  // rebuildable state go in cacheDir.
}
```

The cache directory is local-only and follows app lifecycle: removing an app
from a workspace, deleting its data, or fully uninstalling it clears the
applicable cache. Cache loss must never break correctness or lose user work.
Persist only semantic cache changes—do not refresh timestamps or rewrite every
record on a polling heartbeat. Prefer provider cursors/deltas plus infrequent
bounded reconciliation over repeated full scans. Moving a frequently rewritten
cache into one SQLite file under `getAppDataDir()` does not make it sync-safe;
it still causes whole-file Drive churn.

### 3. Desktop Integration

Apps communicate with Moldable desktop via postMessage:

```typescript
// Open external URL
window.parent.postMessage(
  { type: "moldable:open-url", url: "https://..." },
  "*",
);

// Show file in Finder
window.parent.postMessage(
  { type: "moldable:show-in-folder", path: "/path/to/file" },
  "*",
);

// Pre-populate the app's assigned bot/group channel input
window.parent.postMessage(
  { type: "moldable:set-chat-input", text: "Help me..." },
  "*",
);

// Provide bounded context to the app's assigned bot/group channel
window.parent.postMessage(
  {
    type: "moldable:set-chat-instructions",
    text: "User is viewing meeting #123...",
  },
  "*",
);
```

For public, shareable static outputs such as slides, meeting notes, reports,
HTML/CSS demos, image galleries, or generated app snapshots, prefer
`publishMoldableArtifact()` from `@moldable-ai/ui` instead of hand-rolled
network calls. See [references/artifact-publishing.md](artifact-publishing.md).

### 4. Layout Setup

Required providers for Moldable apps:

```tsx
// src/client/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  WorkspaceProvider,
  installMoldableFrameLifecycle,
} from "@moldable-ai/ui";
import { App } from "./app";
import { QueryProvider } from "./query-provider";

installMoldableFrameLifecycle();

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

### 5. Adding Dependencies

Use the current host command schema and permission profile for package-manager commands. The historical example below uses a host-specific option; do not add an unsupported sandbox flag:

```typescript
await runCommand({
  command: "cd ~/.moldable/shared/apps/my-app && pnpm add zod",
  // Use only options exposed by the current runCommand schema.
});
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
├── cache/
│   └── workspaces/{workspace-id}/apps/{app-id}/ # Rebuildable, unsynced app cache
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
    ├── apps/{app-id}/data/         # Durable app data
    └── conversations/              # Bot and group-channel conversation history
```

## Common Mistakes to Avoid

1. **❌ Creating apps manually** — Always use `scaffoldApp`
2. **❌ Using localStorage/sessionStorage for app data or settings** — Use workspace-scoped server APIs and `@moldable-ai/storage`; browser storage is only acceptable for disposable same-session UI state.
3. **❌ Forgetting workspaceId** — Include in query keys and API calls
4. **❌ Hardcoding paths** — Use `getAppDataDir()` for portability
5. **❌ Syncing provider caches or derived indexes** — Use `getAppCacheDir()` and make cache loss safe
6. **❌ Touching every cache record on a timer** — Compare semantic content and write only changes
7. **❌ Using raw colors** — Use shadcn semantic colors (`bg-background`, not `bg-gray-100`)
8. **❌ Guessing sandbox flags** — Follow the current host tool schema and permission profile.

## Study Existing Apps

For complex features, reference apps in `~/.moldable/shared/apps/`:

- **scribo** — Translation journal with language selection
- **meetings** — Audio recording with real-time transcription
- **calendar** — Google Calendar integration with OAuth

These demonstrate data fetching, storage patterns, API routes, and UI components.
