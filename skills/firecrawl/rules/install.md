---
name: firecrawl-aivault-setup
description: Store Firecrawl credentials in aivault and verify registry-backed Firecrawl capabilities.
---

# Firecrawl aivault Setup

Install `aivault` if needed:

```bash
curl -fsSL https://aivault.moldable.sh/install.sh | sh
```

Store the Firecrawl API key in aivault:

```bash
aivault secrets create --name FIRECRAWL_API_KEY --value "fc-YOUR-API-KEY" --scope global
```

Verify:

```bash
aivault secrets list | rg FIRECRAWL_API_KEY
aivault capability list | rg firecrawl
aivault capability describe firecrawl/search
```

Run one small request:

```bash
aivault json firecrawl/scrape \
  --method POST \
  --path /v2/scrape \
  --header Accept=application/json \
  --header Content-Type=application/json \
  --body '{"url":"https://firecrawl.dev","formats":["markdown"]}'
```
