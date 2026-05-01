# Moldable App Design

Use this reference before building or changing visible Moldable app UI. It is intentionally prescriptive so agents with weaker design instincts can still produce apps that feel native to Moldable.

Do not exclusively depend on example apps being installed. This file embeds the patterns to copy, but when Mail, Meetings, or DB Browser are present in `~/.moldable/shared/apps/` or `~/moldable-apps/`, inspect their widget and main app UI before making comparable design changes.

## Product Feel

Moldable apps should feel like local, personal instruments: fast, quiet, specific, dense enough for repeated use, and shaped around the user's actual data. They are not websites, landing pages, demos, or SaaS dashboards.

The best Moldable app usually has:

- a widget that answers one glanceable question
- a full view organized around one primary workflow
- compact chrome that stays close to the object being manipulated
- real loading, empty, error, auth, permission, and background-activity states
- clear AI context for the desktop chat when the app has useful state
- enough structure to be predictable, but not so much decoration that the app feels generated

## Required Design Pass

Before editing UI files, write these answers in your working notes:

1. **Primary job:** What does this app help the user do in one sentence?
2. **Primary object:** What is the app's core object: message, meeting, row, file, note, task, event, recipe, clip, connection?
3. **Widget promise:** What can the widget truthfully show in 1-2 seconds?
4. **Full-view shape:** Choose one layout archetype from this file.
5. **State inventory:** Name the empty, loading, error, auth, permission, and busy states.
6. **Chat clearance:** Which scroll areas and fixed controls must respect `--chat-safe-padding`?
7. **Commands:** Which actions should be available through app commands or Cmd+K?

If an answer is vague, simplify the app before designing. "Manage items" is too vague. "Review today's unread customer emails" is usable.

## Non-Negotiables

- Use `@moldable-ai/ui` components and semantic colors.
- Use Lucide icons for icon buttons.
- All clickable `<button>` elements include `cursor-pointer` unless disabled.
- Do not use raw Tailwind color families like `bg-gray-100`, `text-zinc-900`, `bg-blue-500`.
- Do not create a marketing landing page as the first screen.
- Do not use visible instructional copy to explain obvious UI features.
- Do not put the app name in the widget body or main app content. Moldable already shows the active app name in desktop chrome and the widget frame.
- Do not add a separate chat input, chat panel, prompt box, or assistant conversation inside an app. Moldable already has desktop chat.
- Do not wrap the whole app in cards. Use full-height surfaces, panes, lists, editors, and toolbars.
- Do not nest cards.
- Do not use decorative gradients, gradient text, glass cards, bokeh/orb backgrounds, oversized hero type, or repeated icon-card grids.
- Keep text within its container at all sizes. Use `min-w-0`, `truncate`, `line-clamp-*`, flexible grids, and stable dimensions.
- Respect `--chat-safe-padding` anywhere content or controls can be hidden by the desktop chat.
- App shells must be full height. Put scrolling on intentional inner regions, not on `body` or an accidental page wrapper.
- Dialogs and popovers with substantial content must avoid the chat area; constrain their height with `--chat-safe-padding` and scroll their body content internally.

## Widget View

The widget is a live instrument, not a teaser. It should show real app state and remain useful at small sizes.

### Widget Responsibilities

Every widget must handle:

- loading
- empty data
- error with retry when retry is possible
- disconnected/auth-required state when relevant
- real data preview when data exists

The widget should usually include one compact status/scope row plus a preview body. If the widget is extremely small, omit the header and let the rows carry the meaning. Do not title the widget with the app name; the Moldable widget frame already shows it.

### Widget Density

Use these defaults:

- outer padding: `p-2` or `p-3`
- row padding: `px-2.5 py-1.5`
- row radius: `rounded-md`
- title text: `text-[12px]` or `text-sm`
- meta text: `text-[10px]` or `text-[11px]`
- row gap: `space-y-1`
- preview count: 3-6 rows depending on row height
- icons/dots: `size-2` to `size-3.5`

Widgets should feel compact enough that four messages, five meetings, or six database connections can fit without looking cramped.

### Widget Identity

The Moldable widget frame already shows the app icon and app name. Inside the widget, use labels for the current data scope or state, not the app identity.

Good widget labels:

- "Inbox"
- "3 unread"
- "Recent"
- "Recording"
- "Connected"
- "No rows"
- "Today"

Bad widget labels:

- repeating the app name, such as "Images" inside the Images widget
- repeating the app icon next to the app name
- a large branded header that consumes preview space
- "Welcome to [App Name]"

### Widget Recipes

**Recent object list**

Use for mail, meetings, notes, tasks, files, records.

Structure:

- optional status/scope row with icon, scope label, and small count/status
- `min-h-0 flex-1 overflow-hidden`
- `ul` or stacked rows
- each row has a primary label, one metadata line, and optional status dot/icon
- rows are not full buttons unless clicking specific rows is supported by the host; otherwise the widget itself opens the app

Visual pattern:

```tsx
<div className="bg-background flex h-full flex-col overflow-hidden p-2">
  <div className="mb-2 flex shrink-0 items-center justify-between px-1">
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="text-muted-foreground size-3.5 shrink-0" />
      <h2 className="truncate text-sm font-semibold">Inbox</h2>
    </div>
    <span className="text-muted-foreground shrink-0 text-[11px] font-medium">
      3 unread
    </span>
  </div>
  <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
    {items.slice(0, 4).map((item) => (
      <div className="bg-muted/45 flex min-w-0 items-start gap-2 rounded-md px-2.5 py-1.5">
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="truncate text-[12px] font-semibold leading-4">{item.title}</p>
            <span className="text-muted-foreground shrink-0 text-[10px] leading-4">{item.time}</span>
          </div>
          <p className="text-muted-foreground truncate text-[10px] leading-4">{item.meta}</p>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Live status widget**

Use for recording, syncing, importing, running jobs, timers, playback.

Structure:

- one primary status row
- one large but not oversized status/control cluster
- small meter/timer/progress element
- one clear primary action

Avoid a giant empty center with one button. Show state, duration, last item, or next action.

**Empty widget with ghost examples**

Use ghost rows to teach shape without long copy. Ghost examples should look like disabled future data: low opacity, grayscale, semantic borders, no bright colors.

```tsx
<div className="bg-background flex h-full flex-col overflow-hidden p-2">
  <div className="min-h-0 flex-1 space-y-1 overflow-hidden">
    {GHOST_EXAMPLES.map((item) => (
      <div className="border-border/40 bg-muted/20 rounded-md border px-2.5 py-1.5 opacity-45 grayscale">
        <div className="truncate text-[12px] font-semibold leading-4">{item.title}</div>
        <div className="text-muted-foreground truncate text-[10px] leading-4">{item.meta}</div>
      </div>
    ))}
  </div>
  <div className="border-border/50 bg-muted/20 mt-2 flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2">
    <span className="bg-background text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
      <Icon className="size-3.5" />
    </span>
    <div className="min-w-0">
      <div className="truncate text-[12px] font-semibold">Add the first item</div>
      <div className="text-muted-foreground truncate text-[10px]">It will appear here.</div>
    </div>
  </div>
</div>
```

### Widget Anti-Patterns

Do not build widgets with:

- app name repeated inside the widget content
- duplicate app icon plus app name headers
- big centered emoji plus paragraph copy
- marketing headlines
- feature lists
- more than one primary action
- charts too small to read
- controls that require precision below 44px when they are the main action
- scrollbars unless the widget is intentionally a compact list and the overflow is still readable

## Full View Layout Archetypes

Choose one archetype. Do not invent a generic dashboard unless the app genuinely needs multiple unrelated surfaces.

### Full-Height Shell

Every full app view should fill the webview. The root route/component should establish a full-height flex or grid shell, then make only the intended panes scroll.

Use this shape unless the app has a strong reason not to:

```tsx
export function App() {
  return (
    <main className="bg-background text-foreground flex h-full min-h-0 overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-border/70 flex h-9 shrink-0 items-center border-b px-3">
          {/* compact app chrome */}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--chat-safe-padding,0px)+1rem)]">
          {/* scrollable content */}
        </div>
      </section>
    </main>
  )
}
```

CSS setup should keep the root full height:

```css
html,
body,
#root {
  height: 100%;
}

body {
  overflow: hidden;
}
```

Rules:

- use `h-full min-h-0 overflow-hidden` on shell and pane containers
- do not render a large app-name header just to identify the app; Moldable desktop chrome already identifies the active app
- top bars should name the current scope, selected object, mode, or action, not restate the app name
- use `min-h-0 flex-1 overflow-y-auto` or `overflow-auto` only on scroll regions
- add chat safe padding to each scroll region that reaches the bottom
- add extra safe padding when a fixed dock is present
- do not rely on the document/body scroll for the main app
- empty states inside a scrollable or full-height pane still need bottom chat padding if they can be covered
- tables, object browsers, inspectors, and result panes need their own safe bottom padding because they often scroll independently

### 1. List To Detail

Use for messages, notes, tasks, meetings, records, files.

Best when the user scans many objects and opens one.

Structure:

- scrollable list grouped by meaningful time/status labels
- selected item state
- detail view or overlay reader
- row actions appear on hover/focus and in Cmd+K
- bottom action dock when detail actions are central

List rows:

- fixed vertical rhythm
- avatar/icon/status dot on the left
- primary label and secondary text in a `min-w-0` middle column
- time/status on the right
- hover actions overlay from the right with a subtle background fade

Empty state:

- centered, small, and calm
- title in 1-4 words
- one sentence max
- primary setup action only if needed

### 2. Document Or Editor

Use for meeting notes, journals, drafts, recipes, long-form content, prompts.

Best when the object is mostly text and the user needs focus.

Structure:

- max content width around `44rem` to `52rem`
- title/date/meta chrome above editor
- editor body is the main surface, not a card
- save status is quiet and local
- mode tabs are compact when multiple document views exist
- generated/enhanced content is editable and never feels like a separate export artifact

Typography:

- body text can be larger than chrome: `text-[1.0625rem]` to `text-[1.375rem]`
- line height around `1.65` to `1.75`
- serif can be used for titles or reading surfaces
- never use hero-scale type inside operational controls

Use the editor packages described in **Editor Components** below. Do not build markdown editors from `contenteditable` or plain textareas when `@moldable-ai/editor` fits the job.

### 3. Paneled Workspace

Use for databases, code, files, debugging, analytics, multi-object tools.

Best when the user needs persistent navigation, an editor/surface, and inspector details.

Structure:

- full-height `ResizablePanelGroup` or stable flex panes
- left pane for navigation or object browser
- center pane for editor/table/workspace
- optional right pane for details/inspector
- thin top bars, usually `h-8` or `h-9`
- icon buttons with tooltips
- resizable splitters with clear hover affordance

Density:

- toolbar text: `text-xs`
- table text: `text-[11px]` or `text-[12px]`
- toolbar height: `h-8` or `h-9`
- table rows: `h-7` to `h-8`
- object browser rows: `py-2` to `py-2.5`

Use mono type for database columns, SQL, paths, code, IDs, and raw values. Use sans type for labels and commands.

### 4. Focused Control Dock

Use for recording, playback, active jobs, bulk actions, message actions.

Best when there is one active process or selected object and actions need to stay reachable.

Structure:

- fixed bottom centered dock
- `bottom: calc(var(--chat-safe-padding, 0px) + 1.5rem)`
- `pointer-events-none` wrapper and `pointer-events-auto` dock
- rounded full dock with semantic border/background
- primary action is visually strongest
- destructive action appears only when relevant
- status chip can float just above the dock

Pattern:

```tsx
<div
  className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
  style={{ bottom: 'calc(var(--chat-safe-padding, 0px) + 1.5rem)' }}
>
  <div className="bg-background/95 shadow-foreground/10 pointer-events-auto flex h-14 max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border px-2 shadow-xl backdrop-blur-xl">
    <Button type="button" variant="ghost" size="icon" className="size-10 cursor-pointer rounded-full" aria-label="Archive">
      <Archive className="size-4" />
    </Button>
    <div className="bg-border mx-1 h-7 w-px" />
    <Button type="button" size="sm" className="h-10 cursor-pointer gap-2 rounded-full px-5">
      <Reply className="size-4" />
      Reply
    </Button>
  </div>
</div>
```

### 5. Timeline Or Schedule

Use for calendars, upcoming events, recordings, time tracking.

Structure:

- grouped by day/status
- date cell or timeline rail on the left
- actionable object rows on the right
- current day or current active item gets a small semantic marker
- no oversized calendar grid unless month-scale browsing is the core job

## Surface Patterns

### Grouped Lists

Good grouped lists use:

- `ScrollArea className="h-full px-5 pt-3"`
- inner `mx-auto w-full max-w-[44rem] space-y-8`
- bottom padding `pb-[calc(var(--chat-safe-padding,0px)+6rem)]` or more if a dock exists
- section labels in muted small type
- a single rounded group container with internal separators

Avoid separate floating cards for every row unless each row is a complex object that benefits from independent framing.

### Rows

Rows should be horizontally scannable:

- left: status/avatar/icon, fixed size
- middle: text stack, `min-w-0`
- right: time/count/status, shrink-0
- hover/focus actions: icon-only with tooltips
- selected state: subtle background or inset accent, not a thick colored stripe

Use `showSeparator` and pseudo-element dashed separators when lists need light rhythm without heavy borders.

### Toolbars

Toolbars should be quiet:

- height: `h-8`, `h-9`, or `h-10`
- use icon buttons when the icon is familiar
- always include `aria-label` and tooltip for icon-only buttons
- keep destructive actions in menus or separated groups unless they are the primary current action
- avoid text buttons for common icon actions like refresh, settings, search, add, delete, save, run

### Tables And Data Grids

For data-heavy apps:

- use sticky headers
- use mono text for cells and columns
- support horizontal overflow
- include row numbers when inspecting data
- include selected row state
- provide a row details pane for long values or JSON
- allow column widths to adapt to content or be resized if table browsing is core
- show empty query/table results as a quiet in-grid state

Default grid values:

- row number column: about `44px`
- minimum column width: about `72px`
- default column width: max of label width plus padding, capped around `360px`
- row height: `h-7`
- cell text: `font-mono text-[11px] leading-5`

### Forms

Forms should be compact and direct:

- group related fields with small labels
- use dialogs only for bounded setup/edit workflows
- show validation near the field
- show async test/save state on the button
- keep advanced settings collapsed or secondary
- never ask for secrets in plain app storage if they belong in aivault

## Editor Components

Do not hand-roll editors when Moldable already has a good package or proven pattern. Choose the editor by content type.

### Markdown And Rich Text: `@moldable-ai/editor`

Use `MarkdownEditor` from `@moldable-ai/editor` for markdown notes, meeting notes, journal entries, long-form drafts, generated summaries, editable AI output, and any rich text surface where users expect headings, lists, links, and readable prose.

Required setup:

```css
@import '@moldable-ai/editor/styles';

@source '../../node_modules/@moldable-ai/editor/dist/**/*.{js,jsx,ts,tsx}';
```

Basic pattern:

```tsx
import { MarkdownEditor } from '@moldable-ai/editor'

<MarkdownEditor
  value={notes}
  onChange={setNotes}
  placeholder="Write your notes here..."
  minHeight="100%"
  maxHeight="none"
  className="app-document-editor"
  contentClassName="app-document-content"
  hideMarkdownHint
/>
```

Document styling pattern:

```css
.app-document-editor {
  @apply text-muted-foreground;
  caret-color: var(--primary);
}

.app-document-content {
  @apply text-muted-foreground pb-20 pt-2 text-[1.25rem] leading-[1.7];
}

.app-document-content h1,
.app-document-content h2,
.app-document-content h3 {
  @apply text-foreground mb-2 mt-8 font-semibold leading-snug;
}

.app-document-content p {
  @apply my-1;
}

.app-document-content ul,
.app-document-content ol {
  @apply my-2 pl-7;
}

.app-document-content [data-lexical-text='true'] {
  letter-spacing: 0;
}

.app-document-editor [data-lexical-editor='true'] + div {
  @apply text-muted-foreground/55 pointer-events-none absolute inset-0 flex items-start px-0 py-3 text-[1.25rem] leading-[1.7];
}
```

Rules:

- use `MarkdownEditor` for editable markdown and prose
- use `Markdown` from `@moldable-ai/ui` for read-only rendered markdown
- use `CodeBlock` from `@moldable-ai/ui` for read-only code snippets
- keep markdown editor scrolling controlled by its parent pane when building full-document views
- use `minHeight="100%"` and `maxHeight="none"` for document-style editors
- use `disabled` for read-only overlay/comparison states instead of creating a separate fake editor
- style Lexical internals only through stable wrapper classes such as `[data-lexical-text='true']` and `[data-lexical-editor='true']`
- do not implement a markdown parser, toolbar, selection model, or `contenteditable` editor yourself

### Code And Query Editing: Monaco

Use Monaco through `@monaco-editor/react` for code, SQL, JSON, config files, scripts, templates, and any editor where users expect syntax highlighting, line numbers, command shortcuts, selection behavior, and large-text performance.

Install when needed:

```bash
pnpm add @monaco-editor/react monaco-editor
```

Use Monaco inside a full-height pane:

```tsx
import Editor, { type Monaco } from '@monaco-editor/react'
import { useCallback, useMemo } from 'react'
import { Spinner, useTheme } from '@moldable-ai/ui'
import type { editor } from 'monaco-editor'

export function CodeEditor({
  value,
  language,
  onChange,
}: {
  value: string
  language: string
  onChange: (value: string) => void
}) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'moldable-code-dark' : 'moldable-code-light'

  const beforeMount = useCallback((monaco: Monaco) => {
    monaco.editor.defineTheme('moldable-code-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#181818',
        'editor.foreground': '#f4f4f5',
        'editorLineNumber.foreground': '#71717a',
        'editorCursor.foreground': '#f97316',
        'editor.lineHighlightBackground': '#27272a66',
        'editor.selectionBackground': '#f973163d',
        'editor.inactiveSelectionBackground': '#71717a33',
      },
    })
    monaco.editor.defineTheme('moldable-code-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#fafafa',
        'editor.foreground': '#18181b',
        'editorLineNumber.foreground': '#a1a1aa',
        'editorCursor.foreground': '#f97316',
        'editor.lineHighlightBackground': '#e4e4e766',
        'editor.selectionBackground': '#f9731633',
        'editor.inactiveSelectionBackground': '#a1a1aa33',
      },
    })
  }, [])

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      automaticLayout: true,
      bracketPairColorization: { enabled: true },
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      glyphMargin: false,
      lineDecorationsWidth: 22,
      lineNumbers: 'on',
      lineNumbersMinChars: 4,
      minimap: { enabled: false },
      overviewRulerBorder: false,
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: 'line',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: 2,
      wordWrap: 'on',
    }),
    [],
  )

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme}
      value={value}
      beforeMount={beforeMount}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      loading={
        <div className="bg-background flex h-full items-center justify-center">
          <Spinner className="text-muted-foreground size-5" />
        </div>
      }
      options={options}
    />
  )
}
```

Rules:

- use Monaco for code-like editing instead of `textarea`
- wrap Monaco in a parent with a stable height, usually `h-full min-h-0`
- set `height="100%"` and `automaticLayout: true`
- keep minimap off by default in Moldable panes
- use line numbers for SQL/code, but hide folding/glyph chrome unless needed
- wire command shortcuts through Monaco commands when they are editor-local, such as run current SQL or create new editor tab
- use `useTheme().resolvedTheme` to choose a light/dark Monaco theme
- use semantic Moldable UI around Monaco for toolbars, tabs, status rows, and result panes

### Plain Inputs And Textareas

Use plain `Input` or `textarea` only for small fields:

- names, titles, search, URLs, one-line commands
- compact prompts or comments under roughly 5 lines
- plain text values where markdown/code semantics do not apply

If users will write structured prose, use `MarkdownEditor`. If users will write code, SQL, JSON, or config, use Monaco.

### Empty And Error States

Empty states should not over-explain.

Good:

- "Inbox clear"
- "No rows returned."
- "Choose a connection"
- "Grant calendar access to show upcoming events."

Weak:

- "Welcome to your productivity dashboard"
- "Get started by exploring all the amazing features"
- "No data yet! Create your first item to unlock the power of..."

Recoverable errors should include:

- concise title
- specific message if available
- retry action if retry is possible
- no stack traces in the UI

## Chat And Desktop Integration

Moldable's chat can overlay the app. Design for it.

Do not build a second chat experience inside an app. No bottom prompt container, assistant conversation panel, "Ask AI" chat box, or app-local message thread. Moldable already provides desktop chat that can see app context, invoke app APIs, and interact with apps through commands and RPC. An in-app chat duplicates the host UI, wastes vertical space, and often collides with `--chat-safe-padding`.

Use these alternatives instead:

- expose app actions through `GET /api/moldable/commands` and handle them with `useMoldableCommands`
- post useful state with `moldable:set-chat-instructions`
- prefill the desktop chat only for explicit "ask Moldable about this" affordances via `moldable:set-chat-input`
- expose structured app-to-app APIs through `/api/moldable/rpc` and `moldable.json` `appApi.capabilities`
- use normal app controls for direct actions: buttons, menus, docks, editors, inspectors, and forms

Read [app-to-app-communication.md](app-to-app-communication.md) for app RPC and capability manifests, and [desktop-apis.md](desktop-apis.md) for desktop chat APIs.

Use safe padding:

- scrollable full-view content: `pb-[calc(var(--chat-safe-padding,0px)+6rem)]`
- long document/editor content: `pb-[calc(var(--chat-safe-padding,0px)+8rem)]`
- bottom docks: `bottom: calc(var(--chat-safe-padding, 0px) + 1.5rem)`
- tables or inspectors: `pb-[var(--chat-safe-padding,0px)]`
- object browsers and side panes: `pb-[calc(var(--chat-safe-padding,0px)+1rem)]`

Dialogs must also avoid the chat area. Do not let a centered dialog extend behind the chat overlay. For dialogs with forms, lists, or SQL/history content, make the dialog a constrained flex column and put scrolling inside the body:

```tsx
<DialogContent className="top-[calc((100dvh-var(--chat-safe-padding,0px))/2)] flex max-h-[calc(100dvh-var(--chat-safe-padding,0px)-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
  <DialogHeader className="px-6 pb-4 pt-6 pr-12">
    <DialogTitle>New connection</DialogTitle>
  </DialogHeader>
  <form className="flex min-h-0 flex-col">
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
      {/* fields */}
    </div>
    <DialogFooter className="border-border/70 shrink-0 border-t px-6 py-4">
      {/* actions */}
    </DialogFooter>
  </form>
</DialogContent>
```

Dialog rules:

- use the safe `top` and `max-h` calculation for any dialog that may be taller than a small confirmation
- use `flex max-h-* overflow-hidden p-0` on `DialogContent`
- keep header and footer `shrink-0`
- put `overflow-y-auto` on the dialog body, not the whole page
- keep destructive confirmations compact, but still verify they do not sit under the chat overlay
- large command/history/import/export dialogs should use `w-[min(...)] max-w-none` plus the same safe max height pattern

Set chat instructions when app state helps the agent:

```ts
window.parent.postMessage(
  {
    type: 'moldable:set-chat-instructions',
    text: `User is viewing ${objectName}. Current selection: ${selectionSummary}. Prefer app APIs for changes.`,
  },
  '*',
)
```

Good chat context is specific and action-oriented:

- active connection, selected table, SQL tab
- selected meeting, active transcript state, selected template
- selected email/thread, current folder, draft state
- selected file, active path, dirty state

Avoid generic context like "This is the notes app."

## Commands

Any app with more than a few actions should expose app commands.

Add commands for:

- primary create action
- search/focus action
- refresh/sync action
- open important sections
- object switching for recent or active objects
- selected-object actions such as archive, reply, delete, run, export

Keep command labels verb-first and searchable:

- "Compose email"
- "Search mail"
- "Open SQL query"
- "Switch connection"
- "Start meeting"
- "Refresh objects"

## Motion

Use motion to show state changes, not to decorate.

Allowed:

- dock entrance: 180-420ms, translateY plus opacity
- detail view entrance: 120-220ms, small translateY or scale
- status pulse for active recording/sync
- fade in generated/enhanced content
- spinner only for indeterminate async work

Rules:

- animate `opacity` and `transform`
- avoid animating layout properties
- use ease-out curves like `cubic-bezier(0.16, 1, 0.3, 1)`
- no bounce, elastic, confetti, or looping decorative motion
- respect disabled/loading states so buttons do not double-submit

## Color And Theme

Moldable app color should be restrained. Semantic theme variables do most of the work.

Use accent color for:

- selected state
- unread/current/active marker
- primary action
- progress/status
- small connection/project color dots

Do not recolor the entire app by category. Database apps do not need to be dark blue. Mail apps do not need Gmail colors. Meeting apps do not need purple gradients.

Use OKLCH only when custom color is needed, for example deterministic avatars or connection colors:

```ts
const palette = [
  'oklch(0.7 0.12 30)',
  'oklch(0.72 0.12 85)',
  'oklch(0.68 0.11 150)',
  'oklch(0.68 0.1 200)',
]
```

## Typography

Default:

- Inter or system sans for app chrome
- mono for data/code/IDs
- serif only for reading/document moments where it improves focus

Scale:

- widget meta: `text-[10px]` to `text-[11px]`
- widget primary: `text-[12px]` to `text-sm`
- app chrome: `text-xs` to `text-sm`
- row primary: `text-[13px]` to `text-sm`
- document body: `text-[1.0625rem]` to `text-[1.375rem]`
- document title: `text-3xl` or smaller unless it is the true reading surface

Never use viewport-width font sizing. Keep `letter-spacing: 0` except small uppercase section labels, where `tracking-wider` is acceptable.

## Copy

Moldable copy is calm, short, and literal.

Rules:

- one idea per sentence
- no marketing adjectives
- no "powerful", "seamless", "beautiful", "unlock", "supercharge"
- no exclamation points unless user content includes them
- no em dashes
- button labels are verbs or verb phrases
- error titles say what failed
- empty states say what is true and what happens next

Good:

- "No drafts"
- "Loading labels"
- "Move to trash"
- "Store credentials in aivault."
- "Select a result row to inspect its fields."

## First-Run And Setup

First-run screens should be useful, not celebratory.

If setup is required:

- explain the blocked state in one short paragraph
- show exactly one primary setup action
- show secondary details only if needed for trust
- keep the app shell visible when possible, with empty/ghost content behind or around setup

Examples:

- mail: connect account, then show recent inbox
- database: add connection, credentials stored in aivault
- calendar-backed app: grant calendar access or install/authorize Calendar app
- recorder: choose microphone/system audio settings only when needed

## AI Features

AI features should feel like local assistance inside the workflow.

AI features do not require an in-app chat container. Moldable's desktop chat is the conversational surface. Inside the app, expose AI as direct workflow controls and stateful results.

Good patterns:

- "Enhance notes" creates editable content in the same editor
- streaming output appears where final content will live
- generation progress has a small status bar or inline affordance
- generated content can be revised, saved, copied, or discarded
- AI actions are available through commands when useful

Avoid:

- separate "AI magic" pages
- in-app assistant/chat panels or prompt bars
- giant sparkle buttons
- non-editable generated reports
- unexplained background changes
- replacing user content without preserving control

## Accessibility And Interaction

Required:

- icon-only buttons have `aria-label` and tooltip
- controls reachable by keyboard
- hover-only actions also appear on focus or via command/menu
- selected states are visible without relying on color alone when practical
- inputs have labels or accessible names
- disabled states are real `disabled`, not only visual
- destructive actions use confirmation when data loss is significant

Keyboard shortcuts are good for power tools, but do not render long shortcut instructions in the main UI. Put actions in Cmd+K and menus.

## Mobile And Narrow Views

Moldable mostly runs desktop webviews, but narrow panes still happen.

Design rules:

- use `min-w-0` aggressively
- hide secondary labels before hiding primary actions
- convert side panes to toggled panels when needed
- keep bottom docks within `max-w-[calc(100vw-2rem)]`
- use responsive text only through breakpoints like `hidden sm:inline`, not viewport units
- never let fixed toolbars cover scrollable content

## Embedded Reference Patterns

Use these as style targets even when the example apps are not installed. If Mail, Meetings, or DB Browser are installed, read the relevant `src/client/widget.tsx`, `src/client/app.tsx`, and component files directly and prefer the live code over this compressed summary.

### Mail-Like Pattern

Use when the app is about triage.

Widget:

- title row: icon, "Inbox" or object name, count text
- 3-4 rows
- each row: unread dot, sender/title, subject/meta, time
- empty: ghost rows plus "Inbox empty" style footer

Full view:

- grouped list in a centered `max-w-[44rem]` column
- small uppercase date/status labels
- rounded group container with subtle border and internal separators
- row hover actions on the right
- detail reader with subject/title, metadata, content, and bottom action dock
- bulk selection dock when multiple rows are selected

### Meetings-Like Pattern

Use when the app has live capture plus notes.

Widget:

- recent meetings list with title, relative time, duration
- empty ghost meetings plus one-line "No meetings yet" message

Full view:

- "Coming up" or next scheduled objects first when relevant
- list grouped by day
- detail view is an editable document
- active recording is controlled by a bottom dock
- dock shows input level, duration, primary record/pause/resume/end action
- transcription or generation status appears just above the dock
- enhanced/generated notes appear in the same editing surface

### DB-Browser-Like Pattern

Use when the app is a technical instrument.

Widget:

- 4-6 compact rows
- colored dot, connection/object name, mono metadata
- empty ghost connections plus "Add a connection" footer

Full view:

- left navigation pane with object browser or saved workspaces
- center editor/results workspace
- optional right inspector pane
- top bars are `h-8` or `h-9`
- icon toolbars use tooltips
- tables use sticky headers, mono cells, row numbers, selected row, details pane
- resizers are thin but discoverable
- app chat instructions include active connection/object and safe execution guidance

## Final UI Checklist

Before finishing UI work, verify:

- widget has real loading, empty, error, and data states
- widget does not repeat the app name or duplicate the app icon/title chrome
- full view uses one archetype from this file
- full view does not add an app-name header just to identify the app
- app shell is full height with `h-full min-h-0 overflow-hidden`
- scrolling is on intentional inner panes, not the body
- all scrollable content clears chat safe padding
- dialogs with substantial content are height-constrained above the chat area and scroll internally
- fixed docks clear chat safe padding
- no raw Tailwind colors
- no marketing hero, feature-grid, decorative gradient, nested cards, or giant empty centered page
- all icon-only actions have labels/tooltips
- all buttons have `cursor-pointer` unless disabled
- text truncates or wraps cleanly
- empty/error/setup copy is short and specific
- commands exist for important actions
- app does not include its own chat input/container; it uses desktop chat APIs, commands, or app RPC instead
- AI/app context is posted when useful
- design works from this reference alone, and uses Mail, Meetings, or DB Browser as additional references when they are installed
