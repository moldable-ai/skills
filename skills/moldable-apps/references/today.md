# Today contribution

Moldable's home screen is the **Today** view (host-rendered). An app participates in the home by
implementing a single HTTP route that returns what (if anything) needs the user right now.

The golden rule: **silence is the default.** Most of the time most apps return nothing. A card
appears only when it genuinely earns attention.

## The endpoint

```ts
// src/server/app.ts
app.get('/api/moldable/today', async (c) => {
  const workspaceId = getWorkspaceFromRequest(c.req.raw)
  const items: unknown[] = []   // push only when something earns attention
  let resume: unknown = null    // "pick up where you left off", or null
  // ...read your own state, decide...
  return c.json({ items, resume, generatedAt: new Date().toISOString() })
})
```

Return shape: `{ items: TodayItem[], resume?: ResumeState | null, generatedAt: string }`.
Build plain objects — do **not** import shared types.

### TodayItem

| field         | notes                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `id`          | stable per logical item (e.g. `git:unpushed`) — used for dedupe/dismiss |
| `kind`        | see kinds below — drives ranking, styling, decay                      |
| `surface`     | `text` (default) · `nudge` · `metric` · `widget`                      |
| `title`       | one scannable line — **lead with the thing**, no "Resume"/"Continue" prefix |
| `subtitle`    | optional second line; omit filler that echoes the section header      |
| `icon`        | emoji (falls back to the app icon)                                    |
| `priority`    | 0–100 hint; the host has final say                                    |
| `dismissible` | default `true`; set `false` for must-not-miss live items              |
| `actions`     | ordered; first is primary (see actions below)                         |

**Kinds** (`why` it earns attention):

- `resume` — pick up where you left off (the dominant pattern; usually return as `resume`)
- `active` — something the user started is running now (priority ~90, `dismissible: false`)
- `blocked` — failed / needs unblocking (priority ~95)
- `timely` — imminent / time-sensitive
- `threshold` — a count or limit crossed that signals a problem (unread > 5, ≥ 1 unpushed, WIP > limit)
- `milestone` — a low-priority win (opt-in feel)
- `agent-activity` — an agent did work for you while you were away

### Actions

```ts
{ type: 'open-app', label, deepLink? }            // open the app (deep-link to an entity)
{ type: 'rpc', label, method, params?, confirm? } // call THIS app's own /api/moldable/rpc method in place
{ type: 'message', label, prompt }                // load the unified chat with a prompt to act / interrogate
{ type: 'navigate', label, path }                 // open the app at a path
```

Pick the **richest** action available:

- The app can do it in place → `rpc` calling a real method from your `/api/moldable/rpc` handler.
- It needs reasoning / multiple steps → `message` that loads the chat with a **specific** prompt
  (include the actual offending details). End such prompts with: _"When you're done, refresh the
  home view by calling the Moldable app API with targetAppId "today" and method "today.refresh"."_
- Otherwise → `open-app` (use `deepLink` so it lands on the right entity).

### ResumeState

```ts
{ title, subtitle?, icon?, deepLink?, lastTouchedAt? }  // lastTouchedAt is ISO
```

`resume` powers the "Pick up where you left off" rail. Point it at **genuine in-progress work**
(an unfinished draft, a dirty repo, a started-but-incomplete entry) — not just the most recent
item if that's a clean/empty/no-op state. Always set `lastTouchedAt` when you can; the rail sorts
by it across apps.

## Signal > noise

- Quiet by default; emit nothing when nothing needs the user.
- Every item is **actionable or a resume** — never a bare count with no call-to-action.
- Cap your own output to ~1–2 items; prefer **one summary** over a list.
- Never mirror an always-on overview: no permanent lists, recent-item dumps, empty-state nags,
  routine-success celebrations, stale (> 24h) events, or sync/meta noise.

## Examples (shipped)

- **git-flow** — repos with **uncommitted changes** are the real WIP: the most-recent dirty repo
  is the `resume` (`"repo · branch"`, subtitle `"3 uncommitted changes"`, `deepLink` to its path),
  other dirty repos are items, plus an unpushed-commits nudge. Silent when everything is clean.
- **wiki** — broken links → a `message` action whose prompt lists the actual broken links and ends
  with the `today.refresh` instruction (+ a secondary "Open Wiki"). Silent when the vault is healthy.
- **time-tracker** — a running timer is an `active` card (`dismissible: false`) with an
  `rpc` `time.timer.stop` action; otherwise a `resume` to the last project.

## How refreshes happen

The host **pulls** `/api/moldable/today` from every app and re-queries on: first paint, a short
ramp after launch (apps boot asynchronously), a periodic poll, app-lifecycle `running` events, and
the `today.refresh` signal the chat (or an app) can fire after changing data. You don't push — you
just answer accurately whenever asked, and keep it cheap (read your own state, no heavy work).
