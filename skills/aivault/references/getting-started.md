# Getting Started

This reference is adapted from `~/aivault/docs/getting-started.md`.

## Prerequisites

- `aivault` is installed and available on `PATH`
- On macOS/Linux, `aivaultd` is installed too (used by `invoke` by default)
- You have at least one provider API key

If `aivaultd` is not installed, use `AIVAULTD_DISABLE=1` to run in-process.

## 1) Check vault status

```bash
aivault status
```

Auto-init defaults:
- macOS: Keychain provider
- Other platforms: file provider

For explicit passphrase setup:

```bash
aivault init --provider passphrase --passphrase "your-passphrase"
```

## 2) Create your first secret

```bash
aivault secrets create \
  --name OPENAI_API_KEY \
  --value "sk-..." \
  --scope global
```

If secret name matches a built-in registry provider, aivault:

1. Pins secret to that provider
2. Auto-provisions credential
3. Enables registry capabilities

## 3) Inspect capabilities

```bash
aivault capability list
aivault capability describe openai/chat-completions
```

## 4) Invoke through broker

```bash
aivault invoke openai/chat-completions \
  --method POST \
  --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
```

Structured output variants:

```bash
aivault json openai/chat-completions --method POST --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
aivault markdown openai/chat-completions --method POST --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'
```

## 5) Verify and audit

```bash
aivault secrets list
aivault audit
```

`secrets list` never prints secret values.

## Test isolation mode

```bash
export AIVAULT_DIR="$(mktemp -d)"
aivault status
```

Use this for temporary local testing without touching real vault data.

