# Moldable UI Components

Use `@moldable-ai/ui` for Moldable app shells, interactive controls, semantic
tokens, host integration, and native-capability UI.

## Source Routing

Use the package exports and guides shipped beside this skill.

Use these package paths relative to the `packages/ui/` root:

| Need                               | Package source of truth                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public package exports             | `src/index.ts`                                                                                   |
| Public renderer component families | `src/components/ui/index.ts`                                                                     |
| Component APIs and recipes         | `src/components/ui/*.md`                                                                         |
| Native-capability components       | `src/components/native-capabilities/README.md` and `src/components/native-capabilities/index.ts` |
| Foundations and verification       | `docs/README.md`, then the selected guide under `docs/`                                          |
| Host share                         | `src/lib/host-share.md`                                                                          |
| Host date/time picker              | `src/lib/host-date-time-picker.md`                                                               |
| Host native menu                   | `src/lib/host-native-menu.md`                                                                    |
| Host file dialog                   | `src/lib/host-file-dialog.md`                                                                    |

The published package includes its `docs/` directory and the colocated
`src/components/ui/*.md` guides. Read the guide for every component family used
in a new or substantially changed view. The guide owns props, variants,
composition, states, and keyboard behavior; do not copy an API table into the
skill or guess from memory. If a public export has no guide, inspect the
colocated declarations/source and report the documentation gap.

If the package does not have the primitive the app needs, report the gap. Do
not deep-import private files, clone an existing shared control into the app,
or create a lookalike component with a different interaction model.

## Required Setup

Apps scaffolded by Moldable already include this provider shape:

```tsx
// src/client/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  WorkspaceProvider,
  installMoldableFrameLifecycle,
} from "@moldable-ai/ui";
import { App } from "./app";
import { QueryProvider } from "./query-provider";
import "./globals.css";

installMoldableFrameLifecycle();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <WorkspaceProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

```css
/* src/client/globals.css */
@import "tailwindcss";
@import "@moldable-ai/ui/styles";
```

Install the frame lifecycle exactly once. It applies the host display mode,
window insets, and advertised host services. Desktop currently publishes
`--chat-safe-padding: 0px`; the token remains meaningful on mobile web, where
it aliases the mobile bottom clearance.

## App Shell and Dedicated Windows

Begin every full app view with `AppFrame`, then use `AppFrameTitlebar`,
`AppFrameToolbar`, `AppFrameContent`, and, when useful,
`AppFrameStatusbar`. Compose fixed panes with `Panel`; use `SplitView` only
when resizing is part of the task. `Toolbar` owns compact pane context and
actions, while `Inspector` owns properties for the current selection.

Apps open in host-owned dedicated windows by default. The same app shell must
remain safe in the embedded compatibility/fallback surface:

| Titlebar mode           | Use when                                                                                                        | Required behavior                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Host titlebar (default) | Most apps; the app does not need one unified title-and-toolbar row                                              | Let the host own window chrome, controls, dragging, and its titlebar strip. Keep app UI below it. |
| App titlebar            | A focused utility genuinely benefits from merging document/app identity and frequent tools into one compact row | Set `"window": { "titlebar": "app" }` in `moldable.json` and use `AppFrameTitlebar` for that row. |

In app-titlebar mode, the host still renders the real window controls and
advertises the titlebar height plus the leading control inset.
`AppFrameTitlebar` consumes those values, reserves the traffic-light safe zone,
and forwards drag and double-click behavior from non-interactive titlebar
space. Keep buttons, fields, and other interactive content outside that safe
zone. Never draw window controls, manually mark drag regions, or reproduce the
bridge messages.

Read `docs/app-anatomy.md`,
`docs/standalone-app-windows.md`, and
`src/components/ui/app-frame.md` before changing the shell.

## Component Decisions

Select components by intent, confirm every export in the public barrel, and
read the selected colocated guides before implementation.

### Actions and View Switching

| Need                                              | Choose             | Why                                                               |
| ------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| Run one immediate command                         | `Button`           | Momentary action such as save, run, refresh, or open              |
| Turn one independent mode/tool on or off          | `ToggleButton`     | One pressed/unpressed state with button semantics                 |
| Pick exactly one of two to five compact modes     | `SegmentedControl` | Mutually exclusive mode choice with radio-group keyboard behavior |
| Switch between peer content panels in one context | `Tabs`             | Each trigger owns a corresponding panel                           |

Do not use a toggle for a one-time command, segmented controls for unrelated
navigation, or tabs as a command toolbar.

### Fixed and Searchable Choices

| Need                                                    | Choose     |
| ------------------------------------------------------- | ---------- |
| Short, fixed option set                                 | `Select`   |
| Search, creation, a long option set, or multiple values | `Combobox` |

Use `Input` only for unconstrained text and `Command` for actions rather than
values.

### Temporary Surfaces

| Need                                                     | Choose      |
| -------------------------------------------------------- | ----------- |
| Terse, non-interactive clarification                     | `Tooltip`   |
| Non-interactive preview revealed by hover or focus       | `HoverCard` |
| Small interactive surface anchored to a control          | `Popover`   |
| Focused task that temporarily blocks the current surface | `Dialog`    |

A tooltip supplements an accessible name; it never replaces one. Required
instructions and critical actions cannot depend on hover.

### Feedback

| Need                                                          | Choose                          |
| ------------------------------------------------------------- | ------------------------------- |
| Persistent inline issue or information that belongs in layout | `Alert`                         |
| Brief action/background feedback that does not need to remain | `toast` with one root `Toaster` |
| Compact dot-and-label state near the object                   | `Status`                        |

Use `AlertDialog` or `ConfirmDialog` for consequential confirmation. Use
`Empty` for a normal absence of data.

### Portable and Native Menus

| Need                                                                        | Choose                                                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Cross-platform renderer menu, or app-owned menus with rich renderer content | `DropdownMenu` or `ContextMenu`                                            |
| A host-native transient popup menu when the host advertises it              | Keep the portable menu and opt the same call site into `useHostNativeMenu` |

The native menu service is an enhancement, not a replacement implementation.
Keep command handling keyed by the same app-owned IDs and preserve the portable
path for unadvertised hosts.

Chat components exported by the package are desktop/product internals.
Generated apps must not create a second chat surface.

## Host Services: Fallback First

Write each call site once around a portable baseline. Attempt the host service
from the same user action; native behavior lights up only when the host
advertises it. A `fallback` result routes back to the baseline UI. Treat
`cancelled`, errors, aborts, and timeouts as normal states. Do not implement the
host request envelope or platform bridge in app code.

| Hook                    | Portable baseline                                                    | API guide                          |
| ----------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| `useHostShare`          | Browser sharing when available, then app-owned copy/download actions | `src/lib/host-share.md`            |
| `useHostDateTimePicker` | `DatePicker`, `DateField`, or a calendar popover                     | `src/lib/host-date-time-picker.md` |
| `useHostNativeMenu`     | `ContextMenu` or `DropdownMenu`                                      | `src/lib/host-native-menu.md`      |
| `useHostFileDialog`     | App-owned file input/open flow and existing save/download flow       | `src/lib/host-file-dialog.md`      |

Read the matching host guide before writing the call site. Those guides own
request options, result shapes, placement, cancellation, and fallback details.

## Native Capability Components

For camera, microphone, display capture, system audio, location, power,
notifications, local authentication, haptics, secure storage, USB, HID, serial,
MIDI, Bluetooth, clipboard, and global shortcuts, start with the public
components and hooks routed through
`src/components/native-capabilities/index.ts`. The package components already
own permission, unsupported, denied, idle, active, disconnected, and error
states.

Read `src/components/native-capabilities/README.md`, confirm the export, and
inspect the selected colocated source/declaration. Use imperative helpers
for headless logic or genuinely custom visualization, not to rebuild a shared
permission panel, device picker, meter, console, or status treatment.

## Semantic Tokens and Materials

Always use semantic roles:

```tsx
// Correct
<div className="bg-surface-canvas text-text-primary border-separator" />

// Wrong
<div className="bg-white text-gray-900" />
```

Use `Text` roles and shared density tokens instead of one-off type and control
sizes. Use `Material` only for navigation/control chrome; primary canvases,
documents, tables, calendars, forms, cards, sheets, and inspectors remain
opaque. Read `docs/foundations.md`, `docs/design-tokens.md`, and
`docs/adaptive-materials.md` before adding tokens or material.

## Workspace Integration

```tsx
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@moldable-ai/ui";

function MyComponent() {
  const { workspaceId, fetchWithWorkspace } = useWorkspace();

  const { data } = useQuery({
    queryKey: ["items", workspaceId],
    queryFn: async () => {
      const res = await fetchWithWorkspace("/api/items");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });
}
```

## Desktop Communication

```tsx
import { downloadFile, isInMoldable, sendToMoldable } from "@moldable-ai/ui";

if (isInMoldable()) {
  sendToMoldable({ type: "moldable:open-url", url: "https://example.com" });
}

await downloadFile({
  filename: "data.csv",
  data: "name,value\nfoo,1",
  mimeType: "text/csv",
});
```

Use the host-service hooks above for share sheets, system date/time pickers,
native popup menus, and file dialogs. Do not recreate those services with raw
messages.

## Commands

Apps can add app-specific actions to the desktop Cmd+K menu. The desktop
fetches commands from the active app's Hono server at
`GET /api/moldable/commands` and includes the current workspace in the
`x-moldable-workspace` header. Use `getWorkspaceFromRequest(c.req.raw)` when
commands depend on workspace-scoped state.

```ts
// src/server/app.ts
app.get("/api/moldable/commands", (c) => {
  return c.json({
    commands: [
      {
        id: "add-item",
        label: "Add New Item",
        shortcut: "n",
        icon: "plus",
        group: "Actions",
        action: { type: "message", payload: { action: "add" } },
      },
    ],
  });
});
```

For dynamic lists, return one command per item and use `action.command` to send
all items to the same client handler with different payloads. `description` is
shown as muted secondary text and is searchable. `indicator` renders an
app-defined marker next to the command label; include a human-readable `label`
for accessibility and hover help.

```tsx
import { useMoldableCommands } from "@moldable-ai/ui";

function App() {
  useMoldableCommands({
    "add-item": () => setShowAddForm(true),
    "switch-repository": (payload) => {
      const repoPath = (payload as { repoPath?: unknown } | null)?.repoPath;
      if (typeof repoPath === "string") switchRepository(repoPath);
    },
  });
}
```

Supported action types:

- `message`: posts `moldable:command` to the app iframe.
- `navigate`: changes the active iframe path.
- `focus`: shorthand for a focus-target message.

### Focused-window shortcuts

Use `useMoldableWindowShortcuts` for app-window commands that must still work
while a host-owned native child surface has focus. These are not global
shortcuts: they are active only while that Moldable app window is focused, and
their opaque IDs arrive through `useMoldableCommands`.

```tsx
const shortcuts = [
  {
    id: "new-document",
    label: "New Document",
    accelerator: "CmdOrCtrl+N",
  },
  {
    id: "close-document",
    label: "Close Document",
    accelerator: "CmdOrCtrl+W",
  },
] as const;

const shortcutDefaults = {
  commandMenu: true,
  closeWindow: false,
} as const;

function App() {
  useMoldableWindowShortcuts(shortcuts, shortcutDefaults);
  useMoldableCommands({
    "new-document": createDocument,
    "close-document": closeDocument,
  });
}
```

Moldable enables its focused-window defaults unless the app opts out:

- `commandMenu`: Cmd/Ctrl+K opens the app command menu.
- `closeWindow`: Cmd/Ctrl+W closes the dedicated app window.

Disable a default before reclaiming its accelerator. Moldable rejects duplicate
accelerators and Moldable-wide reserved commands. Keep the shortcut arrays and
default options referentially stable. Use the separately permissioned global
shortcut API only for explicit, user-enabled actions that must work while
another application is focused.

## Home: the Today View

The home screen is the host-rendered **Today** view. An app participates by
implementing `GET /api/moldable/today` and returning something only when it
genuinely needs the user. See [today.md](today.md) for the contribution
contract and examples.

## Markdown and Editors

```tsx
import { Markdown } from "@moldable-ai/ui";
import { MarkdownEditor } from "@moldable-ai/editor";
```

Use `Markdown` for read-only rendered Markdown and `MarkdownEditor` for
editable Markdown/prose. Do not build Markdown editors with raw
`contenteditable` or a textarea when `@moldable-ai/editor` fits the job.

Import the editor styles in `src/client/globals.css`:

```css
@import "@moldable-ai/editor/styles";
@source '../../node_modules/@moldable-ai/editor/dist/**/*.{js,jsx,ts,tsx}';
```

For code, SQL, JSON, configuration, scripts, and other syntax-heavy editing,
use Monaco through `@monaco-editor/react` instead of a textarea. See
[design.md](design.md) for the full editor patterns.
