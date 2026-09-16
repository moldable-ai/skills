---
name: moldable
description: "Create or modify Moldable apps, or configure their workspace, native UI, host integrations, and scheduled work."
---

# Moldable App Development

Build and maintain apps inside Moldable using the current host tools and public
packages. Finish the requested behavior and relevant verification; resolve
routine details without turning a small edit into a new-app workflow.

## Core contracts

- App source is shared at `$MOLDABLE_HOME/shared/apps/{app-id}` (default
  `~/.moldable/shared/apps/{app-id}`). Runtime data and grants are workspace-scoped.
- Create new apps with `scaffoldApp`. Repair a failed installation in place;
  do not create or register a duplicate. Moldable owns the app-server lifecycle.
- Use workspace-scoped server APIs and `@moldable-ai/storage` for durable data and
  settings. Include workspace identity in requests and query keys. Use
  `getAppDataDir()` for durable state and `getAppCacheDir()` for rebuildable,
  unsynced caches. Browser storage is only for disposable same-session UI state.
- Keep desktop, iPhone, bot/group channels, and Voice on the same authoritative
  app APIs and semantic actions. Do not duplicate domain state per client.
- Use the public `@moldable-ai/ui` API, semantic tokens, `ThemeProvider`, and
  `WorkspaceProvider`; import its styles and install the shared frame lifecycle
  once. Verify unfamiliar exports against the installed package and its guide.
  Report missing shared primitives rather than cloning them or deep-importing.
- Host windows own system chrome and channel placement. App views must work in
  standalone and embedded presentations. Use `AppFrame` for full app views.
- The home surface is Today, quiet unless an item earns attention. Do not create
  retired widget views.
- Removing an app from one workspace, deleting workspace data, and deleting an
  app from all workspaces are different operations. Preserve the user's scope.

## Select the relevant guidance

Read only the route needed for the task. Existing code and current tool schemas
settle routine details; a copy correction does not require reading every guide.

| Task | Reference |
| --- | --- |
| New app, drive contract, Today, channel assignment | [creating-apps](references/creating-apps.md), then [app-scaffold](references/app-scaffold.md) as needed |
| React UI creation or substantial redesign | [ui](references/ui.md) and the sibling [moldable-ui-patterns](../moldable-ui-patterns/SKILL.md) when available |
| Product design direction | [design](references/design.md) |
| Data persistence or sync | [storage-patterns](references/storage-patterns.md) and [sync](references/sync.md) |
| Workspace configuration | [workspaces](references/workspaces.md), [configuration](references/configuration.md) |
| App-to-app APIs and scopes | [app-to-app-communication](references/app-to-app-communication.md) |
| iPhone native projection | [native-ui](references/native-ui.md); consult its pattern/catalog references for the selected composition |
| Native hardware capability | [native-apis](references/native-apis.md); follow the relevant capability and permissions reference |
| Voice and remote behavior | [voice-and-remote-control](references/voice-and-remote-control.md) |
| Scheduled work | [scheduled-work](references/scheduled-work.md) |
| Host messages | [desktop-apis](references/desktop-apis.md) |
| Publishing a static artifact | [artifact-publishing](references/artifact-publishing.md) |
| Lifecycle, removal, and deletion | [app-lifecycle](references/app-lifecycle.md) |
| Skills or MCP configuration | [skills-mcps](references/skills-mcps.md) |
| Implementation examples and directory layout | [implementation-patterns](references/implementation-patterns.md) |
| A specialized topic not listed here | [reference-index](references/reference-index.md) |

Use nativeUI only when exposed by the current iPhone conversation. The React UI
skill does not govern native SwiftUI projections. For new apps the default stack
is Vite + Hono + React + TypeScript, with pnpm; preserve another stack when the
task requires it. Follow the current command schema and permission profile.
