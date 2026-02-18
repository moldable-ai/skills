---
name: openai-image-gen
description: Generate images via OpenAI Images API through aivault (no OpenAI API key in skill runtime). Writes images plus an index.html gallery.
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
credentials:
  - name: OPENAI_API_KEY
    description: OpenAI API key for image generation
    required: true
---

# OpenAI Image Gen

This skill uses aivault to keep your OpenAI API key safe. The script only invokes `openai/image-generation`.

## Setup

Store your OpenAI API key in aivault. The credential and all `openai/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name OPENAI_API_KEY --value "sk-..." --scope global
```

This skill uses `openai/image-generation`.

## Quick start

```bash
npx -y tsx {baseDir}/scripts/generate.ts --count 8
```

## Common examples

```bash
npx -y tsx {baseDir}/scripts/generate.ts --prompt "ultra-detailed studio photo of a lobster astronaut" --count 4
npx -y tsx {baseDir}/scripts/generate.ts --model gpt-image-1 --size 1536x1024 --quality high --out-dir ./out/images
npx -y tsx {baseDir}/scripts/generate.ts --model dall-e-3 --style vivid --prompt "serene mountain landscape" --count 1
npx -y tsx {baseDir}/scripts/generate.ts --json
```

## Output

- Images written to `--out-dir` (default: `./tmp/openai-image-gen-<timestamp>`).
- `prompts.json` mapping prompt to filename.
- `index.html` thumbnail gallery.
