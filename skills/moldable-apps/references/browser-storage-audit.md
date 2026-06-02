# Browser Storage Audit

Moldable apps should not use browser storage as a substitute for workspace-scoped app storage. `localStorage` and durable `sessionStorage` state live outside `~/.moldable/workspaces/{workspace-id}/apps/{app-id}/data`, so they are not part of workspace backup, inspection, migration, or RPC-visible app state.

## Current Usage

| App | Storage | Current purpose | Assessment | Recommended direction |
| --- | --- | --- | --- | --- |
| `affirmations` | `localStorage` | Best-effort favorites cache and daily streak tracking. | Favorites duplicate server state; streak is durable app data stored only in the webview. | Remove the favorites cache once server data is reliable. Move streak to a workspace-scoped server endpoint such as `/api/streak`. |
| `db-browser` | `sessionStorage` | Last selected sidebar mode for the current browser session. | Mostly acceptable because it is disposable UI state. | Prefer React state unless restoring this during the same session materially improves UX. Do not promote to `localStorage`. |
| `guitar` | `localStorage` | Active instrument pack and instrument selection. | Anti-pattern: the app already has workspace-scoped audio settings. | Use `/api/audio/settings` as the source of truth and remove the browser fallback/cache. |
| `mail` | `localStorage` | Persistent client cache for status/messages/drafts-related query data. | Anti-pattern: this is durable cache of workspace/server data. Mail already has server-side message/profile/draft caches. | Rely on TanStack Query memory cache plus server caches under `getAppDataDir(workspaceId)`. |
| `microscope` | `localStorage` | Auto-rotate preference and per-exploration model provider preference. | Anti-pattern: these are workspace/user preferences, and the app already has `/api/settings`. | Extend workspace settings or per-item server metadata and remove browser storage. |
| `piano` | `localStorage` | Active instrument pack and instrument selection. | Anti-pattern: the app already has workspace-scoped audio settings. | Use `/api/audio/settings` as the source of truth and remove the browser fallback/cache. |
| `tasks` | `localStorage` | List vs kanban view mode. | Anti-pattern: this is a workspace preference. | Add a small workspace-scoped settings endpoint/file and read/write view mode through `fetchWithWorkspace`. |

`meetings` contains a comment saying no `localStorage` is used; no active browser-storage usage was found there.

## Policy

Browser storage is not app storage. New Moldable apps should use:

- server APIs for app data and settings
- `getWorkspaceFromRequest(c.req.raw)` to identify the active workspace
- `getAppDataDir(workspaceId)` plus `safePath`, `readJson`, and `writeJson` for persisted files
- `fetchWithWorkspace` on the client
- React Query keys that include `workspaceId`

Allowed exceptions are narrow: ephemeral same-session UI state may use `sessionStorage` only when losing it has no product impact. Prefer React state first.
