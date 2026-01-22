# Moldable App Scaffold Requirements

When creating or modifying Moldable apps, follow these requirements to pass `lint-moldable-app.js` validation.

## Required Files

Every Moldable app MUST have these files:

```
~/.moldable/shared/apps/{app-id}/
├── moldable.json                    # App manifest
├── package.json                     # Dependencies + scripts
├── next.config.ts                   # Next.js config
├── .gitignore                       # Git ignore patterns
├── .eslintrc.json                   # ESLint config
├── scripts/
│   └── moldable-dev.mjs             # Dev startup script
└── src/
    └── app/
        ├── layout.tsx               # Root layout with providers
        ├── page.tsx                 # Main app page
        ├── globals.css              # Global styles
        ├── widget/
        │   ├── layout.tsx           # Widget layout with WidgetLayout
        │   └── page.tsx             # Widget view with GHOST_EXAMPLES
        └── api/
            └── moldable/
                └── health/
                    └── route.ts     # Health check endpoint
```

## Lint Rules Summary

| Rule | Severity | Requirement |
|------|----------|-------------|
| `moldable-json-exists` | Error | moldable.json must exist |
| `moldable-json-valid` | Error | Must be valid JSON |
| `moldable-json-fields` | Error | Must have: name, icon, description, widgetSize |
| `next-config-exists` | Error | next.config.ts must exist |
| `next-config-dev-indicators` | Error | Must have `devIndicators: false` |
| `moldable-dev-script` | Error | scripts/moldable-dev.mjs must exist |
| `moldable-dev-syntax` | Error | Must use standard template format |
| `package-json-dev-script` | Error | dev script must use moldable-dev.mjs |
| `widget-dir` | Error | src/app/widget/ must exist |
| `widget-layout` | Error | widget/layout.tsx must exist |
| `widget-layout-wrapper` | Error | Must use `<WidgetLayout>` from @moldable-ai/ui |
| `widget-page` | Error | widget/page.tsx must exist |
| `widget-ghost-state` | Warning | Should include GHOST_EXAMPLES |
| `health-route` | Error | api/moldable/health/route.ts must exist |
| `gitignore-valid` | Error | Must ignore .next and node_modules |
| `eslint-config-exists` | Error | .eslintrc.json must exist |
| `no-localstorage` | Warning | Don't use localStorage, use @moldable-ai/storage |
| `workspace-provider` | Error | Must use WorkspaceProvider |
| `app-registered` | Error | Must be in workspace config.json |

## File Templates

### moldable.json

```json
{
  "name": "My App",
  "version": "0.1.0",
  "visibility": "private",
  "description": "Brief description of what this app does",
  "author": "",
  "license": "MIT",
  "icon": "🚀",
  "widgetSize": "medium",
  "category": "custom",
  "tags": [],
  "moldableDependencies": {
    "@moldable-ai/ui": "^0.1.0"
  },
  "env": []
}
```

**Required fields**: `name`, `icon`, `description`, `widgetSize`

**widgetSize options**: `"small"`, `"medium"`, `"large"`

### package.json

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "node ./scripts/moldable-dev.mjs",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@moldable-ai/storage": "^0.1.1",
    "@moldable-ai/ui": "^0.2.2",
    "@tanstack/react-query": "^5.62.8",
    "lucide-react": "^0.468.0",
    "next": "16.1.1",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@moldable-ai/typescript-config": "0.1.0",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Critical**: dev script MUST be `"node ./scripts/moldable-dev.mjs"` (NOT `"next dev"`)

### next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,  // REQUIRED: Hide dev UI in Moldable
}

export default nextConfig
```

### src/app/layout.tsx

```tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider, WorkspaceProvider, themeScript } from '@moldable-ai/ui'
import { QueryProvider } from '@/lib/query-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'My App',
  description: 'App description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
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

**Required providers** (in order):
1. `ThemeProvider` — Theme support
2. `WorkspaceProvider` — Workspace-aware data
3. `QueryProvider` — TanStack Query

### src/app/widget/layout.tsx

```tsx
import { WidgetLayout } from '@moldable-ai/ui'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WidgetLayout>{children}</WidgetLayout>
}
```

**Required**: Must import and use `<WidgetLayout>` from `@moldable-ai/ui`

### src/app/widget/page.tsx

```tsx
'use client'

import { useWorkspace } from '@moldable-ai/ui'

/**
 * Ghost examples showing what items will look like.
 * Update these to match your app's data structure.
 */
const GHOST_EXAMPLES = [
  { text: 'First example item', icon: '📝' },
  { text: 'Second example item', icon: '✨' },
  { text: 'Third example item', icon: '🎯' },
]

export default function WidgetPage() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace()

  // Replace with actual data fetching
  const items: typeof GHOST_EXAMPLES = []
  const isLoading = false

  const showGhost = !isLoading && items.length === 0

  return (
    <div className="flex h-full flex-col p-2">
      {/* Compact Header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-base">🚀</span>
        <h2 className="text-foreground text-sm font-semibold">My App</h2>
      </div>

      {/* Content */}
      <div className="space-y-1">
        {showGhost ? (
          // Ghost empty state - shows preview of what data looks like
          GHOST_EXAMPLES.map((row, idx) => (
            <div
              key={idx}
              className="border-border/30 bg-muted/20 flex items-center gap-2 rounded-md border px-2 py-1.5 opacity-60"
            >
              <span className="text-[11px]">{row.icon}</span>
              <span className="text-foreground/80 text-[11px]">{row.text}</span>
            </div>
          ))
        ) : isLoading ? (
          <div className="text-muted-foreground py-4 text-center text-xs">
            Loading...
          </div>
        ) : (
          // Actual items
          items.map((item, idx) => (
            <div
              key={idx}
              className="border-border/50 hover:bg-muted/50 flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors"
            >
              <span className="text-[11px]">{item.icon}</span>
              <span className="text-foreground text-[11px]">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

**Required**: Include `GHOST_EXAMPLES` for consistent empty state appearance

### src/app/api/moldable/health/route.ts

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
```

**Required**: Moldable uses this endpoint to check if the app is running

### .gitignore

```gitignore
# Dependencies
node_modules/

# Next.js
.next/
out/

# Build
dist/

# Debug
npm-debug.log*

# Local env files
.env*.local

# Turbo
.turbo/

# Moldable
.moldable.instances.json
```

**Required**: Must ignore `.next` and `node_modules`

### .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

### src/lib/query-provider.tsx

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

### src/app/globals.css

```css
@import 'tailwindcss';
@import '@moldable-ai/ui/styles';
```

## Common Validation Failures

### "dev script must use moldable-dev.mjs"

```json
// ❌ Wrong
"dev": "next dev"

// ✅ Correct
"dev": "node ./scripts/moldable-dev.mjs"
```

### "next.config.ts must have devIndicators: false"

```typescript
// ❌ Wrong
const nextConfig: NextConfig = {}

// ✅ Correct
const nextConfig: NextConfig = {
  devIndicators: false,
}
```

### "Widget layout must use WidgetLayout"

```tsx
// ❌ Wrong
export default function Layout({ children }) {
  return <div>{children}</div>
}

// ✅ Correct
import { WidgetLayout } from '@moldable-ai/ui'

export default function Layout({ children }) {
  return <WidgetLayout>{children}</WidgetLayout>
}
```

### "Must use WorkspaceProvider"

```tsx
// ❌ Wrong - missing WorkspaceProvider
<ThemeProvider>
  <QueryProvider>{children}</QueryProvider>
</ThemeProvider>

// ✅ Correct
<ThemeProvider>
  <WorkspaceProvider>
    <QueryProvider>{children}</QueryProvider>
  </WorkspaceProvider>
</ThemeProvider>
```

### "Found localStorage usage"

```typescript
// ❌ Wrong - localStorage doesn't persist in webviews
localStorage.setItem('key', value)

// ✅ Correct - use filesystem storage
import { writeJson, readJson, getAppDataDir, safePath } from '@moldable-ai/storage'

const dataDir = getAppDataDir(workspaceId)
await writeJson(safePath(dataDir, 'data.json'), value)
```

## Running the Linter

```bash
# Lint a single app
node ~/.moldable/shared/scripts/lint-moldable-app.js ~/.moldable/shared/apps/my-app

# From workspace root (if configured)
pnpm lint:app apps/my-app
```

## Best Practices

1. **Always use `scaffoldApp`** — It creates all required files correctly
2. **Don't modify scripts/moldable-dev.mjs** — Use the standard template
3. **Keep widget compact** — It's a small preview, not the full app
4. **Update GHOST_EXAMPLES** — Match your app's data structure
5. **Test with linter** — Run lint-moldable-app.js before finalizing
