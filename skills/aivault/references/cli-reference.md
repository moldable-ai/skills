# CLI Reference

This reference is adapted from:
- `~/aivault/docs/cli/index.md`
- `~/aivault/docs/cli/vault-lifecycle.md`
- `~/aivault/docs/cli/secrets.md`
- `~/aivault/docs/cli/capabilities.md`
- `~/aivault/docs/cli/invoke.md`

## Command groups

- Vault lifecycle: `status`, `init`, `unlock`, `lock`, `rotate-master`, `audit`
- Secrets: `secrets create|list|update|rotate|delete|import`
- Credentials: `credential create|list|delete`
- Capabilities: `capability list|describe|create|delete|policy set|bind|unbind|bindings`
- Invoke: `invoke`, `json`, `markdown`
- OAuth: `oauth setup`

Top-level aliases:

- `aivault invoke <id>` = `aivault capability invoke <id>`
- `aivault json <id>` = `aivault capability json <id>`
- `aivault markdown <id>` = `aivault capability markdown <id>`
- `aivault md <id>` = markdown alias

## Vault lifecycle

```bash
aivault status
aivault init --provider macos-keychain
aivault init --provider passphrase --passphrase "..."
aivault unlock --passphrase "..."
aivault lock
aivault rotate-master --new-passphrase "..."
aivault audit --limit 50
```

## Secrets

```bash
aivault secrets list
aivault secrets list --scope workspace --workspace-id my-workspace

aivault secrets create --name OPENAI_API_KEY --value "sk-..." --scope global
aivault secrets create --name MY_CUSTOM_KEY --value "..." --scope global

aivault secrets update --id <secret-id> --alias my-alias
aivault secrets rotate --id <secret-id> --value "new-value"
aivault secrets delete --id <secret-id>

aivault secrets import \
  --entry OPENAI_API_KEY=sk-... \
  --entry ANTHROPIC_API_KEY=sk-ant-... \
  --scope global
```

## Capabilities

```bash
aivault capability list
aivault capability describe openai/chat-completions

aivault capability create my-api/users \
  --provider my-api \
  --credential my-api \
  --method GET \
  --path /v1/users \
  --host api.example.com

aivault capability policy set \
  --capability openai/chat-completions \
  --rate-limit-per-minute 60 \
  --max-request-body-bytes 1048576 \
  --max-response-body-bytes 10485760 \
  --response-block api_key
```

Binding commands (usually automatic for registry-backed providers):

```bash
aivault capability bind --capability openai/chat-completions --secret-ref vault:secret:<id> --scope global
aivault capability unbind --capability openai/chat-completions
aivault capability bindings --capability openai/chat-completions
```

## Invoke

```bash
aivault invoke openai/chat-completions --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
aivault invoke openai/transcription --multipart-field model=whisper-1 --multipart-file file=/tmp/audio.wav

aivault json openai/chat-completions --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
aivault markdown openai/chat-completions --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
```

Important invoke options:
- `--method`, `--path`
- `--header`
- `--body`, `--body-file-path`
- `--request`, `--request-file`
- `--multipart-field`, `--multipart-file`
- `--credential`
- `--workspace-id`, `--group-id`
- `--client-ip`

Upstream auth-class response headers are stripped in all output modes.

