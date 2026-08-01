# Native UI patterns

Choose the closest archetype, then adapt it to authoritative app data. These
are semantic recipes, not visual templates. Use the active `nativeUI` schema
for exact properties and capabilities.

## Repetition rule

For repeated data, prefer an A2UI v1.0 `ChildList` template:

```json
{
  "id": "results",
  "component": "List",
  "children": { "path": "/results", "componentId": "resultTemplate" }
}
```

Define `resultTemplate` and its descendants once. Bind item fields with
relative paths such as `{ "path": "title" }`. This is smaller, updates more
cleanly, and preserves identity better than emitting duplicate row components.

## Collection or inbox

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ Row(StatusBadge, StatusBadge)          optional summary
├─ SearchField                            optional, Moldable extension
├─ SectionHeader                          Moldable extension
├─ List(ChildList → RichListItem template)
└─ Button                                 one useful primary action
```

Use metadata for provenance/category, trailing text for time or compact state,
and unread state only when it changes priority. Split records into a few
meaningful sections instead of wrapping every row in a decorative card.

## Record detail or guided task

```text
Column
├─ Image(header)                          meaningful safe alias only
├─ Heading(level: 1)                     semantic page heading
├─ Text(body) or StatusBadge
├─ TagGroup                               optional
├─ Grid(Card(Metric))                     optional summary
├─ SectionHeader
├─ KeyValueRow / RichListItem / TimelineItem
├─ Notice                                 meaningful callout only
└─ Button                                 semantic next action
```

Bind mutable status/progress through `dataModel`. After an action, call the app
mutation and patch the same surface from its authoritative response.

## Dashboard or comparison

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ SegmentedControl                       time range or mode
├─ Grid(ChildList → Card(Metric) template)
├─ Chart or Gauge
├─ SectionHeader
├─ List(ChildList → KeyValueRow template)
└─ Notice                                 anomaly or interpretation
```

Do not color every metric. Reserve tone for selection, thresholds, warning,
progress, and meaningful trend. Include a chart only when shape/comparison
matters.

## Photo or product gallery

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ SectionHeader
├─ SearchField or TagGroup                optional
├─ Grid(ChildList → Card(Image, Text))    or PhotoGrid extension
├─ KeyValueRow                            optional selection summary
└─ Button                                 optional next step
```

Use safe `asset:<alias>` values. The page tree should render immediately;
images reserve their final layout, show automatic native skeletons, and
hydrate independently. Do not replace each known image with an authored
`Skeleton`. Use `Carousel` only when peers are intentionally consumed one at a
time.

## Nearby places

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ TagGroup                               active filters
├─ Map                                    bounded markers
├─ SectionHeader
└─ List(ChildList → RichListItem template)
```

The map and list must describe the same bounded result set. Put distance,
rating, and open state in rows instead of overloaded marker labels.

## Schedule, itinerary, or process

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ Row(Card(Metric), Card(Metric))        optional overview
├─ SectionHeader
├─ List(ChildList → TimelineItem template)
├─ Notice                                 conflict or exception
└─ Button                                 add, continue, or resolve
```

Use Calendar when date selection is dominant; use TimelineItem when sequence
and progression matter more.

## Form or settings

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ SectionHeader
├─ TextField / TextArea / SearchField
├─ Toggle / CheckBox
├─ SegmentedControl / ChoicePicker
├─ Slider / Stepper / Rating
├─ DateTimeInput / Calendar
├─ Notice                                 validation/permission context
└─ Button                                 semantic submit
```

Bind fields to `dataModel` and use supported `checks` with inline messages.
Keep labels literal and concise. Moldable NativeUI leaves `sendDataModel`
omitted/false; semantic actions carry only their bounded resolved context.
Avoid reproducing system Settings or permission chrome.

## Media status

While playback components remain unavailable:

```text
Column
├─ Text(caption)
├─ Image(header)                          verified artwork alias
├─ Heading(level: 1)                     semantic page heading
├─ Text(body)
├─ Progress
├─ Row(Button or Icon actions)
├─ SectionHeader
└─ RichListItem                           queue or next item
```

Represent status semantically and keep playback ownership in the app/service.
Do not simulate Audio or Video components.

## Structured secondary content

```text
Column
├─ Heading(level: 1)                     semantic page heading
├─ Carousel(Card(FileAttachment), Card(Notice))
├─ DataTable
├─ DisclosureGroup
│  └─ CodeBlock / KeyValueRow / MarkdownText
└─ Quote                                  optional attribution
```

Keep tables compact/bounded. Use disclosure for detail that should not compete
with the primary result.

## Preparation, loading, empty, and failure

- Immediately present the host-owned preparation state when a native
  presentation is requested. It communicates that a just-in-time experience
  is being composed before the first valid component tree arrives.
- Once page structure is known, render it. Known `Image` components get
  automatic geometry-preserving skeletons until verified bytes hydrate.
- Use `Skeleton` only when the component shape itself is not yet available and
  a deliberate placeholder surface is useful.
- Use `LoadingIndicator` for a short bounded operation with a concrete label
  such as “Loading messages,” never vague narration such as “Checking.”
- Use `EmptyState` for no records and `Notice` plus a semantic retry/resolution
  action for recoverable failures.
- Do not claim delivery before a current-revision render acknowledgement.

## Progressive experiences and prefetch

For watering plants, triaging mail, cooking, or one-at-a-time work:

1. Present one focused authoritative state.
2. If the app result already contains predictable read-only pages, use the
   Moldable `PageDeck` extension for a 2–4 page frontier. Never exceed 6 pages
   or 96 components.
3. Put scalar navigation fields in the Button event context:
   `moldableNavigationKind`, `moldableNavigationDeckId`,
   `moldableNavigationPageId`, and `moldableNavigationLabel`.
4. Emit ordinary semantic actions for mutations/fresh lookups; never pre-render
   their outcome.
5. Let iOS record the gesture as one visible conversation action.
6. Call the app API when required, then patch the same surface or replace its
   small frontier.

Do not create a new surface per item. Preserve stable component IDs, bindings,
hierarchy, and visual language across revisions.

## Review checklist

- The owning app API supplied every domain value and mutation.
- Components are flat and exactly one component is `root`.
- Repetition uses `ChildList` plus relative bindings where appropriate.
- The first viewport has a clear title, useful summary, and restrained color.
- Every image uses a safe alias and can hydrate after first frame.
- Every domain action has a stable event and bounded scalar/dynamic context.
- Mutable values can update without replacing the whole hierarchy.
- PageDeck is treated as a bounded Moldable extension; mutation outcomes are
  not prefetched.
- Loading, empty, failure, disabled, and completion states are represented.
- Voice/chat complements rather than duplicates the surface.
- Visibility is claimed only after rendered delivery acknowledgement.
