# Native Secure Storage

Use secure storage for small app secrets that must be retrieved locally, such as
refresh material or an encryption key. Use aivault for provider-backed network
requests; do not copy provider API secrets into app storage when proxying is
sufficient.

```typescript
import {
  deleteMoldableSecureValue,
  getMoldableSecureStorageDiagnostics,
  getMoldableSecureValue,
  listMoldableSecureValues,
  setMoldableSecureValue,
} from "@moldable-ai/ui";

const diagnostics = await getMoldableSecureStorageDiagnostics();
if (!diagnostics.available) return showSecureStorageUnavailable(diagnostics);

await setMoldableSecureValue("account.refresh-token", token);
const { value } = await getMoldableSecureValue("account.refresh-token");
const { entries } = await listMoldableSecureValues(); // metadata only
await deleteMoldableSecureValue("account.refresh-token");
```

Keys contain 1–128 ASCII letters, numbers, dots, underscores, or hyphens. Values
are strings up to 2,048 UTF-8 bytes. A missing key returns `value: null`; delete
returns whether an entry existed. Listing returns keys and created/updated
timestamps, never values.

`getMoldableSecureStorageDiagnostics()` performs a non-mutating readiness probe
and returns `available`, a generic backend name (`keychain`,
`credential-manager`, `secret-service`, or `unsupported`), and an optional
reason. It never returns an account, key, value, or platform error detail.

## Rules

- Storage is isolated by host-derived app and workspace identity.
- Never log a value, include it in an error, store it again in browser/filesystem
  storage, or send it to an unrelated endpoint.
- Keep values small and store ordinary app data in workspace-aware filesystem
  storage instead.
- Handle locked/unavailable credential stores and deletion failure explicitly.
- Deleting an app's ordinary data is not a substitute for deleting its secure
  entries; provide lifecycle cleanup where the product requires it.

The implementation uses the native credential store on macOS and Windows. Linux
is partial and requires Secret Service.
