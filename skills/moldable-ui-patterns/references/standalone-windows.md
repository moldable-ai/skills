# Standalone windows

Moldable apps should feel complete when opened as independent tools. The system
can present several apps at once while the host bot/group channel remains an
external orchestrator rather than permanent in-app chrome.

## Ownership boundary

The host owns:

- the native title bar, traffic lights, close/minimize/full-screen behavior;
- window activation, resize, restore, placement, and persistence;
- system menus, command routing, share sheets, file panels, and native pickers;
- environment insets and capability availability;
- workspace identity and app/window lifecycle.

The app owns:

- its title, local navigation, toolbar, content canvas, inspector, and status;
- application commands and command enabled states;
- focus restoration within its content;
- responsive collapse below the host-provided safe region.

Never draw replacement traffic lights or reserve a guessed fixed inset.

## Shared frame

Prefer the shared frame composition:

```tsx
<AppFrame>
  <AppFrameTitlebar>
    <AppFrameToolbar>
      <Text variant="strong">Calendar</Text>
      {/* app commands */}
    </AppFrameToolbar>
  </AppFrameTitlebar>
  <AppFrameContent>{/* primary canvas */}</AppFrameContent>
  <AppFrameStatusbar>{/* optional persistent status */}</AppFrameStatusbar>
</AppFrame>
```

Treat the exact public API as authoritative. The host supplies environment
values through the supported frame contract and CSS tokens. The frame should
also remain valid when those values are absent, such as a browser preview.

Use the titlebar region for app identity and draggable empty space only when the
host contract marks it safe. Interactive descendants must not become drag
regions.

Use regular adaptive material for titlebar or toolbar control chrome when it
helps preserve spatial context. Keep the working canvas opaque. CSS material
does not create behind-window material; a native adapter must own that
capability, window activation treatment, and energy policy.

## Standalone and embedded presentation

Build one app hierarchy that adapts to both presentations.

| Concern | Standalone window | Embedded view |
| --- | --- | --- |
| Global navigation | External to the app | Provided by the desktop |
| Host channel panel | Separate orchestrator surface | May overlap using a host safe area |
| Top inset | Host-supplied window value | Usually zero or host-supplied |
| Title | App-owned, within the safe region | May collapse when host context is clear |
| Bottom tools | App-owned status/tool region | Use ordinary window/mobile-safe spacing |

Do not fork the whole UI tree for each presentation. Adapt frame regions and
optional chrome while preserving the same commands, selection, and content.

## Multiwindow behavior

Each window needs a clear primary object and independent focus/selection state.
Do not assume the app is the only open surface, or that a global singleton owns
the current document. Commands should resolve against the active window's
context.

UI state such as pane widths can be window-scoped. Durable content and workspace
data remain behind shared application contracts. A visual component should not
invent its own cross-window synchronization protocol.

## Portable native capabilities

Expose a typed app-level command such as `shareDocument`, `openAppMenu`, or
`chooseDate` only after that command exists in the shared host capability
contract. The React component receives advertised availability, pending state,
result, and callbacks. It does not import a Tauri, Swift, or browser bridge
directly.

Always define a portable fallback or an explicit unavailable state. Capability
differences must not silently remove the only route to a task.

## Review checklist

- Open the layout mentally with no surrounding desktop chrome.
- Verify no simulated window controls are present.
- Resize from narrow utility width to a large canvas.
- Check inactive-window and reduced-transparency treatment.
- Verify titlebar drag regions exclude controls.
- Confirm focus and selection are window-local.
- Confirm embedded chat spacing comes from the shared lifecycle.
- Confirm native commands use host contracts and have fallbacks.
