# Moldable UI Components

Use `@moldable-ai/ui` for Moldable app UI. It provides shadcn/ui components, theme support, workspace integration, and Moldable desktop helpers.

## Required Setup

Apps scaffolded by Moldable already include this provider shape:

```tsx
// src/client/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, WorkspaceProvider } from '@moldable-ai/ui'
import { App } from './app'
import { QueryProvider } from './query-provider'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

```css
/* src/client/globals.css */
@import 'tailwindcss';
@import '@moldable-ai/ui/styles';
```

## Components

Import components from `@moldable-ai/ui`:

```tsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  Tabs,
  Tooltip,
} from '@moldable-ai/ui'
```

## Semantic Colors

Always use semantic colors:

```tsx
// Correct
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />

// Wrong
<div className="bg-white text-gray-900" />
```

## Workspace Integration

```tsx
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@moldable-ai/ui'

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()

  const { data } = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: async () => {
      const res = await fetchWithWorkspace('/api/items')
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })
}
```

## Desktop Communication

```tsx
import { downloadFile, isInMoldable, sendToMoldable } from '@moldable-ai/ui'

if (isInMoldable()) {
  sendToMoldable({ type: 'moldable:open-url', url: 'https://example.com' })
}

await downloadFile({
  filename: 'data.csv',
  data: 'name,value\nfoo,1',
  mimeType: 'text/csv',
})
```

## Commands

Expose app commands from a Hono API route and handle them in the client:

```ts
// src/server/app.ts
app.get('/api/moldable/commands', (c) => {
  return c.json({
    commands: [
      {
        id: 'add-item',
        label: 'Add New Item',
        shortcut: 'n',
        icon: 'plus',
        action: { type: 'message', payload: { action: 'add' } },
      },
    ],
  })
})
```

```tsx
import { useMoldableCommands } from '@moldable-ai/ui'

function App() {
  useMoldableCommands({
    'add-item': () => setShowAddForm(true),
  })
}
```

## Widget View

`src/client/widget.tsx` should render compact, glanceable content. Include `GHOST_EXAMPLES` for empty-state consistency and use touch-friendly targets.

```tsx
const GHOST_EXAMPLES = [
  { text: 'First item', icon: '📝' },
  { text: 'Second item', icon: '✨' },
]

export function Widget() {
  return (
    <div className="flex h-full flex-col p-2">
      {/* compact widget content */}
    </div>
  )
}
```

## Markdown And Rich Text

```tsx
import { Markdown } from '@moldable-ai/ui'
import { MarkdownEditor } from '@moldable-ai/editor'
```
