---
name: aivault
description: Complete guide for using aivault as a zero-trust local vault and proxy for API secrets. Use this skill when initializing/configuring aivault, managing secrets and credentials, invoking capability-backed API calls, setting workspace/group isolation, adding custom providers, or troubleshooting daemon and policy issues.
---

# aivault Runtime and Integration

This skill covers secure setup and day-to-day use of `aivault` for agent workflows.

## Install

Install `aivault` if it is not already available:

```bash
curl -fsSL https://aivault.moldable.sh/install.sh | sh
```

## Quick Reference

| Resource | Path |
|----------|------|
| CLI binary | `aivault` |
| Daemon binary | `aivaultd` |
| Vault root (default) | `~/.aivault/data/vault/` |
| Daemon socket (default) | `~/.aivault/run/aivaultd.sock` |
| Registry definitions | `~/aivault/registry/*.json` |
| Registry schema | `~/aivault/registry/schemas/registry-provider.schema.json` |
| Upstream docs source | `~/aivault/docs/` |

## Default Workflow

1. Check status and provider setup:
   - `aivault status`
2. Create provider secret (auto-provisions registry credential + capabilities when names match):
   - `aivault secrets create --name OPENAI_API_KEY --value "sk-..." --scope global`
3. Inspect available capabilities:
   - `aivault capability list`
   - `aivault capability describe openai/chat-completions`
4. Invoke through policy boundary:
   - `aivault invoke openai/chat-completions --body '{"model":"gpt-5.2","messages":[{"role":"user","content":"hello"}]}'`
5. Verify audit trail:
   - `aivault audit`

## Detailed References

Read these as needed:

### Core Usage
- [references/getting-started.md](references/getting-started.md) - first-run setup and secure invocation flow
- [references/cli-reference.md](references/cli-reference.md) - command groups and practical command patterns

### Security and Isolation
- [references/security-and-isolation.md](references/security-and-isolation.md) - zero-trust properties, scope resolution, and common threat boundaries

### Provider and Capability Design
- [references/registry-custom-providers.md](references/registry-custom-providers.md) - built-in registry model, schema, and custom provider flow

### Operations and Debugging
- [references/operations.md](references/operations.md) - daemon behavior, environment flags, storage layout, and testing commands

## Essential Patterns

### 1. Registry-backed secret provisioning

Use canonical secret names (for example `OPENAI_API_KEY`) so aivault can pin to a provider and auto-enable capabilities.

### 2. Capability-first invocation

Always call `aivault invoke <capability-id>` (or `json` / `markdown`) instead of direct upstream calls with raw keys.

### 3. Scoped tenancy controls

Use `--scope workspace` and `--scope group` for tenant isolation, then pass `--workspace-id` / `--group-id` on invoke.

### 4. Custom provider fallback

Only create manual credentials and capabilities when a provider is not in the built-in registry.

## Common Mistakes to Avoid

1. Storing API keys in `.env` for untrusted agent code
2. Invoking raw URLs instead of declared capabilities
3. Forgetting scope context when debugging credential resolution
4. Assuming caller-provided auth headers are allowed (broker owns auth headers)
5. Treating custom providers as equally tamper-resistant as compiled registry providers

## Source of Truth

When behavior is unclear, verify against local docs and runtime artifacts:

- `~/aivault/docs/`
- `~/aivault/registry/`
- `~/aivault/src/`
