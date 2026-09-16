## Detailed References

Read these for in-depth guidance:

### Core Concepts

- [references/app-lifecycle.md](app-lifecycle.md) — Creating, starting, managing, and deleting apps
- [references/app-scaffold.md](app-scaffold.md) — **Required files**, lint rules, templates for new apps
- [references/workspaces.md](workspaces.md) — Workspace system, data isolation, environment layering
- [references/configuration.md](configuration.md) — moldable.json, config.json, environment variables

### Implementation Patterns

- [references/design.md](design.md) — Moldable product design guidance for app archetypes, state handling, density, copy, motion, and UI polish. Read this before visible UI work.
- [references/today.md](today.md) — The **Today** home view: implementing `GET /api/moldable/today`, item kinds, actions, and the "quiet by default" rules.
- [references/ui.md](ui.md) — Current `@moldable-ai/ui` source routing, macOS-native app shell, component decisions, standalone windows, fallback-first host services, themes, and commands
- [../moldable-ui-patterns/SKILL.md](../../moldable-ui-patterns/SKILL.md) — Focused component-selection and macOS-quality workflow. Read for visible UI creation, refactoring, or audits when this sibling skill is available.
- [references/native-ui.md](native-ui.md) — iOS semantic-projection workflow, app ownership, verified assets, conversational actions, incremental updates, and delivery rules
- [references/native-ui-catalog.md](native-ui-catalog.md) — Current Moldable native component families and compact property reference
- [references/native-ui-patterns.md](native-ui-patterns.md) — Reusable iPhone compositions for collections, details, dashboards, galleries, maps, schedules, forms, media, and system states
- [references/voice-and-remote-control.md](voice-and-remote-control.md) — Voice enablement, shared semantic actions, paired iPhone transport boundaries, replay, assets, and current limitations
- [references/sync.md](sync.md) — Filesystem sync ownership, included and excluded state, offline/conflict behavior, app-release divergence, and iOS boundaries
- [references/storage-patterns.md](storage-patterns.md) — Filesystem storage, React Query, workspace-aware APIs
- [references/browser-storage-audit.md](browser-storage-audit.md) — Current browser storage usage and migration guidance
- [references/desktop-apis.md](desktop-apis.md) — Router for desktop integration APIs
- [references/desktop-message-apis.md](desktop-message-apis.md) — Window, channel-context, file, and artifact postMessage APIs
- [references/native-apis.md](native-apis.md) — Typed native capability API overview and usage rules; route native-capability UI through [references/ui.md](ui.md)
- [references/native-api-support.md](native-api-support.md) — Native capability support matrix and permission summary
- [references/native-api-permissions.md](native-api-permissions.md) — `nativeCapabilities` declarations and per-app workspace grants
- [references/native-api-media.md](native-api-media.md) — Camera, microphone, display capture, macOS permission status/request/diagnostics, and system audio
- [references/native-api-location.md](native-api-location.md) — Current-position API and permission behavior
- [references/native-api-clipboard.md](native-api-clipboard.md) — Native clipboard text APIs
- [references/native-api-notifications.md](native-api-notifications.md) — Native system notifications and permissions
- [references/native-api-displays.md](native-api-displays.md) — Connected display metadata
- [references/native-api-global-shortcuts.md](native-api-global-shortcuts.md) — Global shortcut registration, events, conflicts, and cleanup
- [references/native-api-power-session.md](native-api-power-session.md) — Power, current thermal and idle state, lifecycle events, plus queryable sleep blockers
- [references/native-api-local-authentication.md](native-api-local-authentication.md) — Biometric-only or device-owner verification policies
- [references/native-api-haptics.md](native-api-haptics.md) — API acceptance and honest physical-feedback semantics
- [references/native-api-secure-storage.md](native-api-secure-storage.md) — Scoped credential values and non-secret backend diagnostics
- [references/native-api-usb.md](native-api-usb.md) — Filtered WebUSB/native device access and transfers
- [references/native-api-hid.md](native-api-hid.md) — Filtered WebHID/native reports and listeners
- [references/native-api-serial.md](native-api-serial.md) — Web Serial/native ports, streams, and signals
- [references/native-api-midi.md](native-api-midi.md) — Web MIDI/native ports, messages, and SysEx rules
- [references/native-api-bluetooth.md](native-api-bluetooth.md) — Web Bluetooth/native BLE GATT access
- [references/native-api-platform-macos.md](native-api-platform-macos.md) — macOS permission and support notes
- [references/native-api-platform-windows.md](native-api-platform-windows.md) — Windows permission and support notes
- [references/native-api-platform-linux.md](native-api-platform-linux.md) — Linux runtime and validation notes
- [references/artifact-publishing.md](artifact-publishing.md) — Publishing public unlisted HTML/CSS/asset bundles through Moldable Artifacts
- [references/app-to-app-communication.md](app-to-app-communication.md) — App-to-app RPC, capability manifests, workspace-scoped grants, Calendar-owned OAuth/data access
- [references/skills-mcps.md](skills-mcps.md) — Skills library, MCP configuration, custom MCP servers

