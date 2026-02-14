---
name: openai-transcribe
description: Transcribe local audio files with OpenAI speech-to-text through aivault capability json (no provider API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
---

# OpenAI Transcribe

This skill uses aivault to always keep your API keys safe.

## Setup

Store your OpenAI API key in aivault. The credential and all `openai/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name OPENAI_API_KEY --value "sk-..." --scope global
```

This skill uses `openai/transcription`.

## Quick start

```bash
{baseDir}/scripts/transcribe.ts /path/to/audio.m4a
```

## Common examples

```bash
{baseDir}/scripts/transcribe.ts /path/to/audio.wav
{baseDir}/scripts/transcribe.ts /path/to/audio.wav --json
```

## Notes

- Capability id is hard-coded to `openai/transcription`.
- Default model sent to upstream is `whisper-1`.
- The script uses `aivault json` so upstream JSON is parsed/validated by aivault; without `--json` it prints just the extracted transcript text.
