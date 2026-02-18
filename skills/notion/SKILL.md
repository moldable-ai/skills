---
name: notion
description: Use Notion via aivault-backed capabilities (search, pages, blocks). No Notion API key is ever read by the skill runtime.
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
credentials:
  - name: NOTION_TOKEN
    description: Notion internal integration token with read/write access to pages and databases
    required: true
---

# Notion

This skill uses aivault to keep your Notion token safe. The scripts only invoke aivault capabilities; they never read env vars or local key files.

## Setup

Install `aivault` if it is not already available:

```bash
curl -fsSL https://aivault.moldable.sh/install.sh | sh
```


Store your Notion integration token in aivault. The credential and all `notion/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name NOTION_TOKEN --value "ntn_..." --scope global
```

This skill uses `notion/search`, `notion/pages`, and `notion/blocks`.

## Quick start

```bash
npx -y tsx {baseDir}/scripts/notion.ts search --query "roadmap"
```

## Common examples

```bash
# Search (pages only)
npx -y tsx {baseDir}/scripts/notion.ts search --query "meeting notes" --type page

# Get a page
npx -y tsx {baseDir}/scripts/notion.ts page-get --id <page-id>

# Create a page in a database (default title property name is "Name")
npx -y tsx {baseDir}/scripts/notion.ts page-create --database-id <db-id> --title "Weekly Notes"

# List block children
npx -y tsx {baseDir}/scripts/notion.ts block-children --id <block-id>

# Raw upstream JSON
npx -y tsx {baseDir}/scripts/notion.ts search --query "roadmap" --json
```

## Notes

- Notion-Version header is pinned to `2025-09-03` in the script.
- All API calls go through `aivault json ...` with explicit `--method`/`--path`.
