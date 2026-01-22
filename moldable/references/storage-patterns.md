# Moldable Storage Patterns

Moldable is local-first and workspace-based. Apps must isolate data per workspace so users can have separate data in different contexts (e.g., "Personal" vs "Work").

## Key Principles

1. **Persist to filesystem**, not browser localStorage
2. **Always use workspace ID** for data isolation
3. **Use `@moldable-ai/storage`** helpers on the server
4. **Use `fetchWithWorkspace`** on the client
5. **Include workspaceId in React Query keys** for cache isolation

## Directory Structure

```
~/.moldable/workspaces/{workspace-id}/apps/{app-id}/data/
├── items.json           # Simple JSON storage
├── meetings/            # Subdirectory for related files
│   ├── abc123.json
│   └── def456.json
└── database.sqlite      # SQLite for complex queries
```

## Implementation Pattern

### 1. Layout Setup

Wrap your app with `WorkspaceProvider`:

```tsx
// src/app/layout.tsx
import { ThemeProvider, WorkspaceProvider } from '@moldable-ai/ui'
import { QueryProvider } from '@/lib/query-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <WorkspaceProvider>
            <QueryProvider>{children}</QueryProvider>
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Client-Side Data Fetching

Use TanStack Query with workspace in query keys:

```tsx
// Client component
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@moldable-ai/ui'

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()
  const queryClient = useQueryClient()

  // GET - Include workspaceId in query key for proper cache isolation
  const { data, isLoading } = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: async () => {
      const res = await fetchWithWorkspace('/api/items')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  // POST - Invalidate with workspaceId after mutation
  const createMutation = useMutation({
    mutationFn: async (newItem) => {
      const res = await fetchWithWorkspace('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', workspaceId] })
    },
  })

  // DELETE
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetchWithWorkspace(`/api/items/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', workspaceId] })
    },
  })

  return (
    <div>
      {isLoading ? 'Loading...' : data?.map(item => (
        <div key={item.id}>
          {item.name}
          <button onClick={() => deleteMutation.mutate(item.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => createMutation.mutate({ name: 'New Item' })}>
        Add Item
      </button>
    </div>
  )
}
```

### 3. Server-Side API Routes

Extract workspace from request headers using `@moldable-ai/storage`:

```tsx
// src/app/api/items/route.ts
import { NextResponse } from 'next/server'
import {
  getWorkspaceFromRequest,
  getAppDataDir,
  safePath,
  readJson,
  writeJson,
  generateId,
} from '@moldable-ai/storage'

// Helper to get workspace-aware items path
function getItemsPath(workspaceId?: string): string {
  return safePath(getAppDataDir(workspaceId), 'items.json')
}

// GET /api/items
export async function GET(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request)
  const items = await readJson(getItemsPath(workspaceId), [])
  return NextResponse.json(items)
}

// POST /api/items
export async function POST(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request)
  const body = await request.json()
  
  const items = await readJson(getItemsPath(workspaceId), [])
  const newItem = {
    id: generateId(),
    ...body,
    createdAt: new Date().toISOString(),
  }
  items.push(newItem)
  
  await writeJson(getItemsPath(workspaceId), items)
  return NextResponse.json(newItem, { status: 201 })
}
```

```tsx
// src/app/api/items/[id]/route.ts
import { NextResponse } from 'next/server'
import {
  getWorkspaceFromRequest,
  getAppDataDir,
  safePath,
  readJson,
  writeJson,
} from '@moldable-ai/storage'

function getItemsPath(workspaceId?: string): string {
  return safePath(getAppDataDir(workspaceId), 'items.json')
}

// GET /api/items/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const workspaceId = getWorkspaceFromRequest(request)
  const items = await readJson(getItemsPath(workspaceId), [])
  const item = items.find((i) => i.id === id)
  
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(item)
}

// DELETE /api/items/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const workspaceId = getWorkspaceFromRequest(request)
  const items = await readJson(getItemsPath(workspaceId), [])
  const filtered = items.filter((i) => i.id !== id)
  
  if (filtered.length === items.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  await writeJson(getItemsPath(workspaceId), filtered)
  return NextResponse.json({ ok: true })
}

// PATCH /api/items/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const workspaceId = getWorkspaceFromRequest(request)
  const updates = await request.json()
  
  const items = await readJson(getItemsPath(workspaceId), [])
  const index = items.findIndex((i) => i.id === id)
  
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  await writeJson(getItemsPath(workspaceId), items)
  return NextResponse.json(items[index])
}
```

## @moldable-ai/storage API Reference

### Path Helpers

```typescript
import {
  getMoldableHome,    // Returns ~/.moldable path
  getWorkspaceId,     // Get workspace ID from env or override
  getAppDataDir,      // Get workspace-aware data directory
  getAppId,           // Get app ID from MOLDABLE_APP_ID env
  isRunningInMoldable // Check if running in Moldable vs standalone
} from '@moldable-ai/storage'

// Get data dir for specific workspace
const dataDir = getAppDataDir('personal')
// => /Users/rob/.moldable/workspaces/personal/apps/my-app/data
```

### Safe Path Operations

```typescript
import { safePath, sanitizeId, generateId } from '@moldable-ai/storage'

// Safely join paths (prevents directory traversal)
const filePath = safePath(dataDir, 'meetings', 'abc123.json')

// Throws PathTraversalError:
safePath(dataDir, '../../../etc/passwd')  // ❌

// Validate IDs for filenames
sanitizeId('meeting-123')  // ✅ 'meeting-123'
sanitizeId('note_v2')      // ✅ 'note_v2'
sanitizeId('../etc')       // ❌ throws Error

// Generate unique IDs
const id = generateId()  // e.g., '1704067200000-x7k9m2'
```

### JSON File Operations

```typescript
import { readJson, writeJson, ensureDir } from '@moldable-ai/storage'

// Read JSON (returns default if file doesn't exist)
const items = await readJson('/path/to/items.json', [])

// Write JSON (creates parent dirs automatically)
await writeJson('/path/to/items.json', items)

// Ensure directory exists
await ensureDir('/path/to/subdir')
```

### Extracting Workspace from Requests

```typescript
import { getWorkspaceFromRequest, WORKSPACE_HEADER } from '@moldable-ai/storage'

export async function GET(request: Request) {
  // Extract workspace ID from x-moldable-workspace header
  const workspaceId = getWorkspaceFromRequest(request)
  // undefined if header not present (use default workspace)
}
```

## Complex Data: SQLite Pattern

For apps with complex queries, use SQLite:

```tsx
// src/lib/db.ts
import Database from 'better-sqlite3'
import { getAppDataDir, safePath, ensureDir } from '@moldable-ai/storage'

let db: Database.Database | null = null

export async function getDb(workspaceId?: string): Promise<Database.Database> {
  if (!db) {
    const dataDir = getAppDataDir(workspaceId)
    await ensureDir(dataDir)
    
    const dbPath = safePath(dataDir, 'database.sqlite')
    db = new Database(dbPath)
    
    // Initialize schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }
  return db
}
```

## File Storage Pattern

For storing user files (images, audio, etc.):

```tsx
import { writeFile, readFile, unlink } from 'fs/promises'
import { getAppDataDir, safePath, ensureDir, generateId } from '@moldable-ai/storage'

// Save uploaded file
export async function POST(request: Request) {
  const workspaceId = getWorkspaceFromRequest(request)
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  const dataDir = getAppDataDir(workspaceId)
  const filesDir = safePath(dataDir, 'files')
  await ensureDir(filesDir)
  
  const fileId = generateId()
  const ext = file.name.split('.').pop() || ''
  const filename = `${fileId}.${ext}`
  const filePath = safePath(filesDir, filename)
  
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)
  
  return NextResponse.json({ id: fileId, filename, path: filePath })
}
```

## Common Pitfalls

1. **❌ Using localStorage** - Data won't persist across browser sessions in webviews
2. **❌ Forgetting workspaceId in query keys** - Causes stale data when switching workspaces
3. **❌ Hardcoding paths** - Use `getAppDataDir()` for portability
4. **❌ Not validating user input in paths** - Use `safePath()` to prevent traversal
5. **❌ Missing WorkspaceProvider** - Client hooks won't work without it
