---
name: deepgram-transcribe
description: Transcribe audio with Deepgram through aivault capability json (no provider API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
credentials:
  - name: DEEPGRAM_API_KEY
    description: Deepgram API key for speech-to-text transcription
    required: true
---

# Deepgram Transcribe

This skill uses aivault to always keep your API keys safe.

## Setup

Store your Deepgram API key in aivault. The credential and all `deepgram/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name DEEPGRAM_API_KEY --value "YOUR_API_KEY" --scope global
```

## Quick start

```bash
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.wav
```

## Common examples

```bash
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.wav
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.wav --json
npx -y tsx {baseDir}/scripts/transcribe.ts --url https://example.com/audio.mp3
```

## Notes

- Capability id is hard-coded to `deepgram/transcription`.
- Default model sent to upstream is `nova-3`.
- In text mode, the script prints the first channel transcript.
