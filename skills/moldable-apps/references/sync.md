# Sync and App Releases

Read this when an app stores durable workspace data, is intended to be distributed as a Moldable release, or a request assumes iOS has a local synced copy.

## Current boundaries

- **Moldable Drive** is the macOS filesystem-sync implementation. The desktop enables it through its bundled Drive app; it keeps a hosted copy of Moldable apps and workspace data. It is currently macOS-only.
- **The iOS app is a paired remote controller**, not a Drive client: it sends workspace-scoped commands to the desktop through the relay and renders desktop-owned conversation/view state. It has no `moldable-sync` integration, local workspace-root materialization, or app-release installer.
- The sync service owns remote root sequencing, immutable tree/op/chunk objects, grant checks, retention, and quota. The daemon owns scans, local inventory/pending uploads, downloads/materialization, and conflict detection. The desktop owns Drive setup, status, restore gating, and app lifecycle. Apps own only their own source and workspace data.
- Remote identity is stable root/root-group/account or org identity. Never put an absolute local path in cloud payloads, grants, refs, object keys, upload tickets, or app metadata.

## What is synced

For the desktop's private Moldable root, the intended durable surface includes:

- shared app source/release trees under `shared/apps/`;
- workspace-scoped app data under `workspaces/{workspaceId}/apps/{appId}/data/`;
- portable `conversations-v2` content/record objects (append-only SHA-256-named JSON; deletion is a tombstone record).

The precise enabled roots and policy come from the Drive/daemon configuration; do not assume an arbitrary new path will be backed up. App builders should place durable user data in the workspace app-data directory, pass the host-derived workspace id through every server storage operation, and include it in query/cache keys. Keep app source separate from workspace data.

The daemon intentionally excludes secrets and operational/derived material, including `.env`-style files and credentials, runtime/cache/tmp/log folders, dependency folders, Git metadata, app build output, app process/install state, and live conversation SQLite/WAL/SHM files. Do not store durable user data only in any excluded location, browser storage, a cache, or a live SQLite sidecar. Do not try to override the hard privacy exclusions.

## App releases are not ordinary file sync

Shared apps may be installed as signed, approved releases. Installation verifies the approved release envelope, signing key/trust policy, manifest, and installed files before replacing the app tree.

After a verified install, a subscription records the installed manifest and follows its release channel only while the local tree still matches it:

- `following`: a matching tree may update.
- `detached`: stop following upstream.
- `forked`: use a new local app id.
- `discardAndFollow`: an explicit destructive choice; the next verified install may replace edits, then returns to `following`.

If a subscribed app has local source edits, automatic replacement stops (`diverged`, `autoUpdateAllowed: false`). Never silently overwrite those edits. Do not treat user workspace data as release content or use a release update to migrate/destructively replace it without an explicit, separately designed data migration.

## Offline, reconnect, and conflicts

Local edits are scanned and persisted as pending work while offline; repeated offline scans coalesce to a superseding whole-tree upload rather than an unbounded queue. Offline is a normal status, not permission to discard edits. On reconnect, the daemon catches up from the remote head and reconciles before uploading a now-stale pending tree.

Concurrent incompatible changes are preserved rather than silently selected: the verified remote version is materialized and the local version is kept as a human-readable `(... conflicted copy <date> <device>)` sibling. Non-overlapping text changes can auto-merge; structural replacements can still yield conflict copies. Desktop conflict actions are explicit **accept local** or **accept remote** and queue the selected outcome. Build data formats and UI that make duplicate/conflict records reviewable and idempotent; do not implement "last writer wins" in an app layer.

Large or ambiguous deletion sets are protected: the daemon can defer propagation until the absence is re-verified. Apps must use atomic writes/replace patterns where possible, tolerate a file disappearing and returning during reconciliation, and never delete sibling conflict copies as cleanup.

## Privacy and security

- Sync is **server-readable**, not end-to-end encrypted. Traffic uses TLS; stored objects use Cloudflare/R2 encryption at rest with server-managed keys. Do not claim E2EE or place secrets in synced app data.
- Sync access is controlled by account/org ownership and device-bound, root-scoped grants (`read`, `write`, `admin`). Keep credentials in host-managed secure storage/configuration; never embed a sync grant token, account token, or device identity in app source or workspace data.
- App-release signatures establish release provenance; they are not encryption for synced content.
- A user who turns Drive off retains local data, while the desktop UI states the hosted copy is removed after its undo period. Treat syncing as backup/replication, not the sole recovery strategy.

## Builder rules

1. Store durable app state only under the host-provided workspace app-data root; scope every API, cache key, and migration by workspace id.
2. Keep secrets, tokens, logs, caches, generated builds, dependencies, and runtime locks out of durable app state. Put safely rebuildable app caches under `getAppCacheDir(workspaceId)`; use host secure-storage/permission APIs for secrets and privileged access.
3. Make writes crash-safe and retry-safe. On reload or remote materialization, validate data, tolerate duplicates/replays, and surface recoverable conflicts instead of overwriting data.
4. Treat a workspace's source installation and its data as separate lifecycle domains: source may be signed/released/restarted; data must remain workspace-scoped and migration-compatible.
5. Do not add app-specific direct calls to the sync Worker, daemon, Drive state files, or iOS relay to synchronize data. Those are host-owned transports. Expose ordinary workspace-aware app APIs; the desktop/remote projection is the integration boundary.
6. Prefer provider cursors/deltas and no-op-aware cache writes over repeated full scans. A frequently rewritten SQLite/cache file inside durable app data is still sync churn, even when it replaces many smaller files.

## Known limits

Keep a separate backup. The iOS remote can select workspaces and operate the
desktop's conversations, attachments, views, and voice session, but it is not
offline workspace sync and should not be documented or built as one.
