---
name: granola
description: Read and analyze Granola.ai local meeting cache on macOS (search meetings, details, transcripts, documents, and pattern analysis) via a local TypeScript script.
compatibility: Requires Node.js (runs via `npx tsx`) and Granola cache at `~/Library/Application Support/Granola/cache-v3.json`.
---

# Granola

This skill provides local, read-only access to Granola meeting data from the cache file on disk.

## Requirements

- macOS with Granola installed
- Granola cache file at `~/Library/Application Support/Granola/cache-v3.json`
- Node.js with `tsx` available (`npx -y tsx`)

## Quick start

```bash
npx -y tsx {baseDir}/scripts/granola.ts search-meetings --query "roadmap"
```

## Commands

```bash
npx -y tsx {baseDir}/scripts/granola.ts search-meetings --query "quarterly planning" [--limit 10] [--json]
npx -y tsx {baseDir}/scripts/granola.ts get-meeting-details --meeting-id <meeting-id> [--json]
npx -y tsx {baseDir}/scripts/granola.ts get-meeting-transcript --meeting-id <meeting-id> [--json]
npx -y tsx {baseDir}/scripts/granola.ts get-meeting-documents --meeting-id <meeting-id> [--json]
npx -y tsx {baseDir}/scripts/granola.ts analyze-meeting-patterns --pattern-type topics|participants|frequency [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--json]
```

## Options

- `--cache-path <path>`: Override cache path (defaults to `~/Library/Application Support/Granola/cache-v3.json`)
- `--timezone <IANA-tz>`: Override output timezone (defaults to local system timezone)
- `--no-panels`: Disable fallback extraction from `documentPanels`
- `--json`: Return machine-readable JSON instead of formatted text

## Notes

- This script provides:
  - `search_meetings`
  - `get_meeting_details`
  - `get_meeting_transcript`
  - `get_meeting_documents`
  - `analyze_meeting_patterns`
- No external API calls are made; all processing is local and read-only.
