# Native Local Authentication

Local authentication verifies the current device user before a sensitive local
action. It does not identify a remote account and returns no biometric data.

```typescript
import {
  authenticateMoldableLocalUser,
  getMoldableLocalAuthenticationAvailability,
} from "@moldable-ai/ui";

const availability = await getMoldableLocalAuthenticationAvailability();
if (!availability.available) return showFallback();

const result = await authenticateMoldableLocalUser(
  "Approve revealing the recovery phrase",
  { policy: "biometric-only" },
);
if (result.outcome === "authenticated") revealRecoveryPhrase();
```

Availability reports `available`, a `biometric`, `device-credential`, or
`unknown` method, and an optional reason. Authentication outcomes are
`authenticated`, `cancelled`, `failed`, `locked-out`, or `unavailable`; bridge
failures reject separately.

Authentication policy is explicit:

- `device-owner` is the backward-compatible default and allows any
  operating-system-approved device-owner method. A successful result reports
  method `device-owner` because macOS does not disclose whether biometrics or a
  device credential completed that policy.
- `biometric-only` requires enrolled biometrics and reports method `biometric`
  on success. It does not fall back to a device password.

## Rules

- Call from a visible, direct user action.
- Write a short, specific reason. It must contain 1–160 UTF-8 bytes and no
  control characters; the host attributes the prompt to the caller app.
- Never put a secret, token, account number, or untrusted text in the reason.
- Treat cancellation as neutral. Avoid loops, automatic retries, or lockout
  pressure.
- Keep an appropriate fallback for unavailable/unenrolled devices.

macOS is supported. Windows Hello is preview/partial pending packaged hardware
validation. Linux is unsupported.
