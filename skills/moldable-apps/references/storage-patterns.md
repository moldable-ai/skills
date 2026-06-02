# Moldable Storage Patterns

Moldable is local-first and workspace-based. Apps must isolate data per workspace so users can keep separate Personal, Work, or project contexts.

## Principles

1. Persist to the filesystem through server APIs.
2. Do not use `localStorage` or `sessionStorage` for durable app data, user preferences, workspace settings, caches, OAuth state, secrets, or anything that should survive as part of a workspace.
3. Use `@moldable-ai/storage` helpers on the server.
4. Use `fetchWithWorkspace` on the client.
5. Include `workspaceId` in React Query keys.

## Browser Storage Anti-Pattern

Treat browser storage as host-private implementation detail, not app storage. Moldable apps run inside desktop webviews while the desktop owns workspace routing and data isolation. Anything stored in `localStorage` persists outside the app's workspace data directory, is invisible to Git-native backups, cannot be inspected or migrated by app RPC, and can silently diverge from server state.

Do not use browser storage for:

- workspace-specific settings such as selected view mode, selected instrument, selected provider, or other preferences
- app-owned data such as favorites, streaks, drafts, generated assets, documents, cache records, or indexes
- API keys, OAuth state, tokens, or other secrets
- durable client caches of server data

Use app server routes backed by `getAppDataDir(workspaceId)` instead. Client code should load those settings/data with `fetchWithWorkspace` and React Query keys that include `workspaceId`.

The only acceptable browser storage use is disposable UI state that does not need backup, sync, migration, RPC access, or cross-session durability. Prefer React state for this. If state should survive app reloads or workspace switches, it belongs in workspace-scoped app storage.

## Data Directory

```text
~/.moldable/workspaces/{workspace-id}/apps/{app-id}/data/
├── items.json
├── attachments/
└── database.sqlite
```

## Client Pattern

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@moldable-ai/ui'

function Items() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()
  const queryClient = useQueryClient()

  const itemsQuery = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: async () => {
      const res = await fetchWithWorkspace('/api/items')
      if (!res.ok) throw new Error('Failed to fetch items')
      return res.json()
    },
  })

  const createItem = useMutation({
    mutationFn: async (item: { name: string }) => {
      const res = await fetchWithWorkspace('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('Failed to create item')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', workspaceId] })
    },
  })
}
```

## Hono Server Pattern

```ts
import {
  generateId,
  getAppDataDir,
  getWorkspaceFromRequest,
  readJson,
  safePath,
  writeJson,
} from '@moldable-ai/storage'
import { Hono } from 'hono'

interface Item {
  id: string
  name: string
  createdAt: string
}

export const app = new Hono()

function getItemsPath(workspaceId?: string): string {
  return safePath(getAppDataDir(workspaceId), 'items.json')
}

app.get('/api/items', async (c) => {
  const workspaceId = getWorkspaceFromRequest(c.req.raw)
  const items = await readJson<Item[]>(getItemsPath(workspaceId), [])
  return c.json(items)
})

app.post('/api/items', async (c) => {
  const workspaceId = getWorkspaceFromRequest(c.req.raw)
  const body = (await c.req.json()) as { name?: string }
  const path = getItemsPath(workspaceId)
  const items = await readJson<Item[]>(path, [])
  const item = {
    id: generateId(),
    name: body.name ?? 'Untitled',
    createdAt: new Date().toISOString(),
  }
  items.push(item)
  await writeJson(path, items)
  return c.json(item, 201)
})

app.delete('/api/items/:id', async (c) => {
  const workspaceId = getWorkspaceFromRequest(c.req.raw)
  const id = c.req.param('id')
  const path = getItemsPath(workspaceId)
  const items = await readJson<Item[]>(path, [])
  const nextItems = items.filter((item) => item.id !== id)
  if (nextItems.length === items.length) {
    return c.json({ error: 'Not found' }, 404)
  }
  await writeJson(path, nextItems)
  return c.json({ ok: true })
})
```

## Storage Helpers

```ts
import {
  getMoldableHome,
  getWorkspaceId,
  getAppDataDir,
  getAppId,
  isRunningInMoldable,
  safePath,
  readJson,
  writeJson,
} from '@moldable-ai/storage'
```

Use `safePath(base, ...segments)` for user-controlled path segments. It rejects traversal and absolute paths.
