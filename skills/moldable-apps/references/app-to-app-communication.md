# App-to-App Communication

Moldable apps can expose private, workspace-scoped APIs to each other through the Moldable desktop broker. Use this pattern when one app owns data, OAuth, or domain logic that another app should consume without duplicating credentials or reading another app's data directory.

## Core Rules

- The target app owns its provider OAuth, refresh tokens, local data, and domain-specific API calls.
- Caller apps must never read another app's runtime data directory directly.
- Caller apps must never duplicate provider OAuth just to access another app's data.
- Access grants are workspace-specific. Personal and Work can approve different app relationships.
- The desktop broker identifies the caller app and checks grants before invoking the target app.
- Target apps should expose a private RPC endpoint under `/api/moldable/rpc`.

## Declaring Capabilities

Apps declare app-to-app capabilities in `moldable.json`:

```json
{
  "appApi": {
    "version": 1,
    "capabilities": [
      {
        "id": "calendar.events",
        "name": "Calendar events",
        "description": "Read workspace calendar events managed by Calendar.",
        "scopes": [
          {
            "id": "events.today",
            "name": "Today's events",
            "description": "Read upcoming events for today."
          },
          {
            "id": "events.list",
            "name": "Event ranges",
            "description": "Read calendar events for a requested time range."
          }
        ]
      }
    ]
  }
}
```

## Drive contract (voice + channel steering)

Every new app must be steerable through the same private app API used by bot
channels, group channels, and voice. Put the drive surface under one
`<appId>.drive` capability, and fully prefix every scope id with `<appId>.`:

```json
{
  "appApi": {
    "version": 1,
    "capabilities": [
      {
        "id": "plants.drive",
        "name": "Drive the Plants UI",
        "description": "Describe, navigate, and read the running Plants UI. These scopes only change what is displayed or read data.",
        "scopes": [
          {
            "id": "plants.ui.describe",
            "name": "Describe UI views",
            "description": "List every navigable Plants view and explain the entityId and params each view accepts."
          },
          {
            "id": "plants.ui.navigate",
            "name": "Navigate the UI",
            "description": "Navigate the running Plants UI to a view returned by plants.ui.describe. This changes only what is displayed."
          },
          {
            "id": "plants.ui.read",
            "name": "Read a view",
            "description": "Return a faithful machine-readable representation of the current or requested Plants view."
          }
        ]
      }
    ]
  }
}
```

The descriptions are model instructions, not decorative labels. State what each scope does, how to obtain ids, which inputs are required, what it returns, and whether it changes data.

### A1 — React to app API changes

The host posts `moldable:app-api-changed` after a brokered call. Every stateful client must listen, filter by `targetAppId` and the active workspace, then invalidate the workspace-scoped queries touched by that method. Invalidate all of the app's workspace queries when the target is unclear. Polling apps keep polling and add this listener for immediate updates.

Adapt this listener from Plants. The same event also prompts the client to check for the A2 navigation intent:

```tsx
useEffect(() => {
  const onMessage = (event: MessageEvent) => {
    const data = event.data as
      | { type?: string; targetAppId?: string; workspaceId?: string }
      | null
      | undefined;

    if (data?.type !== "moldable:app-api-changed") return;
    if (data.targetAppId !== "plants") return;
    if (data.workspaceId && data.workspaceId !== workspaceId) return;

    void queryClient.invalidateQueries({
      queryKey: ["plants", workspaceId],
    });
    void refreshUiIntent();
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, [queryClient, workspaceId, refreshUiIntent]);
```

### A2 — Describe and navigate the real UI

`<appId>.ui.describe` returns a model-readable catalog of everything `<appId>.ui.navigate` can target: `{ views: [{ id, name, description, params? }], entities?: hint }`. Use the optional `entities` hint to explain where the model can obtain valid entity ids.

```ts
const UI_VIEW_IDS = ["home", "all", "room", "search", "plant"] as const;
type UiViewId = (typeof UI_VIEW_IDS)[number];

const UI_VIEWS: {
  id: UiViewId;
  name: string;
  description: string;
  params?: Record<string, string>;
}[] = [
  {
    id: "home",
    name: "Home",
    description: "The folder grid the app opens on. Takes no entityId or params.",
  },
  {
    id: "room",
    name: "Room",
    description:
      "Plants in one room. Requires params.room set to the room name returned by plants.list.",
    params: { room: "Room name exactly as stored on the plant." },
  },
  {
    id: "search",
    name: "Search results",
    description:
      "Search the collection. Requires params.query: text matched against plant fields.",
    params: { query: "Free-text search string." },
  },
  {
    id: "plant",
    name: "Plant detail",
    description:
      "One plant's detail view. Requires entityId from plants.list or plants.get.",
  },
  {
    id: "all",
    name: "All plants",
    description: "Photo gallery of every plant. Takes no entityId or params.",
  },
];
```

List every navigable view. Descriptions must tell the model what the user will see and where valid entity ids and parameter values come from.

Validate both RPC envelopes and method inputs with Zod. Reject unknown views, missing required ids, invalid params, and missing entities instead of recording an intent the client cannot honor:

```ts
const rpcRequestSchema = z.object({
  method: z.string(),
  params: z.unknown().optional(),
});

const uiDescribeParamsSchema = z.object({}).optional();

const uiNavigateParamsSchema = z
  .object({
    view: z.enum(UI_VIEW_IDS),
    entityId: z.string().min(1).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.view === "plant" && !value.entityId) {
      ctx.addIssue({
        code: "custom",
        path: ["entityId"],
        message: "entityId is required for the plant view.",
      });
    }
    if (value.view === "room" && typeof value.params?.room !== "string") {
      ctx.addIssue({
        code: "custom",
        path: ["params", "room"],
        message: "params.room is required for the room view.",
      });
    }
  });
```

Navigation crosses the server/client boundary through one workspace-scoped, last-wins `ui-intent` slot in the app's data directory:

```ts
import {
  ensureDir,
  getAppDataDir,
  readJson,
  safePath,
  writeJson,
} from "@moldable-ai/storage";

type UiIntent = {
  id: string;
  view: UiViewId;
  entityId?: string;
  params?: Record<string, unknown>;
  createdAt: string;
};

function getUiIntentPath(workspaceId?: string): string {
  return safePath(getAppDataDir(workspaceId), "ui-intent.json");
}

async function readUiIntent(workspaceId?: string): Promise<UiIntent | null> {
  await ensureDir(getAppDataDir(workspaceId));
  return readJson<UiIntent | null>(getUiIntentPath(workspaceId), null);
}

async function writeUiIntent(
  intent: UiIntent | null,
  workspaceId?: string,
): Promise<void> {
  await ensureDir(getAppDataDir(workspaceId));
  await writeJson(getUiIntentPath(workspaceId), intent);
}

async function setUiIntent(
  input: {
    view: UiViewId;
    entityId?: string;
    params?: Record<string, unknown>;
  },
  workspaceId?: string,
): Promise<UiIntent> {
  const intent: UiIntent = {
    id: crypto.randomUUID(),
    view: input.view,
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.params && Object.keys(input.params).length > 0
      ? { params: input.params }
      : {}),
    createdAt: new Date().toISOString(),
  };
  await writeUiIntent(intent, workspaceId);
  return intent;
}
```

Expose the slot through workspace-aware GET and DELETE routes. DELETE is an acknowledgement: clear only when its `id` matches the current slot, so an old client cannot erase a newer intent.

```ts
app.get("/api/moldable/ui-intent", async (c) => {
  const workspaceId = getRpcWorkspaceId(c.req.raw);
  const intent = await readUiIntent(workspaceId);
  return c.json(intent, 200, { "Cache-Control": "no-store" });
});

app.delete("/api/moldable/ui-intent", async (c) => {
  const id = c.req.query("id");
  if (!id?.trim()) {
    return c.json({ error: "Missing id query parameter" }, 400);
  }

  const workspaceId = getRpcWorkspaceId(c.req.raw);
  const intent = await readUiIntent(workspaceId);
  const cleared = intent?.id === id;
  if (cleared) await writeUiIntent(null, workspaceId);
  return c.json({ ok: true, cleared });
});
```

Dispatch `ui.describe` and `ui.navigate` through the normal validated RPC endpoint. Plants also verifies that a requested plant still exists before writing the intent:

```ts
const body = rpcRequestSchema.parse(await c.req.json());

if (body.method === "plants.ui.describe") {
  uiDescribeParamsSchema.parse(body.params);
  return c.json({ ok: true, result: { views: UI_VIEWS } });
}

if (body.method === "plants.ui.navigate") {
  const params = uiNavigateParamsSchema.parse(body.params);

  if (params.view === "plant" && params.entityId) {
    const plants = await loadPlants(workspaceId);
    const exists = plants.some(
      (plant) => plant.id === params.entityId && !plant.isDeleted,
    );
    if (!exists) return notFound(c, params.entityId);
  }

  const intent = await setUiIntent(params, workspaceId);
  return c.json({ ok: true, result: { ok: true, intentId: intent.id } });
}
```

The client checks the slot on mount and after the A1 event, applies each unseen intent to real client state, then acknowledges it:

```tsx
const [pendingIntent, setPendingIntent] = useState<UiIntent | null>(null);
const seenIntentIds = useRef<Set<string>>(new Set());

const refreshUiIntent = useCallback(async () => {
  try {
    const response = await fetchWithWorkspace("/api/moldable/ui-intent");
    if (!response.ok) return;
    const intent = (await response.json()) as UiIntent | null;
    if (!intent?.id || seenIntentIds.current.has(intent.id)) return;
    setPendingIntent(intent);
  } catch {
    // Best-effort: the next host event or mount can retry.
  }
}, [fetchWithWorkspace]);

useEffect(() => {
  void refreshUiIntent();
}, [refreshUiIntent]);

// Implement this with the app's actual router/state setters. For Plants this
// opens folders or a plant, applies a search, and optionally focuses a photo.
const applyUiIntent = useCallback((intent: UiIntent) => {
  if (intent.view === "plant" && intent.entityId) {
    openPlant(intent.entityId, intent.params);
    return;
  }
  if (intent.view === "search") {
    setSearch(String(intent.params?.query ?? ""));
    return;
  }
  openView(intent.view, intent.params);
}, [openPlant, openView]);

useEffect(() => {
  if (!pendingIntent || !viewDataIsReady) return;

  const intent = pendingIntent;
  seenIntentIds.current.add(intent.id);
  setPendingIntent(null);
  applyUiIntent(intent);
  void fetchWithWorkspace(
    `/api/moldable/ui-intent?id=${encodeURIComponent(intent.id)}`,
    { method: "DELETE" },
  ).catch(() => undefined);
}, [
  pendingIntent,
  viewDataIsReady,
  applyUiIntent,
  fetchWithWorkspace,
]);
```

Do not acknowledge before the UI state is ready and the intent has been applied. `ui.navigate` must change what the user sees; returning `{ ok: true }` without client consumption does not satisfy the contract.

### A3 — Add signature drive actions

Add normal, fully prefixed RPC scopes for the app's demo-worthy verbs: start or stop a timer, show a photo fullscreen, present a deck, open a recipe's cook view, start a piano piece, or enter a teaching overlay. Highlight, annotate, coach, and explain-mode actions belong here when they make the app easier to drive.

Give every signature action a model-readable description that states:

- what visibly changes;
- where ids and valid values come from;
- required and optional inputs;
- its return value and important failure cases;
- whether it reads data, makes a reversible change, or performs an irreversible action.

If an action is irreversible, its scope description must explicitly say **irreversible** and name the data or external effect that cannot be recovered. Never let a vague verb or friendly display name hide a destructive side effect.

Pure presentation actions can write the same `ui-intent` slot with a specialized view or params. Data mutations remain ordinary RPC methods; the A1 listener makes their results appear immediately.

### A4 — Make every drivable view readable

Ship `<appId>.ui.read` so the model can read the current view or a specified `{ view, entityId?, params? }`. Return the data behind the view, not a rendering of it.

The result may be any faithful machine-readable representation:

- structured JSON from the app's data layer is preferred;
- plain text or Markdown is valid when it represents the view more faithfully;
- pixels, screenshots, image encodings, and HTML are never valid `ui.read` results.

Include all content needed to understand or narrate the view: for example, deck text and speaker notes, current table rows and filters, a book page, or the state of a practice session. The app does not need to author narration; the consuming model projects the result into speech or chat. Screenshots are a separate fallback for genuinely visual or server-unknown surfaces and for post-drive verification.

Validate `ui.read` inputs with Zod and return clean app-owned data:

```ts
const uiReadParamsSchema = z
  .object({
    view: z.enum(UI_VIEW_IDS).optional(),
    entityId: z.string().min(1).optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .optional();

if (body.method === "plants.ui.read") {
  const params = uiReadParamsSchema.parse(body.params) ?? {};
  return c.json({
    ok: true,
    result: await buildViewModel(params, workspaceId),
  });
}
```

Add a `drive.test.ts` (or an equivalent focused suite) covering the manifest/RPC names, model-readable view catalog, Zod failures, last-wins slot, id-matched acknowledgement, missing entities, signature actions, and faithful `ui.read` output. Plants covers this in `src/server/app.test.ts`; Piano provides a dedicated `src/server/drive.test.ts`.

## Calling Another App

`@moldable-ai/ui` does **not** publicly export a caller-side app-to-app helper.

Do not import it, deep-import the implementation, or recreate its broker
messages in app code. Report this public-package gap and wait for a verified
root export before generating a caller. Confirm any new helper in the package
barrel and follow its colocated guide. Access grants remain workspace-specific
and revocable in Settings -> App Access.

## Target RPC Endpoint

Target apps expose one dispatch endpoint:

```ts
app.post("/api/moldable/rpc", async (c) => {
  const body = await c.req.json();
  const workspaceId =
    c.req.header("x-moldable-workspace-id") ?? getWorkspaceFromRequest(c.req.raw);

  if (body.method === "events.today") {
    return c.json({ ok: true, result: await getTodayEvents(workspaceId) });
  }

  return c.json(
    {
      ok: false,
      error: {
        code: "method_not_found",
        message: `Unknown method: ${body.method}`,
      },
    },
    404,
  );
});
```

Use structured errors:

```json
{
  "ok": false,
  "error": {
    "code": "calendar_not_connected",
    "message": "Connect Calendar before other apps can show upcoming events."
  }
}
```

## Example: Calendar and Meetings

Calendar owns Google Calendar OAuth and exposes:

- `events.today` for upcoming events in the active workspace's local day
- `events.list` for bounded date ranges

Meetings calls Calendar through the broker to render a Granola-style "Coming up" area. Meetings should show a helpful empty state if Calendar is not connected, but it should not ask for Google Calendar credentials itself.

## Storage

Workspace-specific grants live at:

```text
~/.moldable/workspaces/{workspace-id}/config/app-permissions.json
```

Do not edit this file from app code. Use the desktop broker and Settings UI.
