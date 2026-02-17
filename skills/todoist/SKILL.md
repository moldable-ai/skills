---
name: todoist
description: Manage Todoist tasks/projects/comments via aivault-backed capabilities (no Todoist token in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
dependencies:
  secrets:
    - TODOIST_TOKEN
---

# Todoist

This skill uses aivault to keep your Todoist API token safe.

## Setup

Store your Todoist API token in aivault. The credential and all `todoist/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name TODOIST_TOKEN --value "YOUR_API_TOKEN" --scope global
```

This skill uses `todoist/tasks`, `todoist/projects`, and `todoist/comments`.

## Quick start

```bash
npx -y tsx {baseDir}/scripts/todoist.ts tasks-list
```

## Common examples

```bash
npx -y tsx {baseDir}/scripts/todoist.ts tasks-create --content "Buy milk" --due "tomorrow"
npx -y tsx {baseDir}/scripts/todoist.ts tasks-close --id <task-id>
npx -y tsx {baseDir}/scripts/todoist.ts projects-list
npx -y tsx {baseDir}/scripts/todoist.ts comments-add --task-id <task-id> --content "FYI this is blocked"
npx -y tsx {baseDir}/scripts/todoist.ts tasks-list --json
```
