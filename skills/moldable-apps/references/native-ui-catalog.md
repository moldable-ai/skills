# Native UI catalog

Use the catalog and capabilities shipped in the active `nativeUI` tool as the
source of truth. A2UI v1.0 components are flat objects: `{id, component, ...}`.
Properties sit beside `id` and `component`; child components are IDs, never
nested objects.

## A2UI v1.0 Basic catalog

These are standard Basic catalog components:

- `Text` — `text`, optional `variant: caption|body`; use for body or caption text
- `Image` — `url`, optional `description`, `fit`, `variant`
- `Icon` — an exact A2UI Basic icon `name`, a data binding, or `svgPath`
- `Row`, `Column` — `children: ChildList`, optional `justify`, `align`, `weight`
- `List` — `children: ChildList`, optional `direction`, `align`, `weight`
- `Card` — `child`
- `Tabs` — tab descriptors referencing child component IDs
- `Modal` — trigger/content component IDs
- `Divider` — optional `axis`
- `Button` — `child`, `action`, optional `variant`
- `TextField` — `label`, optional `value`, `placeholder`, `variant`, `checks`
- `CheckBox` — `label`, `value`
- `ChoicePicker` — `options`, `value`, optional `label`, `variant`,
  `displayStyle`, `filterable`
- `Slider` — `value`, `max`, optional `label`, `min`, `steps`
- `DateTimeInput` — `value`, optional date/time bounds and enablement

`ChildList` is either `['childId', ...]` or a repeated template:

```json
{ "path": "/records", "componentId": "recordTemplate" }
```

Within a template, relative bindings resolve against the current item. Use
`@index` for an ordinal and a catalog function such as `formatString` for
derived text. Use supported `checks` for field validation. Component/function
resolution follows negotiated catalogs; there is no implicit fallback to a
catalog merely mentioned in capabilities.

## Moldable SwiftUI catalog extension

The following are Moldable components, not A2UI Basic. Generate them only when
the active renderer advertises them.

### Layout and navigation

- `Grid` — `children: ChildList`; optional columns, minimum width, spacing
- `Carousel` — `children: ChildList`; optional item width and spacing
- `DisclosureGroup` — title/subtitle plus referenced children
- `PageDeck` — bounded prefetched pages for read-only navigation; normally 2–4,
  never more than 6 pages or 96 total components

### Input

- `TextArea`, `SearchField`, `Toggle`, `Stepper`, `SegmentedControl`
- `Calendar`, `Rating`

### Records and prose

- `Heading` — `text`, optional `level: 1|2`; use for page and section hierarchy
- `RichListItem`, `SectionHeader`, `KeyValueRow`, `TimelineItem`
- `MarkdownText`, `DataTable`, `CodeBlock`, `Quote`, `FileAttachment`

Prefer `Heading` over Markdown markers. The tool accepts `Text` with `h1`/`h2`
or leading `#`/`##` as model-friendly shorthand, then normalizes it to the
owned `Heading` extension before strict A2UI v1 transport.

### Status and insight

- `StatusBadge`, `Progress`, `Metric`, `Gauge`, `Chart`, `Notice`
- `EmptyState`, `Skeleton`, `LoadingIndicator`

Use semantic tones only where supported: `neutral`, `info`, `success`,
`warning`, `error`, or `pending`. Omit tone for the system default.

### Media, identity, and place

- `Avatar` — name plus optional initials, safe image alias, symbol, size, tone
- `PhotoGrid` — bounded safe-alias items
- `Map` — bounded center/markers plus optional deltas, height, and style
- `TagGroup` — tags plus optional title/tone

Images use `asset:<alias>` values exposed by the host. Present the tree before
bytes arrive; iOS owns reserved geometry, skeleton, verified fetch/cache, and
hydration. Do not send base64, file paths, credentials, or arbitrary URLs.

## Actions

A Button action emits a stable semantic event:

```json
{
  "event": {
    "name": "openInvoice",
    "context": { "invoiceId": { "path": "/invoice/id" } }
  }
}
```

Context entries must be scalar/dynamic values, not arbitrary nested literal
objects. For Moldable prefetched navigation, use separate scalar keys:

```json
{
  "moldableNavigationKind": "navigate",
  "moldableNavigationDeckId": "cook-flow",
  "moldableNavigationPageId": "step-2",
  "moldableNavigationLabel": "Next step"
}
```

Only an affordance explicitly requesting speech may add
`"voiceResponse": "respond-after-agent"`; normal actions are
observation-only.

## Deliberate boundaries

- The `nativeUI` present/update/close envelope, Relay delivery, view revisions,
  traces, preparation loader, safe asset aliases, Voice policy, and PageDeck
  navigation behavior are Moldable extensions—not A2UI wire fields.
- Navigation bars, modal chrome, safe areas, and presentation are host-owned.
- A2UI v1.0 has no `theme` field. Let SwiftUI follow system appearance/tint.
- Leave `sendDataModel` false/omitted unless an intentionally bounded form
  requires full-model synchronization on each action.
- Audio, video, and WebView are unavailable to agents until verified asset,
  lifecycle, and security contracts ship.
- If the active tool lacks a listed extension, choose a supported composition
  or keep the result in conversation. Never fabricate a component.
