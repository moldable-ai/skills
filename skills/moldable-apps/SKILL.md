---
name: moldable
description: Complete guide for building Moldable apps and semantic experiences. Use this skill when creating or modifying apps, composing iPhone nativeUI/A2UI projections, supporting voice or remote control, designing sync-safe storage, creating or managing Scheduled automations, using workspace-aware storage or typed native hardware APIs, integrating with Moldable desktop messages, publishing artifacts, configuring workspaces, managing skills/MCPs, or troubleshooting app issues.
---

# Moldable App Development

This skill provides comprehensive knowledge for building and modifying apps within the Moldable desktop application.

## Quick Reference

| Resource          | Path                                                         |
| ----------------- | ------------------------------------------------------------ |
| App source code   | `~/.moldable/shared/apps/{app-id}/`                          |
| Durable app data  | `~/.moldable/workspaces/{workspace-id}/apps/{app-id}/data/`  |
| Rebuildable cache | `~/.moldable/cache/workspaces/{workspace-id}/apps/{app-id}/` |
| Workspace config  | `~/.moldable/workspaces/{workspace-id}/config.json`          |
| MCP config        | `~/.moldable/shared/config/mcp.json`                         |
| Skills            | `~/.moldable/shared/skills/{repo}/{skill}/`                  |
| Environment       | `~/.moldable/shared/.env`                                    |
| Native iOS UI     | `nativeUI` tool in a first-party iOS conversation            |

## Default Tech Stack

- **Framework**: Vite + Hono + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (semantic colors only)
- **State**: TanStack Query v5
- **Storage**: Filesystem via `@moldable-ai/storage`
- **Dev Reloading**: Vite client HMR via Portless-aware `MOLDABLE_APP_URL`; Hono server reloads via `tsx watch`
- **Package Manager**: pnpm

## UI Package Contract

Use the `@moldable-ai/ui` package and guides that ship beside this skill.

The package owns component APIs. Treat its root `src/index.ts` and
`src/components/ui/index.ts` barrels as the public surface, and read the
colocated guide for every selected component family. This skill
routes component choice and composition; it does not replace those guides with
copied prop tables. If the needed primitive is missing, **report the package
gap**. Do not hand-roll a competing shared control or deep-import private
source.

## Product Surfaces

- Build desktop app views for their own host-owned window by default. Keep the
  same `AppFrame` hierarchy usable in the embedded compatibility/fallback
  surface, but do not design a web page or simulate macOS window chrome.
- Users can enable **Voice mode** in Settings on supported macOS builds. Voice
  and every bot/group channel must drive the same workspace-scoped app APIs and semantic actions;
  do not create a voice-only app implementation.
- Treat iPhone as a native semantic projection over the same authoritative app
  state, not a second app implementation. Use `nativeUI` only when the current
  conversation exposes it.
- Keep durable app state inside the documented workspace paths so filesystem
  sync can preserve it. Read [references/sync.md](references/sync.md) before
  changing storage locations, app-release behavior, or sync-sensitive data.

## Creating Apps

**ALWAYS use the `scaffoldApp` tool** — never create app files manually.

```typescript
scaffoldApp({
  appId: "expense-tracker", // lowercase, hyphens only
  name: "Expense Tracker", // Display name
  icon: "💰", // Emoji icon
  description: "Track expenses and generate reports",
  extraDependencies: {
    // Optional npm packages
    zod: "^3.0.0",
  },
});
```

**After scaffolding**, customize:

- `src/client/app.tsx` — Main app view
- `src/server/app.ts` or `src/server/routes/` — Hono API routes (including health, Today, and the drive API)
- `src/client/components/` or `src/components/` — React components

### Today contribution

The home screen is the host-rendered **Today** view. Apps participate by implementing `GET /api/moldable/today`, which returns items/resume only when something genuinely needs the user (quiet by default). See [references/today.md](references/today.md).

### Drive contract

Every new app must be drivable from bot channels, group channels, and voice from day one. Declare an `<appId>.drive` capability with fully prefixed `<appId>.ui.describe`, `<appId>.ui.navigate`, and `<appId>.ui.read` scopes; implement the workspace-scoped UI-intent flow; and listen for `moldable:app-api-changed` in the client. Add model-readable signature actions for the app's important verbs. Follow [references/app-to-app-communication.md](references/app-to-app-communication.md#drive-contract-voice--channel-steering) for the complete contract and Plants reference code.

### Bot/group channels and app assignment

Moldable conversations are durable, workspace-scoped **channels**: a one-to-one
channel has one bot, while a group channel has multiple collaborating bots.
Their channel and conversation identities are the same. Never create an
app-specific chat identity, duplicate a bot's state, or store a channel choice
inside the app's own data.

An app's embedded host channel panel uses its explicit channel assignment when one
exists; otherwise it follows the latest visible channel in that workspace. When
the user asks to make an app use a particular bot or group, call
`assignAppChatChannel` from the app's channel context:

- use `appId` from the app context or app catalog;
- provide an exact visible bot/group name or channel ID in `channelName` (do
  not derive channel IDs from names); and
- set `useLatest: true` to remove the pin and resume following the latest
  channel.

The assignment is host-owned and workspace-scoped. App code may prefill the
currently assigned channel or give it bounded app context through the desktop
messages, but cannot choose or persist a channel by `postMessage`.

### Native iPhone projection

When a chat or voice turn originates on iPhone and asks to show structured or
interactive information, treat `nativeUI` as the default materialization
surface. Read [references/native-ui.md](references/native-ui.md), then select a
composition from [references/native-ui-patterns.md](references/native-ui-patterns.md)
and confirm current component properties in
[references/native-ui-catalog.md](references/native-ui-catalog.md). Keep app
data authoritative behind the app RPC; native UI is a conversation-scoped
semantic projection, not another app implementation.

Do not apply the sibling `moldable-ui-patterns` skill to native SwiftUI
composition. That skill is for React, web, and desktop app interfaces.

### Scheduled agent work

The desktop UI calls this area **Scheduled**; its tools and internal data model
use the term **automation**. Chat can create and manage Scheduled work with
first-class automation tools. Use those tools instead of creating an app,
editing `automations.json`, or configuring OS cron. Scheduled work is scoped to
one workspace and runs only while the Moldable desktop is open.

Choose exactly one creation tool from the user's scheduling intent; their input
schemas are strict:

- `createRelativeAutomation` — run once after a relative delay in seconds,
  minutes, hours, days, or weeks.
- `createOneTimeAutomation` — run once at a local `YYYY-MM-DD` date and `HH:mm`
  time.
- `createDailyAutomation` — run every day at a local time.
- `createRecurringAutomation` — run daily, on weekdays, weekly, monthly, or
  yearly at a local time.
- `createIntervalAutomation` — run every N seconds, minutes, hours, days, weeks,
  months, or years.
- `createCronAutomation` — use only when the user explicitly asks for a cron
  expression; prefer the structured tools otherwise.

For `createRecurringAutomation`, supply `weekdays` as 0–6 (0 is Sunday) for a
weekly recurrence, `dayOfMonth` for monthly, and both `dayOfMonth` and
`monthOfYear` for yearly. Sub-day intervals keep a UTC cadence; day-or-longer
intervals preserve local wall-clock time across timezone changes.

For every creation:

1. Provide a short `name`, a self-contained `prompt`, and the user's IANA
   `timezone`. Let the runtime resolve concrete timestamps; never calculate UTC
   or the next run yourself.
2. Make the prompt describe the source apps, filters, desired result or
   mutation, and what should count as useful output. Scheduled runs are
   independent agent runs and must not depend on unstated chat context.
3. For work involving app data, call `listMoldableAppApi` for the relevant apps
   before creating the automation. Declare every target in `appAccess` using
   exact returned method/scope IDs, with `read` unless a requested mutation
   requires `write`. Never guess scopes or read another app's data directory.
4. Keep `includeSuccessesInToday` false unless the user explicitly wants every
   successful run shown. The default keeps routine results quiet while blocked
   or failed work can still surface in Today.
5. If the user wants a bot or group to receive the result, provide that
   workspace's exact `channelId`. The automation posts a durable outcome there
   and wakes the recipient to handle useful follow-up; it may remain quiet when
   no response is warranted. Omit `channelId` for Today/history-only delivery.
   Do not infer an ID from a bot or group name.
6. Use `maxRuns` for a bounded series. Omit it for an unbounded recurring
   schedule.
7. After creation, quote the returned `schedule.confirmationText`; do not
   reinterpret or recompute the schedule.

Creating or updating `appAccess` grants those declared scopes to the
workspace-scoped `moldable-automations` caller. Unattended runs cannot broaden
their own access. If a run reports a missing app API scope, verify the scope
with `listMoldableAppApi`, then use `updateAutomation` only when the user has
authorized that access.

Use `listAutomations` and `getAutomation` to resolve an existing item before
acting. Use `updateAutomation` for its name, prompt, app access, Today policy,
or report channel; use `channelId: null` to return to Today/history-only
delivery. Use `toggleAutomation` to pause or resume it; `runAutomationNow` for
an immediate run; and `deleteAutomation` to remove it. Updating an automation
does not change its schedule: create and verify a replacement schedule first,
then delete the old automation only when the user's request clearly authorizes
replacement.

## Detailed References

Read these for in-depth guidance:

### Core Concepts

- [references/app-lifecycle.md](references/app-lifecycle.md) — Creating, starting, managing, and deleting apps
- [references/app-scaffold.md](references/app-scaffold.md) — **Required files**, lint rules, templates for new apps
- [references/workspaces.md](references/workspaces.md) — Workspace system, data isolation, environment layering
- [references/configuration.md](references/configuration.md) — moldable.json, config.json, environment variables

### Implementation Patterns

- [references/design.md](references/design.md) — Moldable product design guidance for app archetypes, state handling, density, copy, motion, and UI polish. Read this before visible UI work.
- [references/today.md](references/today.md) — The **Today** home view: implementing `GET /api/moldable/today`, item kinds, actions, and the "quiet by default" rules.
- [references/ui.md](references/ui.md) — Current `@moldable-ai/ui` source routing, macOS-native app shell, component decisions, standalone windows, fallback-first host services, themes, and commands
- [../moldable-ui-patterns/SKILL.md](../moldable-ui-patterns/SKILL.md) — Focused component-selection and macOS-quality workflow. Read for visible UI creation, refactoring, or audits when this sibling skill is available.
- [references/native-ui.md](references/native-ui.md) — iOS semantic-projection workflow, app ownership, verified assets, conversational actions, incremental updates, and delivery rules
- [references/native-ui-catalog.md](references/native-ui-catalog.md) — Current Moldable native component families and compact property reference
- [references/native-ui-patterns.md](references/native-ui-patterns.md) — Reusable iPhone compositions for collections, details, dashboards, galleries, maps, schedules, forms, media, and system states
- [references/voice-and-remote-control.md](references/voice-and-remote-control.md) — Voice enablement, shared semantic actions, paired iPhone transport boundaries, replay, assets, and current limitations
- [references/sync.md](references/sync.md) — Filesystem sync ownership, included and excluded state, offline/conflict behavior, app-release divergence, and iOS boundaries
- [references/storage-patterns.md](references/storage-patterns.md) — Filesystem storage, React Query, workspace-aware APIs
- [references/browser-storage-audit.md](references/browser-storage-audit.md) — Current browser storage usage and migration guidance
- [references/desktop-apis.md](references/desktop-apis.md) — Router for desktop integration APIs
- [references/desktop-message-apis.md](references/desktop-message-apis.md) — Window, channel-context, file, and artifact postMessage APIs
- [references/native-apis.md](references/native-apis.md) — Typed native capability API overview and usage rules; route native-capability UI through [references/ui.md](references/ui.md)
- [references/native-api-support.md](references/native-api-support.md) — Native capability support matrix and permission summary
- [references/native-api-permissions.md](references/native-api-permissions.md) — `nativeCapabilities` declarations and per-app workspace grants
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

For any visible app UI, read [references/design.md](references/design.md) before editing `src/client/app.tsx` or client components. Also use the focused [moldable-ui-patterns skill](../moldable-ui-patterns/SKILL.md) when available; it routes component choice, app-shell composition, keyboard/accessibility checks, and per-component guidance.

For a native iPhone surface, do not use the web UI workflow below. Read the
three native UI references above and use the conversation-scoped `nativeUI`
tool. The host owns SwiftUI styling, navigation chrome, presentation, Relay,
and rendering; the agent supplies semantic hierarchy, bounded data bindings,
verified asset aliases, and actions.

### Required Design-System Workflow

1. **Identify the shell archetype.** Name the app's primary object and choose
   the full-height, list-detail, document/editor, paneled workspace, focused
   dock, or timeline shape from [references/design.md](references/design.md).
2. **Select components by intent.** Use the short decision tables in
   [references/ui.md](references/ui.md); start with `AppFrame` and compose
   shared pane, toolbar, inspector, feedback, and control families.
3. **Read the selected guides.** Confirm every named export in the public
   barrels, then read each selected component family's colocated
   colocated guide. The guide owns props, states, keyboard behavior, and
   composition details.
4. **Inventory states before implementation.** Cover every applicable loading,
   empty, error, disabled, selected, invalid, auth, permission, busy, offline,
   and fallback state.
5. **Implement with the shared system.** Use the shared shell, semantic tokens,
   density, materials, and host-service/native-capability hooks. If a needed
   primitive is absent, report it instead of cloning or hand-rolling it.
6. **Verify the complete view.** Check keyboard-only use and visible focus,
   light and dark themes, narrow width, and standalone/embedded safe areas.
   Also check reduced motion, reduced transparency, and increased contrast when
   material or motion is present.

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

See [references/ui.md](references/ui.md) for source routing, component
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
[references/ui.md](references/ui.md) and the package README rather than
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
network calls. See [references/artifact-publishing.md](references/artifact-publishing.md).

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

Use `sandbox: false` for package manager commands:

```typescript
await runCommand({
  command: "cd ~/.moldable/shared/apps/my-app && pnpm add zod",
  sandbox: false, // Required for network access
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
8. **❌ Running pnpm with sandbox** — Set `sandbox: false` for network access

## Study Existing Apps

For complex features, reference apps in `~/.moldable/shared/apps/`:

- **scribo** — Translation journal with language selection
- **meetings** — Audio recording with real-time transcription
- **calendar** — Google Calendar integration with OAuth

These demonstrate data fetching, storage patterns, API routes, and UI components.
