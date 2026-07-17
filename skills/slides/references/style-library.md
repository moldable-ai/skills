# Style Library

The Slides and Artifacts apps ship an evolving library of **studio-grade styles** — each
a complete, fully-filled-in sample deck with its own design language, fonts,
tokens, and signature decoration. A deck's whole look comes from its style, and
every slide is composed from ONE shared component vocabulary that every style
"skins" — so switching styles re-skins existing slides automatically.

**The app is the single source of truth — don't restate it here.** The styles,
the component vocabulary, and the tokens all live in the app at
`src/shared/templates/` (`types.ts` → `COMPONENT_VOCABULARY` + `BASE_COMPONENTS_CSS`,
per-style modules under `decks/`, coding guides under `guides/`). This file would
only drift if it copied them.

## How the style reaches you (the agent)

- **When a deck is open**, the app injects that deck's full **coding guide** —
  fonts, design tokens, the complete component vocabulary, optional runtime
  conventions, and style-specific notes — into your system prompt under
  "App-Provided Context." Author from those classes and `var(--…)` tokens;
  never hardcode fonts or colors.
- **To browse or pick**, call `slides.templates.list` for the catalog
  (`{ id, name, tagline, categories, audiences, description }`) and
  `slides.templates.get { templateId }` for any style's full guide on demand.
- **The user can also pick visually** in the app's template gallery at deck
  creation.
- In Artifacts, use `artifacts.templates.list/get` and `artifacts.applyTemplate`.
  Page and deck templates share the catalog; check each template's `kind`.
- Template detail includes `runtime` when a deck sample has working behavior.
  Preserve it when cloning or adapting that template.

## Choosing a style

Match the style to the use case rather than memorizing ids — `templates.list`
returns `audiences`/`categories` to filter on. Rough map:

- founders / fundraising → `bold-founder`, `seed-pitch`
- finance / board / investors → `finance-pro`, `executive-review`, `investor-update`
- PM / product → `product-brief`, `sprint-review`, `okr-review`
- consulting / strategy → `consulting`, `clean-minimal`, `strategy-framework`
- teaching / workshops → `classroom`, `seminar`, `course-curriculum`, `workshop`
- design / brand / keynote → `editorial`, `brand-guidelines`, `portfolio`, `moodboard`
- developer / technical → `dark-tech`
- science / research → `research`, `data-dashboard`, `market-analysis`
- creative / community → `pastel-creative`, `risograph`, `flat-illustration`, `isometric`

When unsure, ask, or create with a strong style and let the user react to the
live preview. Switching later is one call: `slides.decks.applyTemplate { id, templateId }`.

## Authoring within the vocabulary

The injected guide lists the full class kit (layout `.pad`/`.two-col`/`.cols-*`,
type `.kicker`/`.display`/`.title`/`.headline`/`.lead`, lists, cards, metrics,
tables, CSS charts `.donut`/`.bars`, diagrams `.flow`/`.timeline`, image layouts
`.split`/`.hero`/`.full-bleed`, `.quote`, `.section`, `.runner`, …). Compose from
it and stay on-brand. Only write bespoke CSS when a slide genuinely needs
something outside the kit — bespoke slides won't auto-re-skin when the style
changes, so prefer the vocabulary. See [authoring-contract.md](authoring-contract.md).

`data-dashboard` is also the reference for an interactive template: filters,
sorting, a scenario calculator, and staged results implemented through the
optional deck runtime. When reviewing or creating interactive templates, use
[interactive-runtime.md](interactive-runtime.md) as the contract.
