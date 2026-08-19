# Component decision router

Import public APIs from `@moldable-ai/ui`. The package-root export is the
contract; never import application code from `src` or `dist`.

Read the selected component's colocated guide before coding:

```text
node_modules/@moldable-ai/ui/src/components/ui/<component>.md
packages/ui/src/components/ui/<component>.md  (desktop monorepo)
```

The guide is the current source for props, examples, keyboard behavior, and
component-specific accessibility. Do not duplicate those catalogs here.

| Need | Start with | Decision |
| --- | --- | --- |
| App root or window-aware layout | `AppFrame`, `Toolbar`, `Panel`, `SplitView`, `Inspector`, `Sidebar` | Start standalone-first. The host owns window chrome; select one scroll owner per region. |
| Text hierarchy | `Text` | Express role through a semantic text variant, not repeated font utilities. |
| Actions | `Button`, `IconButton`, `ButtonGroup`, `NavigationButtonGroup` | One clear primary action locally; icon-only actions need an accessible name. |
| Search, entry, or forms | `SearchField`, `Input`, `Textarea`, `NumberInput`, `Field`, `Form` | Use the field matching the data type and preserve browser editing behavior. |
| Date or time | `DateField`, `DatePicker` | Use portable controls by default; consult `host-date-time-picker.md` only for an advertised host enhancement. |
| Choice or mode | `SegmentedControl`, `Tabs`, `ToggleGroup`, `Switch`, `RadioGroup`, `Select`, `Combobox` | Segments are small exclusive modes; tabs label content panels; switches are immediate persistent settings. |
| Collection | `List`/`ListItem`, `Grid`/`GridItem`, `Item`, `Table` | Use `List` or `Grid` when selection and keyboard coordination matter; `Item` is presentational. |
| Feedback | `Empty`, `Alert`, `Status`, `Progress`, `Spinner`, `Skeleton`, `Toaster`/`toast` | Keep a failure near the relevant work; reserve toasts for transient outcomes. |
| Consequential work | `ConfirmDialog` | Use it for promise-backed destructive or high-consequence confirmation. |
| Menus, overlays, disclosure | `DropdownMenu`, `ContextMenu`, `Popover`, `Dialog`, `Sheet`, `Tooltip` | Keep critical commands discoverable outside a context menu; preserve primitive focus behavior. |
| Native host operation | `useHostNativeMenu`, `useHostFileDialog`, `useHostDateTimePicker`, `useHostShare`, `useHostWebSurface` | Read the matching colocated `src/lib/*.md`; use only advertised services and preserve the documented fallback. |
| Materials or edge continuation | `Material`, `MaterialGroup`, `EdgeFade` | Material belongs to compact chrome, not primary content. Edge fades are decorative, never a substitute for scrolling or keyboard access. |

## App-safe versus host-oriented exports

Most root-exported controls are app-safe. Host bot/group channel surfaces, model
selectors, approval views, and conversation history are host-oriented: do not use them as
generic app primitives merely because they are exported. Ordinary apps use
standard layout, form, collection, and feedback primitives unless a task
explicitly requires host-compatible channel behavior.

Native-capability panels and hooks are app-safe only when the task genuinely
needs that capability and its permission, availability, error, and fallback
states are part of the screen model. Prefer provided panels before composing
device access from scratch.

## Before adding a primitive

Confirm that the behavior is shared across apps, then add a deliberate
package-root export, component guide, semantic tokens, keyboard/focus and
state behavior, catalog coverage, and tests. Keep product wording and
feature-specific composition in the app.
