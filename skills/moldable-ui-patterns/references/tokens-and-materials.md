# Tokens and materials

Tokens are the shared decisions that make independently generated apps feel
related. Components consume tokens; apps compose components. An app should not
invent a parallel mini-theme.

## Token layers

Use the narrowest stable layer that expresses the design decision:

1. primitive values exist inside the UI package and are not app APIs;
2. semantic roles describe purpose, such as canvas, panel, elevated surface,
   primary text, separator, selection, destructive state, and focus;
3. component tokens specialize a semantic role for a public component;
4. app-specific values describe content, such as a chart series or user-picked
   color, and must not replace application chrome tokens.

Inspect the installed `@moldable-ai/ui/styles` before using an uncertain token.
Do not guess a CSS custom property name or depend on a private primitive token.

## Required token families

Every shared visual primitive must derive its appearance from these families:

- typography: system font stack, stable type roles, weight, line height, and
  numeric/monospace variants;
- density: compact, default, and comfortable control geometry;
- surfaces: canvas, panel, toolbar, field, selected, elevated, and overlay;
- content: primary, secondary, tertiary, disabled, link, and inverse;
- controls: rest, hover, pressed, selected, focus, disabled, read-only, invalid,
  and busy;
- shape: control, panel, window, and fully rounded radii;
- separation: subtle, standard, and strong borders or dividers;
- elevation: raised controls and transient overlays only;
- motion: fast feedback, standard transition, emphasized transition, and shared
  easing curves;
- materials: opaque and translucent surfaces with an accessible fallback;
- environment: window insets, titlebar area, bottom safe area, and active-window
  emphasis supplied by the host.

Semantic intent should survive a theme change. A dark theme is not a literal
inversion, and a translucent material must retain readable boundaries when
transparency is reduced.

## Density

Density is a coordinated mode, not a collection of unrelated `size` classes.
Changing it should affect control heights, row heights, gaps, and padding while
preserving typography, hit targets, and focus visibility.

- `compact`: dense inspectors, tables, and power-user toolbars;
- `default`: general app UI;
- `comfortable`: touch-adjacent surfaces, onboarding, and spacious canvases.

Do not mix densities within a local control group. A compact toolbar may sit
above a default-density canvas when the boundary is deliberate.

## Materials and contrast

Prefer opaque semantic surfaces. Use translucent materials only when they
communicate layering or preserve spatial context. Always provide an opaque
fallback for reduced transparency and ensure text, controls, separators, and
focus rings remain distinguishable over unpredictable content.

Use the public material roles deliberately:

- `regular`: toolbars, window chrome, menus, popovers, and grouped controls;
- `clear`: compact controls over photos, maps, video, or a richly colored
  canvas, only after checking contrast over the full background;
- `none`: an explicitly opaque or transparent composition whose parent already
  owns the surface.

Use `MaterialGroup` to give a related control cluster one sampled backdrop.
Children should be ordinary ghost or transparent controls, never nested
materials. Dialogs, sheets, forms, tables, calendars, cards, and primary
content canvases stay opaque.

Do not stack several translucent surfaces, animate blur, or add blur as
decoration. One material surface should have one clear owner. Verify reduced
transparency, increased contrast, forced colors, and reduced motion.

CSS backdrop sampling applies only inside the renderer. Behind-window material,
native window transparency, active-window appearance, and energy policy belong
to a host adapter and must not be simulated by app code.

## Adoption rule

When the same raw value appears in three or more app implementations, first ask
whether it represents a shared semantic decision. If it does:

1. add or reuse a semantic token in `@moldable-ai/ui`;
2. apply it through the relevant shared component;
3. add light, dark, compact, narrow-window, and state examples;
4. migrate callers in small, reviewable batches;
5. remove the app-local value only after compatibility is verified.

Avoid token aliases that preserve accidental app styling indefinitely.
