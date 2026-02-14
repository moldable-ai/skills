---
name: trello
description: Manage Trello boards/lists/cards via aivault-backed capabilities (no Trello key/token in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
---

# Trello

This skill uses aivault to keep your Trello credentials safe.

## Setup

Store your Trello API key and user token in aivault. The credential and all `trello/*` capabilities are auto-provisioned once both secrets are present.

```bash
aivault secrets create --name TRELLO_API_KEY --value "YOUR_API_KEY" --scope global
aivault secrets create --name TRELLO_TOKEN --value "YOUR_USER_TOKEN" --scope global
```

- `TRELLO_API_KEY` — your Trello API key (from [Power-Up admin](https://trello.com/power-ups/admin))
- `TRELLO_TOKEN` — a user token (granted via `trello.com/1/authorize`)

This skill uses `trello/members`, `trello/boards`, `trello/lists`, and `trello/cards`. The registry also includes capabilities for actions, checklists, labels, organizations, search, webhooks, and more — run `aivault capability list` to browse.

## Quick start

```bash
{baseDir}/scripts/trello.ts boards-list
```

## Common examples

```bash
{baseDir}/scripts/trello.ts boards-list --json
{baseDir}/scripts/trello.ts lists-list --board-id <board-id>
{baseDir}/scripts/trello.ts cards-list --list-id <list-id>
{baseDir}/scripts/trello.ts card-create --list-id <list-id> --name "Ship it" --desc "Created via aivault"
```

