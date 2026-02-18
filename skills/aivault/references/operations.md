# Operations

This reference is adapted from:
- `~/aivault/docs/ops/daemon.md`
- `~/aivault/docs/ops/environment.md`
- `~/aivault/docs/ops/storage.md`
- `~/aivault/docs/ops/testing.md`

## Daemon behavior

On macOS/Linux, `aivault invoke` uses `aivaultd` over a unix socket by default.

Default socket:
- `~/.aivault/run/aivaultd.sock`
- If `AIVAULT_DIR` is set: `$AIVAULT_DIR/run/aivaultd.sock`

Manual run modes:

```bash
aivaultd
aivaultd --socket ~/.aivault/run/aivaultd.sock
aivaultd --shared
aivaultd --once
```

### Shared socket mode

For cross-user local setups:
- macOS shared socket: `/Users/Shared/aivault/run/aivaultd.sock`
- Linux shared socket: `/var/run/aivault/aivaultd.sock`

## Key environment variables

Vault:
- `AIVAULT_DIR`
- `AIVAULT_KEY`
- `AIVAULT_DISABLE_DISK_LOGS`

Daemon:
- `AIVAULTD_DISABLE`
- `AIVAULTD_AUTOSTART`
- `AIVAULTD_AUTOSTART_ONCE`
- `AIVAULTD_SOCKET`
- `AIVAULTD_SOCKET_MODE`
- `AIVAULTD_SOCKET_DIR_MODE`

Dev/test only:
- `AIVAULT_DEV_RESOLVE`
- `AIVAULT_DEV_CA_CERT_PATH`
- `AIVAULT_DEV_ALLOW_NON_DEFAULT_PORTS`
- `AIVAULT_DEV_HTTP1_ONLY`
- `AIVAULT_DEV_ALLOW_HTTP_LOCAL`
- `AIVAULT_DEV_ALLOW_REMOTE_CLIENTS`
- `AIVAULT_DEV_FORCE_DEFAULT_FILE_PROVIDER`
- `AIVAULT_E2E_NETWORK`

Release builds fail closed if forbidden dev-only escape hatches are set.

## Storage layout

Default vault root:

```text
~/.aivault/data/vault/
```

Layout:

```text
vault.json
broker.json
capabilities.json
secrets/<secret-id>.json
audit/events-<date>.jsonl
```

File-provider key material:
- Canonical install: `~/.aivault/keys/kek.key`
- With `AIVAULT_DIR`: `$AIVAULT_DIR/kek.key`

Backing up a file-provider vault requires both vault data and key file.

## Testing commands

```bash
cargo clippy --all-targets --all-features -- -D warnings
cargo check
cargo fmt
cargo test --all-targets --all-features
```

Targeted tests:

```bash
cargo test --test e2e_cli_local
cargo test --test e2e_cli_local_tls
cargo test --test e2e_daemon
AIVAULT_E2E_NETWORK=1 cargo test --test e2e_cli_invoke
```

