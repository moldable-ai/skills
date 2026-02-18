---
name: elevenlabs-transcribe
description: Transcribe audio with ElevenLabs speech-to-text through aivault capability json (no provider API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
credentials:
  - name: ELEVENLABS_API_KEY
    description: ElevenLabs API key for speech-to-text transcription
    required: true
---

# ElevenLabs Transcribe

This skill uses aivault to always keep your API keys safe.

## Setup

Store your ElevenLabs API key in aivault. The credential and all `elevenlabs/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name ELEVENLABS_API_KEY --value "YOUR_API_KEY" --scope global
```

## Quick start

```bash
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.mp3
```

## Common examples

```bash
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.mp3
npx -y tsx {baseDir}/scripts/transcribe.ts /path/to/audio.mp3 --json
npx -y tsx {baseDir}/scripts/transcribe.ts --url https://example.com/audio.mp3
```

## Notes

- Capability id is hard-coded to `elevenlabs/transcription`.
- Default model sent to upstream is `scribe_v2`.
- In text mode, multi-channel responses are flattened into one line per channel.
