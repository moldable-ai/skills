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

The home screen is the host-rendered **Today** view. Apps participate by implementing `GET /api/moldable/today`, which returns items/resume only when something genuinely needs the user (quiet by default). See [references/today.md](today.md).

### Drive contract

Every new app must be drivable from bot channels, group channels, and voice from day one. Declare an `<appId>.drive` capability with fully prefixed `<appId>.ui.describe`, `<appId>.ui.navigate`, and `<appId>.ui.read` scopes; implement the workspace-scoped UI-intent flow; and listen for `moldable:app-api-changed` in the client. Add model-readable signature actions for the app's important verbs. Follow [references/app-to-app-communication.md](app-to-app-communication.md#drive-contract-voice--channel-steering) for the complete contract and Plants reference code.

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

