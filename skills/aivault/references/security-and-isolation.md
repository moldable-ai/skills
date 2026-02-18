# Security and Isolation

This reference is adapted from:
- `~/aivault/docs/core/security-model.md`
- `~/aivault/docs/core/scopes-and-isolation.md`

## Zero-trust guarantees

1. Secrets never leave vault plaintext; decryption occurs only for broker-owned auth injection.
2. Registry secret names are pinned immutably to their provider (for example `OPENAI_API_KEY` -> `openai`).
3. Host is derived from capability policy, not caller-provided URL.
4. Auth-class headers are broker-owned; caller overrides are rejected.
5. Path traversal is normalized and blocked.
6. Redirect auth stripping prevents cross-host leakage.
7. Localhost-only client boundary is default.
8. Auth-class response headers are stripped before returning to caller.

## Threats covered

- Env-var and `.env` exfiltration by untrusted code
- Host-swap / SSRF through forged request targets
- Header injection of stolen credentials
- Redirect-based credential leaks
- Cross-tenant accidental secret reuse (with correct scoping)

## Threats not covered

- Compromised host OS or root-level attacker
- Compromised key provider (Keychain/env/file/passphrase handling)
- Upstream provider compromise
- Authorized but malicious use within permitted capability boundaries

## Scope model

Supported scopes:
- `global`
- `workspace` (requires `--workspace-id`)
- `group` (requires `--workspace-id` + `--group-id`)

Resolution order during invoke:

1. Group-scoped credential
2. Workspace-scoped credential
3. Global credential

This enables specific overrides over shared defaults.

## Scoped examples

```bash
# workspace scoped
aivault secrets create --name OPENAI_API_KEY --value "..." \
  --scope workspace --workspace-id my-workspace

# group scoped
aivault secrets create --name OPENAI_API_KEY --value "..." \
  --scope group --workspace-id my-workspace --group-id my-group

# invoke with context
aivault invoke openai/chat-completions \
  --workspace-id my-workspace \
  --group-id my-group \
  --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
```

Attach and detach group mapping:

```bash
aivault secrets attach-group --id <secret-id> --workspace-id my-workspace --group-id my-group
aivault secrets detach-group --id <secret-id> --workspace-id my-workspace --group-id my-group
```

