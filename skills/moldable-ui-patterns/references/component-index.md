# Component index

Use root imports:

```tsx
import { Button, Inspector, Text, Toolbar } from "@moldable-ai/ui";
```

Do not import from `@moldable-ai/ui/src/...` or `dist/...`. The package root is the supported API boundary.

## Ordinary app primitives

These families are suitable for generated and first-party Moldable apps.

| Need                    | Preferred families                                                                                                        | Notes                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Type hierarchy          | `Text`                                                                                                                    | Use semantic variants instead of repeating font classes.                                   |
| Actions                 | `Button`, `ButtonGroup`, `IconButton`, `NavigationButtonGroup`                                                            | Use one primary action per local context; require a name for icon-only actions.            |
| Compact selection       | `SegmentedControl`, `SegmentedControlItem`, `ToggleButton`, `ToggleGroup`, `Tabs`                                         | Segments choose one mode; tabs change content regions; toggles represent command state.    |
| Status                  | `Status`, `Badge`, `NotificationDot`, `Progress`, `Spinner`, `Skeleton`                                                   | `Status` communicates meaning; `NotificationDot` only marks unseen/new content.            |
| Text and numeric entry  | `Input`, `Textarea`, `InputGroup`, `InputOTP`, `NumberInput`, `SearchField`, `DateField`, `DatePicker`                    | Use the semantic field instead of rebuilding its adornments and behavior.                  |
| Choice and range        | `Checkbox`, `RadioGroup`, `Select`, `Combobox`, `Switch`, `Slider`, `ColorWell`, `Calendar`                               | Use `Select` for short fixed choices and `Combobox` for searchable choices.                |
| Form structure          | `Label`, `Field`, `Form`                                                                                                  | `Field` supports ordinary layout; `Form` integrates React Hook Form.                       |
| Commands and menus      | `Command`, `CommandItemContent`, `DropdownMenu`, `ContextMenu`, `Menubar`                                                 | Use shared command-item anatomy; keep destructive items separated and explicit.            |
| Disclosure              | `Accordion`, `CollapsibleSection`, `Popover`, `HoverCard`, `Tooltip`                                                      | Never hide required information behind hover alone.                                        |
| Modal work              | `Dialog`, `AlertDialog`, `ConfirmDialog`, `Sheet`, `Drawer`                                                               | Use `ConfirmDialog` for promise-backed consequential actions.                              |
| Content groups          | `List`, `ListItem`, `Grid`, `GridItem`, `Item`, `Card`, `Table`, `Avatar`, `AspectRatio`                                  | Shared collections own selection and keyboard behavior; `Item` is presentational.          |
| Empty and notice states | `Empty`, `Alert`                                                                                                          | These are the canonical empty-state and callout families.                                  |
| Navigation              | `Breadcrumb`, `Pagination`, `NavigationMenu`                                                                              | In an embedded app, avoid recreating the desktop's global navigation.                      |
| Layout                  | `AppFrame`, `AppFrameTitlebar`, `AppFrameToolbar`, `AppFrameContent`, `AppFrameStatusbar`, `Panel`, `PanelGroup`, `Separator`, `ScrollArea`, `Resizable`, `SplitView`, `Sidebar`, `Toolbar`, `Inspector`, `EdgeFade`, `Material`, `MaterialGroup` | Start with a standalone-capable frame; material is reserved for control/navigation layers. |
| Media and data          | `Carousel`, `Chart`, `Markdown`, `CodeBlock`, `RichMediaPlayer`                                                           | Use only when the content warrants the visual complexity.                                  |
| Feedback and utilities  | `Toaster`, `toast`, `Kbd`, `MessageScroller`, `AppErrorBoundary`                                                          | Mount one toaster; use shared recipes for transient outcomes.                              |

## Authored quality-layer components

These components establish the shared Moldable application grammar.

### `AppFrame`

Compose `AppFrame`, `AppFrameTitlebar`, `AppFrameToolbar`, `AppFrameContent`,
and `AppFrameStatusbar` for a standalone-window-first hierarchy. The host
supplies environment insets and system capabilities. Do not simulate native
window controls.

### `List` and `Grid`

Compose `List`/`ListItem` for one-dimensional collections and `Grid`/`GridItem`
for spatial collections. Use their selection and keyboard contracts rather than
app-local roving-focus code. Use `Item` only when no collection behavior is
required.

### `SegmentedControl`

Compose `SegmentedControl` and `SegmentedControlItem` for two to five
mutually-exclusive local modes. Use `Tabs` for labelled content panels.

### `Material` and `MaterialGroup`

Use `Material` for a single adaptive navigation or control surface. Prefer
`regular`; use `clear` only for compact controls floating over media. Use
`MaterialGroup` for one shared sampler around a related control cluster. Do
not nest material surfaces or use them for content cards, forms, tables, or
calendars.

### `IconButton`, `SearchField`, `DateField`, and `DatePicker`

`IconButton` is the canonical icon-only action and requires an accessible name.
`SearchField` owns search adornments, clear behavior, and field semantics.
`DateField` provides portable date-only text entry. `DatePicker` provides a
portable calendar popover while keeping the stored value as `YYYY-MM-DD`
without timezone conversion. Use native picker behavior only when the runtime
advertises a real shared host capability.

### `ConfirmDialog`

Use `ConfirmDialog` when confirmation starts synchronous or asynchronous work.
It prevents duplicate submission, stays open while pending, closes after
success, and keeps failures visible in context. Use low-level `AlertDialog`
parts only when a custom confirmation composition is required.

### `Text`

Variants: `heading1`, `heading2`, `large`, `large-strong`, `regular`, `strong`, `small`, `small-strong`, `mini`, `mini-strong`, `mono`, `mono-strong`, `small-mono`.

Colors: `primary`, `secondary`, `tertiary`, `disabled`, `link`, `accent`, `destructive`, `success`, `warning`, `inherit`.

Use `as`, `asChild`, `align`, and `truncate` to preserve semantics without duplicating styles.

### `Toolbar`

Compose `Toolbar`, `ToolbarGroup`, `ToolbarContent`, `ToolbarTitle`, `ToolbarDescription`, `ToolbarActions`, and `ToolbarSeparator`.

Variants: `default`, `plain`, `panel`. Densities: `compact`, `default`, `comfortable`. Positions: `static`, `top`, `bottom`.

### `Panel` and `PanelGroup`

Compose `PanelGroup`, `Panel`, `PanelHeader`, `PanelContent`, and
`PanelFooter` for fixed app panes. `PanelContent` owns scrolling. Use
`SplitView` instead when the user needs to resize panes.

### `Inspector`

Compose `Inspector`, `InspectorHeader`, `InspectorContent`, `InspectorSection`, `InspectorRow`, `InspectorLabel`, and `InspectorValue`. It owns a compact property-editing column and already includes chat-safe bottom padding in its content region.

### `SplitView`

Compose `SplitView`, `SplitViewPane`, and `SplitViewHandle`. Set `orientation` to `horizontal` or `vertical`. Use it only when both panes remain useful independently.

### `Status` and `NotificationDot`

`Status` variants are `neutral`, `success`, `warning`, `error`, `running`, and `pending`; it can hide or animate its indicator. `NotificationDot` is a nonverbal unread marker and must accompany a readable label or count in context.

### `NumberInput`

Supports controlled or uncontrolled numeric values, `min`, `max`, `step`, an optional `unit`, optional `steppers`, sizes `sm`, `default`, `lg`, and variants `default`, `filled`.

### `ColorWell`

Supports controlled color values, `onValueChange`, `readOnly`, and sizes `sm`, `default`, `lg`. Always provide a contextual label.

### `EdgeFade`

Place inside a relatively positioned scroll container to signal continuation
at its `top`, `bottom`, `left`, or `right` edge. It is decorative and does not
replace scrollbars or keyboard access.

## Specialized public surfaces

Native-capability components are public and app-safe only when the feature needs that capability. Prefer them over rebuilding permission and device states:

`BluetoothPanel`, `CameraPreview`, `CapabilityBadge`, `CapabilityMatrix`, `ClipboardCopyButton`, `DeviceList`, `DisplayMap`, `HapticButton`, `HidDevicePanel`, `LiveIndicator`, `LocalAuthButton`, `LocationPanel`, `MicrophoneMeter`, `MidiMonitor`, `NativeCapabilityPanel`, `NotificationsPanel`, `PowerPanel`, `BatteryGauge`, `Readout`, `ScreenSharePreview`, `SecureStoragePanel`, `SerialConsole`, `ShortcutRecorder`, `StreamLog`, `SystemAudioMonitor`, and `UsbDevicePanel`.

The package also exports capability hooks. Use them only when a provided surface cannot express the product requirement.

## Host-oriented exports

Chat panels, model selectors, approval views, checkpoints, and conversation-history components are exported for the Moldable host and tightly integrated experiences. Do not use them as generic app primitives merely because they are public. Ordinary apps should use `MessageScroller`, `Markdown`, `Input`, and the standard layout primitives unless the task explicitly requires host-compatible chat behavior.

## Internal and unavailable

- A source file is not public unless it is exported from `@moldable-ai/ui`.
- Test helpers, component-local contexts, and implementation-only hooks are internal.
- Never deep-import an unexported component to bypass this boundary. Add and document a deliberate root export first.
