# Registry and Custom Providers

This reference is adapted from:
- `~/aivault/docs/registry/index.md`
- `~/aivault/docs/registry/custom-providers.md`
- `~/aivault/docs/registry/schema.md`
- `~/aivault/docs/core/auth-strategies.md`

## Built-in registry model

The built-in registry ships provider definitions compiled into the binary.

When `secrets create --name <CANONICAL_NAME>` matches `vaultSecrets`:

1. Secret is pinned to provider
2. Credential is auto-provisioned
3. Provider capabilities are enabled

Example pattern:

```json
{
  "provider": "openai",
  "vaultSecrets": {
    "OPENAI_API_KEY": "secret"
  }
}
```

## Registry security benefits

- Compiled provider definitions (runtime tamper resistance)
- Immutable secret pinning
- Host allow-lists and scoped method/path prefixes

## Schema essentials

Each provider JSON in `~/aivault/registry/` should define:

- `provider`
- `vaultSecrets` (optional)
- `auth`
- `hosts`
- `capabilities`

Capability shape:

```json
{
  "id": "provider/capability-name",
  "provider": "provider",
  "allow": {
    "hosts": ["api.example.com"],
    "methods": ["GET", "POST"],
    "pathPrefixes": ["/v1/resource"]
  }
}
```

## Auth strategy options

Supported auth models include:
- `header`
- `query`
- `path`
- `basic`
- `multi_header`
- `multi_query`
- `o_auth2`
- `aws_sig_v4`
- `hmac`
- `mtls`

Use registry-backed configuration when available. For custom providers, configure via `credential create` flags.

## Custom provider flow

Use this only when provider is missing from registry.

1. Create an unpinned custom secret:

```bash
aivault secrets create --name MY_CUSTOM_KEY --value "..." --scope global
```

2. Create credential:

```bash
aivault credential create my-api \
  --provider my-api \
  --secret-ref vault:secret:<secret-id> \
  --auth header \
  --header-name authorization \
  --value-template "Bearer {{secret}}" \
  --host api.example.com
```

3. Create capabilities:

```bash
aivault capability create my-api/users \
  --provider my-api \
  --credential my-api \
  --method GET \
  --method POST \
  --path /v1/users \
  --host api.example.com
```

4. Invoke:

```bash
aivault invoke my-api/users --method GET
```

Custom providers are operationally useful but less tamper-resistant than compiled registry providers.

