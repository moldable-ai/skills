---
name: google-places
description: Search and fetch place details via Google Places API (New) through aivault (no API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
---

# Google Places

This skill uses aivault to keep your Google Places API key safe.

## Setup

Store your Google Places API key in aivault. The credential and all `google-places/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name GOOGLE_PLACES_API_KEY --value "YOUR_API_KEY" --scope global
```

This skill uses `google-places/search-text`, `google-places/details`, and `google-places/autocomplete`.

## Quick start

```bash
{baseDir}/scripts/places.ts search-text --query "pizza near Mission District"
```

## Common examples

```bash
{baseDir}/scripts/places.ts search-text --query "coffee near 10001" --field-mask "places.id,places.displayName,places.formattedAddress"
{baseDir}/scripts/places.ts details --place-id <place-id> --field-mask "id,displayName,formattedAddress,googleMapsUri"
{baseDir}/scripts/places.ts search-text --query "ramen" --json
```

