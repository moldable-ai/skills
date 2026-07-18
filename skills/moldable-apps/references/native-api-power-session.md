# Native Power and Session State

Use the power/session helpers for adaptive work, inactivity UI, explicit
lock/suspend reactions, and short-lived sleep prevention.

Runtime capability IDs are `power-monitor` for state, idle, thermal, and event
helpers, and `sleep-blocker` for blocker helpers.

```typescript
import {
  getMoldableCurrentThermalState,
  getMoldablePowerState,
  getMoldableSystemIdleState,
  startMoldableSleepBlocker,
  watchMoldablePowerSession,
} from '@moldable-ai/ui'

const power = await getMoldablePowerState()
const thermalState = await getMoldableCurrentThermalState()
const idle = await getMoldableSystemIdleState(300)

const stopWatching = await watchMoldablePowerSession((event) => {
  if (event.kind === 'lock' || event.kind === 'suspend') pauseSensitiveWork()
})

const blocker = await startMoldableSleepBlocker('prevent-app-suspension')
try {
  if (!(await blocker.isStarted()))
    throw new Error('Sleep blocker was released')
  await finishUserRequestedExport()
} finally {
  await blocker.stop()
  await stopWatching()
}
```

## API shape

- `getMoldablePowerState()` returns `source` and zero or more battery records.
- `getMoldableCurrentThermalState()` returns `nominal`, `fair`, `serious`,
  `critical`, or `unknown` on macOS.
- `getMoldableSystemIdleState(thresholdSeconds)` returns seconds plus
  `active`, `idle`, or `locked`; `getMoldableSystemIdleTime()` returns seconds.
- `watchMoldablePowerSession()` subscribes to supported `suspend`, `resume`,
  `lock`, `unlock`, `session-active`, `session-inactive`, `shutdown`,
  `thermal-state-change`, and `power-source-change` events and resolves to an
  async cleanup function. Thermal events are currently macOS-only.
- A `speed-limit-change` event is not available in the macOS release because
  macOS does not provide a stable, supported signal for that value. Do not
  infer or synthesize one from thermal state.
- `startMoldableSleepBlocker()` accepts `prevent-app-suspension` or
  `prevent-display-sleep`; `blocker.isStarted()` queries host-owned state and
  `stopMoldableSleepBlocker()` is the functional stop form.

## Rules

- Subscribe only while events affect visible product behavior.
- Treat missed events and partial Windows/Linux session coverage defensively;
  re-read state after resume/focus.
- Start a blocker only for an active user-requested operation, show why it is
  active, and stop it in `finally`.
- Never use idle state for covert presence tracking or employee monitoring.
