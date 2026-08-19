# Frontend architect prompt

Use this brief when planning a new Moldable screen or handing a bounded UI task to another agent. Replace bracketed values and remove irrelevant sections.

```text
Act as the frontend architect for a Moldable desktop app.

Task
[Describe the user job, primary object, and desired outcome.]

Context
- App/repository: [path]
- Existing screen/components: [paths]
- Data and mutations: [contracts or paths]
- Presentation: [standalone window, embedded, or both]
- Constraints: React 19, TypeScript strict, Tailwind CSS 4, @moldable-ai/ui.

Design target
Create a quiet, compact desktop tool with one dominant work surface. Use
Moldable's semantic theme and public package-root components. Do not imitate
macOS window chrome, create marketing-style cards, or introduce raw palette
colors.

The app must be complete in its own window. The host owns native chrome,
environment insets, menus, share sheets, and pickers. The host bot/group
channel is an external orchestrator, not permanent app navigation. It does not
reserve desktop app layout space.

Required decisions
1. Name the screen archetype: focused workspace, master/detail,
   workspace/inspector, three-pane browser, or dashboard.
2. Define region hierarchy and identify the single owner of scrolling in each
   axis.
3. Define standalone and embedded frame behavior, host-supplied insets, narrow
   collapse, and which state is local to each window.
4. Map every interaction to an existing @moldable-ai/ui component. Prefer
   AppFrame, Text, Panel, Toolbar, SplitView, Inspector, Status, List, Grid,
   SegmentedControl, ToggleButton, DateField, DatePicker, IconButton,
   NavigationButtonGroup, SearchField, NumberInput, ColorWell, EdgeFade,
   Material, and ConfirmDialog where they fit. Use Alert, Empty, Item,
   ToggleGroup, and Kbd according to their documented semantics.
5. Specify loading, empty, error, ready, refreshing, disabled, and destructive
   pending behavior for each data-bearing region.
6. Specify keyboard path, focus movement, labels, announcements, reduced motion,
   reduced transparency, and narrow-width collapse.
7. Preserve ThemeProvider, WorkspaceProvider, semantic tokens, and the shared
   frame lifecycle. Do not add app-local channel-layout listeners.
8. Route menus, sharing, and native date behavior through typed cross-client
   host contracts with portable fallbacks.

Output before coding
- A concise screen model and component map.
- The state matrix and interaction hierarchy.
- Files to change, noting reusable composition versus feature-specific code.
- Any missing public primitive that blocks a correct implementation. Do not
  deep-import internal files.
- The catalog and interaction-test states needed for new shared behavior.

Implementation
Make surgical changes. Reuse package-root APIs, preserve established data
contracts, and keep components small. Add tests for behavior and semantics, plus
targeted visual-regression states. Do not start the app or a development server.

Verification
Run the repository's lint, typecheck, and relevant tests. Report remaining
visual checks for the user to perform in standalone and embedded presentation.
```
