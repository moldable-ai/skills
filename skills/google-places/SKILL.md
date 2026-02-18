---
name: google-places
description: Search and fetch place details via Google Places API (New) through aivault (no API key in skill runtime).
compatibility: Requires `aivault` CLI and Node.js (runs via `npx tsx`).
credentials:
  - name: GOOGLE_PLACES_API_KEY
    description: Google Places API (New) key for place search and details
    required: true
---

# Google Places

This skill uses aivault to keep your Google Places API key safe.

## Setup

Install `aivault` if it is not already available:

```bash
curl -fsSL https://aivault.moldable.sh/install.sh | sh
```


Store your Google Places API key in aivault. The credential and all `google-places/*` capabilities are auto-provisioned from the built-in registry.

```bash
aivault secrets create --name GOOGLE_PLACES_API_KEY --value "YOUR_API_KEY" --scope global
```

This skill uses `google-places/search-text`, `google-places/details`, and `google-places/autocomplete`.

## Quick start

```bash
npx -y tsx {baseDir}/scripts/places.ts search-text --query "pizza near Mission District"
```

## Common examples

```bash
npx -y tsx {baseDir}/scripts/places.ts search-text --query "coffee near 10001" --field-mask "places.id,places.displayName,places.formattedAddress"
npx -y tsx {baseDir}/scripts/places.ts details --place-id <place-id> --field-mask "id,displayName,formattedAddress,googleMapsUri"
npx -y tsx {baseDir}/scripts/places.ts search-text --query "ramen" --json
```
