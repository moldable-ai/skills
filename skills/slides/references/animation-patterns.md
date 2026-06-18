# Animation & Background Patterns

The Slides app already owns deck motion: per-slide enter transitions
(`fade`/`slide`/`zoom`, set via each slide's `transition`) and the `.reveal`
staggered entrance (add `class="reveal"` to elements; direct children cascade
automatically, `prefers-reduced-motion` handled). You do **not** wire up scroll
observers, `.visible` toggles, or stage JS — the controller does that.

So this file is just taste: match the *feeling* to the deck, and reach for
bespoke CSS only when the built-in reveal isn't enough. Keep all motion CSS-only.

## Effect → feeling

| Feeling | Motion | Visual cues |
|---------|--------|-------------|
| **Dramatic / cinematic** | Slow fades (0.8–1.2s), gentle scale (0.92→1) | Dark grounds, full-bleed image + scrim, one big line |
| **Techy / futuristic** | Quick reveals, subtle glow, grid wipes | Mono accents, grid/scanline patterns, cyan/magenta on near-black |
| **Playful / friendly** | Springy ease, slight overshoot, bob | Rounded shapes, bright/pastel, generous color |
| **Professional / corporate** | Fast, restrained (200–350ms), uniform | Navy/slate/charcoal, precise spacing, data-forward |
| **Calm / minimal** | Very slow, low-amplitude fades | High whitespace, muted palette, serif type |
| **Editorial / magazine** | Staggered text reveals, image↔text interplay | Strong type hierarchy, pull quotes, grid-breaking layout |

## Bespoke reveal variants (only if the default cascade isn't enough)

```css
/* The app's default .reveal is fade + rise. To vary one slide, author a
   custom class and animate on the .slide.visible state the app sets. */
.slide.visible .reveal-scale { animation: revealScale 0.6s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes revealScale { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }

.slide.visible .reveal-blur { animation: revealBlur 0.8s ease both; }
@keyframes revealBlur { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: none; } }
```

## CSS-only background decoration (no files needed)

```css
/* Layered radial gradients for depth */
.grad-mesh {
  background:
    radial-gradient(ellipse at 20% 80%, color-mix(in oklab, var(--accent) 30%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, color-mix(in oklab, var(--accent-2, var(--accent)) 22%, transparent) 0%, transparent 50%),
    var(--bg);
}

/* Subtle structural grid */
.grid-bg {
  background-image:
    linear-gradient(color-mix(in oklab, var(--text) 4%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--text) 4%, transparent) 1px, transparent 1px);
  background-size: 64px 64px;
}
```

Author background sizes in fixed pixels at the 1920×1080 stage scale (see the
authoring contract). Negate CSS functions with `calc(-1 * clamp(...))`, never a
bare leading `-`.
