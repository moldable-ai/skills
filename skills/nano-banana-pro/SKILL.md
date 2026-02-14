---
name: nano-banana-pro
description: Generate or edit images via Gemini image-capable models through aivault (no Gemini API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
---

# Nano Banana Pro (Gemini Image Generation)

This skill uses aivault to keep your Gemini API key safe. It calls the Gemini REST `:generateContent` endpoint through the `gemini/models` capability and saves the returned image.

## Setup

Store your Gemini API key in aivault. The credential and all `gemini/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name GEMINI_API_KEY --value "YOUR_API_KEY" --scope global
```

## Quick start

```bash
{baseDir}/scripts/generate.ts --prompt "a cat eating a nano-banana" --filename ./out.png
```

## Common examples

```bash
# Higher resolution
{baseDir}/scripts/generate.ts --prompt "a cozy reading nook" --filename ./out.png --resolution 2K

# Edit with input image(s)
{baseDir}/scripts/generate.ts --prompt "make it look like a watercolor painting" --filename ./out.png -i ./in.png

# Raw upstream JSON
{baseDir}/scripts/generate.ts --prompt "a cat eating a nano-banana" --filename ./out.png --json
```

## Notes

- Default model is `gemini-3-pro-image-preview` (override with `--model`).
- Uses `generationConfig.responseModalities=["TEXT","IMAGE"]` and `generationConfig.imageConfig.imageSize`.

