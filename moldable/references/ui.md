# Moldable UI Components

**ALWAYS use `@moldable-ai/ui` for UI development.** It provides pre-built shadcn/ui components, theme support, workspace integration, and Moldable-specific utilities.

## Installation

Apps created with `scaffoldApp` already include `@moldable-ai/ui`. To add manually:

```bash
pnpm add @moldable-ai/ui
```

## Required Setup

Every Moldable app needs this layout structure:

```tsx
// src/app/layout.tsx
import '@moldable-ai/ui/styles'  // Import styles
import { ThemeProvider, WorkspaceProvider } from '@moldable-ai/ui'
import { QueryProvider } from '@/lib/query-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
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

## shadcn/ui Components

All shadcn/ui components are pre-built and exported:

```tsx
import {
  Button,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  Input,
  Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Badge,
  Checkbox,
  Switch,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  ScrollArea,
  Separator,
  Skeleton,
  Spinner,
  // ... and many more
} from '@moldable-ai/ui'
```

### Available Components

| Category | Components |
|----------|------------|
| **Layout** | Card, Separator, ScrollArea, Resizable, AspectRatio |
| **Forms** | Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, Calendar, Form, Field, Label |
| **Buttons** | Button, ButtonGroup, Toggle, ToggleGroup |
| **Feedback** | Alert, Badge, Progress, Skeleton, Spinner, Sonner (toasts) |
| **Overlay** | Dialog, Sheet, Drawer, Popover, HoverCard, Tooltip, AlertDialog, ContextMenu, DropdownMenu |
| **Navigation** | Tabs, Accordion, Breadcrumb, NavigationMenu, Menubar, Pagination, Command, Sidebar |
| **Data** | Table, Chart, Carousel |
| **Other** | Avatar, Kbd, Empty, Collapsible, InputOTP, InputGroup, Item |

### Example Usage

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@moldable-ai/ui'

function MyForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter name..." />
        </div>
        <Button className="w-full">Save</Button>
      </CardContent>
    </Card>
  )
}
```

## Theme Support

### ThemeProvider & useTheme

```tsx
import { useTheme } from '@moldable-ai/ui'

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (actual applied theme)
  
  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  )
}
```

### Semantic Colors (REQUIRED)

**Always use semantic colors**, never raw colors:

```tsx
// ✅ Correct - semantic colors
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />
<div className="bg-card text-card-foreground" />
<span className="text-destructive" />

// ❌ Wrong - raw colors (don't adapt to theme)
<div className="bg-white text-gray-900" />
<div className="bg-zinc-950 text-zinc-100" />
```

### Available Semantic Colors

| Color | Usage |
|-------|-------|
| `background` / `foreground` | Main page background and text |
| `card` / `card-foreground` | Card backgrounds |
| `primary` / `primary-foreground` | Primary actions, links |
| `secondary` / `secondary-foreground` | Secondary buttons |
| `muted` / `muted-foreground` | Subtle backgrounds, helper text |
| `accent` / `accent-foreground` | Highlights, hover states |
| `destructive` / `destructive-foreground` | Delete actions, errors |
| `border` | Borders |
| `input` | Input borders |
| `ring` | Focus rings |

## Workspace Integration

### WorkspaceProvider & useWorkspace

```tsx
import { useWorkspace } from '@moldable-ai/ui'

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()
  
  // Always include workspaceId in query keys
  const { data } = useQuery({
    queryKey: ['items', workspaceId],
    queryFn: () => fetchWithWorkspace('/api/items').then(r => r.json())
  })
}
```

## Moldable Utilities

### Desktop Communication

```tsx
import { sendToMoldable, isInMoldable, downloadFile } from '@moldable-ai/ui'

// Check if running in Moldable
if (isInMoldable()) {
  // Send message to desktop
  sendToMoldable({ type: 'moldable:open-url', url: 'https://...' })
}

// Download files via native save dialog
await downloadFile({
  filename: 'data.csv',
  data: 'name,value\nfoo,1',
  mimeType: 'text/csv'
})
```

### Command Palette Integration

Apps can expose commands to Moldable's command palette:

```tsx
// 1. Create /_moldable/commands API route
// src/app/_moldable/commands/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    commands: [
      {
        id: 'add-item',
        label: 'Add New Item',
        shortcut: 'n',
        icon: 'plus',
        action: { type: 'message', payload: { action: 'add' } }
      },
      {
        id: 'export',
        label: 'Export Data',
        icon: 'download',
        action: { type: 'message', payload: { action: 'export' } }
      }
    ]
  })
}

// 2. Handle commands in your component
import { useMoldableCommands } from '@moldable-ai/ui'

function MyApp() {
  useMoldableCommands({
    'add-item': () => setShowAddForm(true),
    'export': () => handleExport()
  })
}
```

## Widget Layout

For widget views (small app previews on canvas):

```tsx
// src/app/widget/page.tsx
import { WidgetLayout } from '@moldable-ai/ui'

export default function Widget() {
  return (
    <WidgetLayout>
      <div className="p-4">
        {/* Widget content - no scrollbars, fixed height */}
      </div>
    </WidgetLayout>
  )
}
```

## Markdown Rendering

```tsx
import { Markdown } from '@moldable-ai/ui'

function Content({ text }: { text: string }) {
  return <Markdown>{text}</Markdown>
}
```

## Code Blocks

```tsx
import { CodeBlock } from '@moldable-ai/ui'

function Example() {
  return (
    <CodeBlock language="typescript">
      {`const x = 1;`}
    </CodeBlock>
  )
}
```

## Rich Text Editor (@moldable-ai/editor)

For rich text editing with markdown support:

```bash
pnpm add @moldable-ai/editor
```

```tsx
import { MarkdownEditor } from '@moldable-ai/editor'
import '@moldable-ai/editor/styles'

function NotesEditor() {
  const [content, setContent] = useState('')
  
  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      placeholder="Write your notes..."
      autoFocus
      minHeight="200px"
      maxHeight="50vh"
    />
  )
}
```

### MarkdownEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Markdown content |
| `onChange` | `(value: string) => void` | — | Change handler |
| `placeholder` | `string` | `'Write something...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable editing |
| `autoFocus` | `boolean` | `false` | Focus on mount |
| `className` | `string` | — | Container class |
| `contentClassName` | `string` | — | Editor content class |
| `minHeight` | `string` | `'150px'` | Minimum height |
| `maxHeight` | `string` | `'50vh'` | Maximum height |
| `hideMarkdownHint` | `boolean` | `false` | Hide "Markdown supported" hint |

### Editor Features

- **Markdown shortcuts**: `# `, `## `, `- `, `1. `, `> `, `` ``` ``, `**bold**`, `*italic*`
- **Floating toolbar**: Select text to format
- **Checklists**: `- [ ]` for todo items
- **Links**: Auto-detect URLs, click to open
- **Code blocks**: Syntax highlighting
- **Keyboard shortcuts**: Undo/redo, indent/outdent

### Advanced: Headless Editor

For server-side markdown conversion:

```tsx
import { createMoldableHeadlessEditor, $convertToMarkdownString } from '@moldable-ai/editor'

const editor = createMoldableHeadlessEditor()
// Use for programmatic markdown operations
```

## Icons

Use Lucide icons (included with shadcn):

```tsx
import { Plus, Settings, Trash2, Check, X, Loader2 } from 'lucide-react'

<Button>
  <Plus className="size-4 mr-2" />
  Add Item
</Button>

<Button disabled>
  <Loader2 className="size-4 mr-2 animate-spin" />
  Loading...
</Button>
```

## CSS Classes

### Utility: cn()

Merge class names conditionally:

```tsx
import { cn } from '@moldable-ai/ui'

<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'large' && 'text-lg'
)} />
```

### Common Patterns

```tsx
// Centered content
<div className="flex items-center justify-center min-h-screen">

// Card with hover
<Card className="hover:border-primary transition-colors cursor-pointer">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Truncated text
<p className="truncate">Long text that might overflow...</p>

// Loading state
<Skeleton className="h-4 w-[200px]" />
```

## Best Practices

1. **Always import from `@moldable-ai/ui`** — not from individual shadcn files
2. **Use semantic colors** — never raw Tailwind colors like `bg-gray-100`
3. **Wrap with providers** — ThemeProvider and WorkspaceProvider are required
4. **Use Tailwind's `size-`** — for equal width/height (`size-4` instead of `w-4 h-4`)
5. **Add `cursor-pointer`** — to all clickable buttons (shadcn doesn't include it)
6. **Import styles** — `@moldable-ai/ui/styles` in your root layout
