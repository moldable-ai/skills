# Scheduled work

### Scheduled agent work

The desktop UI calls this area **Scheduled**; its tools and internal data model
use the term **automation**. Chat can create and manage Scheduled work with
first-class automation tools. Use those tools instead of creating an app,
editing `automations.json`, or configuring OS cron. Scheduled work is scoped to
one workspace and runs only while the Moldable desktop is open.

Choose exactly one creation tool from the user's scheduling intent; their input
schemas are strict:

- `createRelativeAutomation` — run once after a relative delay in seconds,
  minutes, hours, days, or weeks.
- `createOneTimeAutomation` — run once at a local `YYYY-MM-DD` date and `HH:mm`
  time.
- `createDailyAutomation` — run every day at a local time.
- `createRecurringAutomation` — run daily, on weekdays, weekly, monthly, or
  yearly at a local time.
- `createIntervalAutomation` — run every N seconds, minutes, hours, days, weeks,
  months, or years.
- `createCronAutomation` — use only when the user explicitly asks for a cron
  expression; prefer the structured tools otherwise.

For `createRecurringAutomation`, supply `weekdays` as 0–6 (0 is Sunday) for a
weekly recurrence, `dayOfMonth` for monthly, and both `dayOfMonth` and
`monthOfYear` for yearly. Sub-day intervals keep a UTC cadence; day-or-longer
intervals preserve local wall-clock time across timezone changes.

For every creation:

1. Provide a short `name`, a self-contained `prompt`, and the user's IANA
   `timezone`. Let the runtime resolve concrete timestamps; never calculate UTC
   or the next run yourself.
2. Make the prompt describe the source apps, filters, desired result or
   mutation, and what should count as useful output. Scheduled runs are
   independent agent runs and must not depend on unstated chat context.
3. For work involving app data, call `listMoldableAppApi` for the relevant apps
   before creating the automation. Declare every target in `appAccess` using
   exact returned method/scope IDs, with `read` unless a requested mutation
   requires `write`. Never guess scopes or read another app's data directory.
4. Keep `includeSuccessesInToday` false unless the user explicitly wants every
   successful run shown. The default keeps routine results quiet while blocked
   or failed work can still surface in Today.
5. If the user wants a bot or group to receive the result, provide that
   workspace's exact `channelId`. The automation posts a durable outcome there
   and wakes the recipient to handle useful follow-up; it may remain quiet when
   no response is warranted. Omit `channelId` for Today/history-only delivery.
   Do not infer an ID from a bot or group name.
6. Use `maxRuns` for a bounded series. Omit it for an unbounded recurring
   schedule.
7. After creation, quote the returned `schedule.confirmationText`; do not
   reinterpret or recompute the schedule.

Creating or updating `appAccess` grants those declared scopes to the
workspace-scoped `moldable-automations` caller. Unattended runs cannot broaden
their own access. If a run reports a missing app API scope, verify the scope
with `listMoldableAppApi`, then use `updateAutomation` only when the user has
authorized that access.

Use `listAutomations` and `getAutomation` to resolve an existing item before
acting. Use `updateAutomation` for its name, prompt, app access, Today policy,
or report channel; use `channelId: null` to return to Today/history-only
delivery. Use `toggleAutomation` to pause or resume it; `runAutomationNow` for
an immediate run; and `deleteAutomation` to remove it. Updating an automation
does not change its schedule: create and verify a replacement schedule first,
then delete the old automation only when the user's request clearly authorizes
replacement.

