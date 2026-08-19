# App shell and layout

## Contents

- [Choose one archetype](#choose-one-archetype)
- [Presentation modes](#presentation-modes)
- [Shell invariants](#shell-invariants)
- [Toolbar](#toolbar)
- [Split views](#split-views)
- [Inspector](#inspector)
- [Lists and navigation](#lists-and-navigation)
- [Bottom clearance](#bottom-clearance)
- [Responsive collapse](#responsive-collapse)

## Choose one archetype

Use the smallest structure that supports the task.

| Archetype           | Structure                        | Best for                                     |
| ------------------- | -------------------------------- | -------------------------------------------- |
| Focused workspace   | toolbar + one scroll region      | editors, reports, single-object tools        |
| Master/detail       | list pane + detail pane          | files, tasks, recordings, contacts           |
| Workspace/inspector | primary canvas + inspector       | configurable objects, visual tools           |
| Three-pane browser  | navigation + collection + detail | information-dense libraries                  |
| Dashboard           | toolbar + bounded sections       | monitoring and overview, not primary editing |

Do not add a sidebar or inspector without distinct content that must remain visible while the center changes.

## Presentation modes

Design the hierarchy standalone-first: the app may occupy an independent native
window with no surrounding Moldable navigation. Embedded presentation can
collapse redundant identity and receives ordinary window insets from the host.

Use `AppFrame`, `AppFrameTitlebar`, `AppFrameToolbar`, `AppFrameContent`, and
`AppFrameStatusbar` for shared frame ownership when their public API matches the
task. Read [standalone-windows.md](standalone-windows.md) before adding custom
window-aware layout.

Titlebars, status bars, and default toolbars may use `material="regular"`.
Reserve `clear` for small controls over media, and pass `material="none"` when
the composition deliberately owns an opaque surface. Do not make the primary
content region translucent.

## Shell invariants

The outer app shell should fill its host, consume host-provided environment
insets, and prevent body scrolling:

```tsx
<AppFrame>
  <AppFrameTitlebar>
    <AppFrameToolbar>
      <Text variant="strong">Sessions</Text>
      {/* context and actions */}
    </AppFrameToolbar>
  </AppFrameTitlebar>
  <AppFrameContent>
    <PanelGroup>{/* one layout archetype */}</PanelGroup>
  </AppFrameContent>
</AppFrame>
```

Every flex or grid ancestor above a scroll region needs `min-h-0`; horizontal panes also need `min-w-0`. Give overflow to the content region that owns it, not several nested ancestors.

## Toolbar

Use a toolbar to anchor title, context, and top-level actions:

```tsx
<Toolbar position="top">
  <ToolbarContent>
    <ToolbarTitle>Sessions</ToolbarTitle>
    <ToolbarDescription>Personal workspace</ToolbarDescription>
  </ToolbarContent>
  <ToolbarActions>
    <Button size="sm">New session</Button>
  </ToolbarActions>
</Toolbar>
```

Keep global actions at the trailing edge. Put object-specific actions beside the object or in its contextual menu.

## Split views

Use `SplitView` when panes benefit from user-controlled sizing:

```tsx
<SplitView orientation="horizontal" className="h-full min-h-0">
  <SplitViewPane>{/* collection */}</SplitViewPane>
  <SplitViewHandle />
  <SplitViewPane>{/* detail */}</SplitViewPane>
</SplitView>
```

Set sensible panel minimums when the exact API is known. Collapse optional panes through an explicit command; do not squeeze them below usable widths.

Use ordinary CSS grid when resizing provides no value.

## Inspector

Use an inspector for properties of the current selection:

```tsx
<Inspector>
  <InspectorHeader>
    <Text variant="strong">Properties</Text>
  </InspectorHeader>
  <InspectorContent>
    <InspectorSection title="Appearance">
      <InspectorRow>
        <InspectorLabel htmlFor="opacity">Opacity</InspectorLabel>
        <InspectorValue>
          <NumberInput id="opacity" min={0} max={100} unit="%" />
        </InspectorValue>
      </InspectorRow>
    </InspectorSection>
  </InspectorContent>
</Inspector>
```

An inspector describes the selected object. It is not a dumping ground for unrelated settings or primary workflows.

## Lists and navigation

Use `List`/`ListItem` for keyboard-aware selectable rows and `Grid`/`GridItem`
for spatial collections. Use `Item` for a compact presentational row without
collection-level selection. Use `ScrollArea` only when custom scrolling behavior
is valuable. Choose `scrollbars`, `viewportClassName`, and `safeBottom`
deliberately; only the owning scroll region should consume safe-bottom spacing.
Keep selection visibly persistent. Put counts and status after the label, not
before it. Use one row action affordance; move secondary actions into a menu.

`Sidebar` is appropriate for app-owned navigation with enough durable
destinations. Do not reproduce global host navigation in either presentation.

## Bottom clearance

The Moldable host channel panel may overlap the embedded view, but desktop
currently reserves no layout space for it: `--chat-safe-padding` is `0px` in
every channel state. Prefer `AppFrameContent`, which consumes ordinary host
window insets. Do not add a custom desktop channel offset.

Shared primitives can retain the token to be safe on mobile web, where it maps
to bottom clearance. For a custom mobile-safe scroll region, use it once:

```tsx
<div className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--chat-safe-padding,0px)+1rem)]">
  {/* content */}
</div>
```

Do not add the padding to the whole shell or to multiple nested scroll containers.
Do not install an app-local `window.message` listener. The shared lifecycle owns
host event validation, initial state, updates, and cleanup.

## Responsive collapse

At narrow widths:

1. preserve the primary work surface;
2. hide or sheet the inspector;
3. replace persistent navigation with a disclosure;
4. keep the primary action visible;
5. allow toolbar titles to truncate before actions collapse.

Treat responsiveness as prioritization, not proportional shrinking.
