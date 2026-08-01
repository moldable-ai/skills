# Native UI on iPhone

Use this reference for structured or interactive experiences requested from a
first-party Moldable iOS conversation. The active `nativeUI` tool schema and
renderer capabilities are authoritative when they differ from this guide.

## Contract layers

Keep three layers distinct:

1. **A2UI v1.0 wire contract** — flat components, inline `createSurface`
   components/data, data bindings, `ChildList`, actions, functions, checks,
   capability negotiation, and incremental updates.
2. **Moldable catalog extension** — additional SwiftUI components such as
   `RichListItem`, `Metric`, `Grid`, and `PageDeck`. Use one only when the
   active renderer advertises it.
3. **Moldable host envelope** — `nativeUI` presentation/update/close actions,
   Relay delivery, view revisions, asset aliases, render acknowledgements,
   traces, Voice policy, and preparation UI. These are not A2UI standard
   fields.

Native UI is an observer-specific materialization of app-owned state, not a
second app implementation. The owning app remains authoritative. Relay carries
bounded encrypted descriptors and asset references—not pixels, DOM, domain
logic, or binary blobs.

## Presentation policy

For an iOS-originated turn:

- Use `nativeUI` for lists, records, details, controls, dashboards, progress,
  galleries, maps, schedules, comparisons, and guided workflows.
- Do not open or modify a desktop app, present desktop UI, or fall back to
  Canvas unless the person explicitly asks for the Mac/desktop.
- Prefer a native surface over a long spoken enumeration or wall of chat text.
- Skip a surface for a trivial fact, yes/no response, or explicit text/audio
  request.
- Keep urgent warnings, failures, approvals, and required confirmations in the
  conversation too.

If the active catalog cannot represent the experience, explain the limitation
in conversation. Do not invent a component or silently substitute desktop UI.

## Authoring workflow

1. Identify the app that owns the data and call its typed API.
2. Select a pattern from [native-ui-patterns.md](native-ui-patterns.md).
3. Compose one flat component array with exactly one `root`. Component
   properties live beside `id` and `component`; never wrap them in a
   `properties` object and never nest component objects.
4. Put stable hierarchy in `components` and mutable values in `dataModel`.
5. Use A2UI `ChildList` templates for repeated records instead of emitting a
   component per row.
6. Reference app images only through safe `asset:<alias>` values supplied by
   the host. Opaque access grants remain host-private.
7. Call `nativeUI` with `action: "present"`. The host maps it to one A2UI v1.0
   `createSurface` with initial `components` and `dataModel` inline.
8. Claim visibility only after `success: true` and
   `delivery.status: "rendered"`.
9. Reuse the returned `surfaceId`, `viewId`, and revision. Update the existing
   surface; do not create a new surface for every step.
10. Resolve meaningful actions through the owning app API, then project the
    authoritative result.

Do not add a `theme`; A2UI v1.0 removed it. Let iOS use system appearance and
tint. Leave `sendDataModel` omitted/false unless a narrowly scoped form truly
requires the renderer to return the entire model on every action. Prefer
explicit, bounded action context.

## A2UI v1.0 shape

The `nativeUI` tool is a Moldable envelope, but its `components` use the v1.0
component shape directly:

```json
{
  "action": "present",
  "surfaceId": "plants-watering",
  "title": "Water plants",
  "dataModel": {
    "name": "Golden pothos",
    "moisture": "Looks good",
    "plantId": "plant-42"
  },
  "components": [
    {
      "id": "root",
      "component": "Column",
      "children": ["photo", "title", "status", "water"]
    },
    {
      "id": "photo",
      "component": "Image",
      "url": "asset:plant-photo",
      "description": "Golden pothos",
      "fit": "cover",
      "variant": "header"
    },
    {
      "id": "title",
      "component": "Heading",
      "text": {
        "call": "formatString",
        "args": { "value": "${/name}" }
      },
      "level": 1
    },
    {
      "id": "status",
      "component": "StatusBadge",
      "text": { "path": "/moisture" },
      "tone": "success"
    },
    {
      "id": "water-label",
      "component": "Text",
      "text": "Water this plant"
    },
    {
      "id": "water",
      "component": "Button",
      "child": "water-label",
      "action": {
        "event": {
          "name": "waterPlant",
          "context": { "plantId": { "path": "/plantId" } }
        }
      }
    }
  ]
}
```

At the wire layer, the host emits `version: "v1.0"` and puts those initial
components and data directly inside `createSurface`. Later hierarchy changes
map to `updateComponents`; state patches map to `updateDataModel`; dismissal
maps to `deleteSurface`.

## Bindings, templates, functions, and checks

- Absolute bindings start with `/`, for example `{ "path": "/user/name" }`.
- A `ChildList` is either a literal component-ID array or a template:
  `{ "path": "/messages", "componentId": "messageCard" }`.
- Inside a repeated template, relative paths such as `{ "path": "sender" }`
  resolve against the current array item. Use `@index` only when position is
  meaningful.
- Use catalog functions such as `formatString` for derived display strings;
  do not invent concatenation syntax.
- Put validation in supported `checks` with their messages instead of
  manufacturing separate error text.
- Honor catalog resolution and renderer capabilities. The active tool catalog
  wins; never assume an extension component is present.

## Semantic actions

Every meaningful gesture enters the shared semantic conversation exactly once.
A button emits a stable event plus bounded identifying context; it never calls
an arbitrary app RPC directly. Chat and Voice can observe the event, the agent
calls the authoritative app API, and the surface receives the result.

Use names such as `waterPlant`, `markEmailRead`, `startCooking`, or
`openInvoice`. Do not encode transport details, RPC names, secrets, or mutable
state in the name/context. A2UI action context values must be scalar/dynamic
values; do not place arbitrary nested literal objects there.

Routine navigation, typing, sliders, disclosures, and local selection should
remain local/data-bound where possible. A domain-meaningful action becomes
conversation.

### Optional spoken response

Actions are observation-only by default. Only an affordance explicitly asking
Voice to answer may include:

```json
{ "voiceResponse": "respond-after-agent" }
```

The host records the action, waits for the finalized authoritative agent
result, and then asks Voice to respond. Never add this to routine navigation,
selection, mutation, approval, or refresh actions, and never infer it from the
button label.

### Prefetched navigation (Moldable extension)

`PageDeck` is a Moldable catalog extension, not an A2UI Basic component. Use it
only for read-only pages already known from the authoritative result. Preload
2–4 likely pages; never exceed 6 pages or 96 total components. Navigation
metadata must stay scalar:

```json
{
  "moldableNavigationKind": "navigate",
  "moldableNavigationDeckId": "cook-flow",
  "moldableNavigationPageId": "step-2",
  "moldableNavigationLabel": "Next step"
}
```

Do not pre-render a mutation outcome, approval, fresh lookup, or unknown state.
When the current authoritative page changes, replace or extend only its small
likely frontier.

## Progressive media

The host may expose app-owned images as safe aliases in the `nativeUIAssets`
result. Reference only `asset:<alias>` in `Image.url`, `Avatar.imageURL`, or
`PhotoGrid` items. Never put base64, file paths, credentials, arbitrary network
URLs, or bytes in A2UI/conversation payloads.

Present the component tree immediately; do not wait for image bytes. The iOS
renderer automatically reserves the image's final geometry, shows a native
skeleton, fetches/verifies/caches the asset in parallel, and hydrates the image
without replacing the surface. The first-frame render acknowledgement may
precede image completion; asset traces report later hydration. Do not emit a
manual `Skeleton` in place of every known `Image`.

If an app says a record has an image but provides no safe alias, report the
precise app-contract failure. Audio and video are not agent-facing until their
verified media and lifecycle contracts ship.

## Full example: repeated inbox records

This example uses the v1.0 template form of `ChildList`, so payload size does
not grow with a duplicate component tree for each message.

```json
{
  "action": "present",
  "surfaceId": "mail-inbox",
  "title": "Inbox",
  "dataModel": {
    "messages": [
      { "id": "m1", "sender": "Ava", "subject": "Lunch tomorrow?" },
      { "id": "m2", "sender": "Noah", "subject": "Quarterly notes" }
    ]
  },
  "components": [
    { "id": "root", "component": "Column", "children": ["heading", "messages"] },
    { "id": "heading", "component": "Heading", "text": "Inbox", "level": 1 },
    {
      "id": "messages",
      "component": "List",
      "children": { "path": "/messages", "componentId": "messageCard" }
    },
    { "id": "messageCard", "component": "Card", "child": "messageBody" },
    { "id": "messageBody", "component": "Column", "children": ["subject", "sender", "open"] },
    {
      "id": "subject",
      "component": "Text",
      "text": {
        "call": "formatString",
        "args": { "value": "${@index(offset: 1)}. ${subject}" }
      }
    },
    { "id": "sender", "component": "Text", "text": { "path": "sender" }, "variant": "caption" },
    { "id": "openLabel", "component": "Text", "text": "Open" },
    {
      "id": "open",
      "component": "Button",
      "child": "openLabel",
      "variant": "borderless",
      "action": { "event": { "name": "openEmail", "context": { "messageId": { "path": "id" } } } }
    }
  ]
}
```

## Full example: image-first gallery

The page bones render first. Each safe alias hydrates independently while its
image slot keeps stable geometry.

```json
{
  "action": "present",
  "surfaceId": "trip-gallery",
  "title": "Summer moments",
  "dataModel": {
    "photos": [
      { "assetURL": "asset:app-asset-1", "alt": "Lake at sunset", "caption": "Lake walk" },
      { "assetURL": "asset:app-asset-2", "alt": "Lunch on a patio", "caption": "Late lunch" },
      { "assetURL": "asset:app-asset-3", "alt": "Bright art studio", "caption": "Studio" }
    ]
  },
  "components": [
    { "id": "root", "component": "Column", "children": ["heading", "summary", "grid"] },
    { "id": "heading", "component": "Heading", "text": "Summer moments", "level": 1 },
    { "id": "summary", "component": "Text", "text": "Three recent photos", "variant": "caption" },
    {
      "id": "grid",
      "component": "Grid",
      "columns": 2,
      "children": { "path": "/photos", "componentId": "photoCard" }
    },
    { "id": "photoCard", "component": "Card", "child": "photoBody" },
    { "id": "photoBody", "component": "Column", "children": ["photo", "caption"] },
    {
      "id": "photo",
      "component": "Image",
      "url": { "path": "assetURL" },
      "description": { "path": "alt" },
      "fit": "cover",
      "variant": "smallFeature"
    },
    { "id": "caption", "component": "Text", "text": { "path": "caption" } }
  ]
}
```

## Incremental updates and responses

Prefer a small state patch after an authoritative mutation:

```json
{
  "action": "update",
  "surfaceId": "plants-watering",
  "viewId": "<returned view id>",
  "expectedRevision": 4,
  "dataUpdates": [
    { "path": "/watered", "value": true },
    { "path": "/moisture", "value": "Watered just now" }
  ]
}
```

Send components only when hierarchy or available actions change. A2UI v1.0
also defines `wantResponse`/`actionResponse` and
`callFunction`/`functionResponse`; use them only when the active host/tool
explicitly exposes that request-response behavior. They do not replace normal
semantic conversation for app actions.

## Failure behavior

- Treat a successful app read followed by failed rendering as a presentation
  failure.
- Preserve the last authoritative UI if a mutation fails; explain the failure.
- On revision conflict, obtain current surface state and retry from that
  revision. Never guess.
- Never claim “shown,” “opened,” or “you can see it” before rendered delivery.
