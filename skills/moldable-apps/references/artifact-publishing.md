# Moldable Artifact Publishing

Moldable Artifacts hosts public, unlisted static web artifacts at
`https://artifacts.moldable.sh`. Use it when an app needs to share durable
outputs such as HTML/CSS slides, meeting notes, reports, image galleries, or
generated static snapshots.

## Core Rules

- Publish through Moldable desktop, not directly from app code.
- Use `publishMoldableArtifact()` from `@moldable-ai/ui`.
- Treat artifact URLs as public-but-unlisted. Anyone with the URL can view it.
- Do not put secrets, private tokens, local filesystem paths, or hidden
  workspace data in published artifacts.
- Include every file needed by the artifact. There is no app server behind the
  public URL.
- Stage files under the caller app's workspace data `publish/` directory before
  publishing. Desktop rejects `sourcePath` files outside that staging tree.
- Keep paths relative and safe: `index.html`, `assets/app.css`,
  `images/chart.png`. Do not use absolute paths or `..`.
- Set `entrypoint` to the HTML file that should load at `/a/{slug}/`.
- Keep large assets as separate files. Do not design image-heavy publishing
  flows around `data:` URLs or one giant HTML string.
- Provide useful metadata so shared artifact links render well in previews.

## Upload Model

The artifact service uses a manifest and per-file upload protocol:

1. Desktop/app builds a manifest: `{ path, sha256, size, contentType }[]`.
2. Desktop signs `POST /v1/artifacts` for new artifacts or
   `POST /v1/artifacts/{slug}/uploads` for updates with artifact metadata and
   the manifest.
3. Service returns an `uploadId` plus `needed[]` files after diffing known
   hashes for that artifact/version.
4. Desktop uploads needed files one at a time as signed raw byte requests to
   `PUT /v1/artifact-uploads/{uploadId}/file?path=...`.
5. Desktop signs `POST /v1/artifact-uploads/{uploadId}/commit`.
6. Service verifies sizes/hashes, creates an immutable version, atomically
   points latest at it, and returns the public unlisted URL.

This avoids base64 overhead, supports large images and generated bundles, skips
unchanged files on update, and makes failed uploads resumable/retryable. Apps
pass local source file paths to the desktop; the desktop reads, hashes, and
uploads those files natively.

Reference patterns:

- `topmass/openquick`: manifest diff (`deploy/start`), per-file upload
  (`deploy/file`), then atomic commit (`deploy/commit`); large files spill to
  R2 and are verified before commit.
- `scampion/quick`: accepts folders or ZIP archives, validates paths, writes
  individual objects, and publishes by moving a release pointer.
- `utsengar/htmlbin-cli`: the cloud backend intentionally publishes a single
  HTML file; its Cloudflare Pages backend uses a more robust
  check-missing/upload/manifest deployment protocol.

## App-Facing API

Preferred app helper:

```ts
import { publishMoldableArtifact } from '@moldable-ai/ui'

// Build this bundle on the server under:
// ~/.moldable/workspaces/{workspaceId}/apps/{appId}/data/publish/{artifactId}/
const bundle = await api.stageArtifactBundle(deckId)

const result = await publishMoldableArtifact({
  kind: 'slides',
  title: 'Planning Deck',
  entrypoint: bundle.entrypoint,
  metadata: {
    sourceAppId: 'slides',
    meetingId,
  },
  files: bundle.files,
})

console.log(result.url)
```

`sourcePath` must point to a local file the app staged under its workspace app
data `publish/` directory, for example
`~/.moldable/workspaces/personal/apps/slides/data/publish/deck-123/index.html`.
The helper passes only file references to the desktop host; the desktop derives
the caller app from the owning iframe, canonicalizes source paths, rejects files
outside the staging tree, reads files directly, and converts them into the remote
manifest/upload/commit protocol. For generated apps, keep every asset as its own
file entry so the desktop and service can hash, diff, retry, and skip unchanged
assets.

Return shape:

```ts
{
  id: string
  slug: string
  url: string
  version: string
  versionNumber?: number
}
```

## Shell, Versions, And SEO

The public latest URL, `/a/{slug}/`, serves a Moldable shell page with:

- a subtle Moldable header
- artifact title/description metadata
- official Moldable app attribution when `metadata.sourceAppId` names a
  first-party app
- version navigation
- a raw artifact link
- Open Graph and Twitter tags

The uploaded HTML entrypoint is loaded inside the shell from `/a/{slug}/raw`.
The raw route renders the artifact without the Moldable header while keeping SEO
metadata for shares. Historical versions are available at
`/a/{slug}/v/{versionNumber}/` while the artifact remains published.

Useful metadata keys:

```ts
metadata: {
  sourceAppId: 'meetings',
  description: 'Slides from the Q2 planning session.',
  seoTitle: 'Q2 Planning',
  seoDescription: 'A shareable deck from the Meetings app.',
  seoImage: 'images/cover.png',
}
```

`seoImage` may be an absolute URL or an artifact-relative file path. If it is
omitted, the artifact service uses the first image file in the manifest when
one exists.

## Permission Flow

1. The app calls `publishMoldableArtifact()`.
2. The helper posts `moldable:artifact-publish` to the parent frame.
3. Moldable desktop derives the caller app id from the iframe it owns.
4. The desktop checks a workspace-scoped grant for `artifacts.publish`.
5. If missing, the desktop asks the user to approve publishing for that app.
6. The Tauri backend validates source files are inside the caller app's
   workspace data `publish/` staging directory.
7. The Tauri backend signs and sends manifest, file upload, and commit
   requests.
8. The app receives only `{ id, slug, url, version }`.

Generated apps never receive the artifact service bootstrap token, Worker
secrets, or the desktop private publishing key.

## Security Model

Artifact publishing deliberately separates app intent from service credentials:

- Generated apps never receive the Cloudflare Worker URL credentials, bootstrap
  tokens, or desktop private publish key.
- Apps cannot choose their caller identity. Desktop derives `callerAppId` from
  the iframe it owns and signs remote requests itself.
- A workspace-scoped `artifacts.publish` grant lets an app publish only files it
  has staged under its own workspace data `publish/` directory.
- Desktop canonicalizes each `sourcePath` before reading it. Symlinks or path
  traversal that resolve outside the staging directory are rejected.
- Remote artifact URLs are unlisted, not private. Anyone with a slug URL can read
  the artifact until it is unpublished.

The artifact service uses:

- R2 for artifact files
- D1 for metadata, file manifests, publish keys, nonces, and rate limits
- Ed25519 request signatures for publish/update/unpublish mutations
- high-entropy unlisted URL slugs
- public read and miss rate limits to slow guessing/scanning

Local aivault secrets:

- `MOLDABLE_ARTIFACTS_PUBLISH_KEY`: a per-install desktop private key. This is
  a device credential, not an app credential. Apps must not see it.
- `MOLDABLE_ARTIFACTS_BOOTSTRAP_TOKEN`: development/admin enrollment only. Do
  not ship this to normal users.

Cloudflare Worker secret:

- `ADMIN_BOOTSTRAP_TOKEN`: deployment/service secret used for registering
  publish keys. It belongs in Cloudflare or Moldable-controlled infrastructure,
  not in generated apps.

## Staging Best Practices

Create a fresh staging folder for each artifact/version under
`getAppDataDir(workspaceId)/publish/{artifactId}`. Rebuild it from source data on
each publish so stale images, deleted slides, or old JavaScript bundles are not
accidentally re-published.

Recommended server-side pattern:

```ts
import { ensureDir, getAppDataDir, safePath } from '@moldable-ai/storage'
import { copyFile, rm, writeFile } from 'node:fs/promises'

async function stageArtifactBundle(workspaceId: string, artifactId: string) {
  const appData = getAppDataDir(workspaceId)
  const stageDir = safePath(appData, 'publish', artifactId)

  await rm(stageDir, { recursive: true, force: true })
  await ensureDir(safePath(stageDir, 'assets'))

  const htmlPath = safePath(stageDir, 'index.html')
  await writeFile(htmlPath, renderHtml(), 'utf8')

  const coverPath = safePath(stageDir, 'assets', 'cover.png')
  await copyFile(existingCoverImagePath, coverPath)

  return {
    entrypoint: 'index.html',
    files: [
      { path: 'index.html', contentType: 'text/html; charset=utf-8', sourcePath: htmlPath },
      { path: 'assets/cover.png', contentType: 'image/png', sourcePath: coverPath },
    ],
  }
}
```

Keep the distinction clear:

- `path`: public path inside the artifact bundle; must be relative and safe.
- `sourcePath`: absolute local file path under the app's `data/publish/...`
  staging tree.

Avoid:

- sending image/video bytes through `postMessage`
- base64-embedding large assets in HTML
- publishing from `data/decks`, `data/assets`, app source files, `.env`, SQLite
  databases, logs, caches, or temp directories
- using symlinks in the staging tree
- reusing a staging directory without clearing it first

## File Bundles

For a single HTML artifact:

```ts
const artifactDir = await api.stageReportArtifact(report)

await publishMoldableArtifact({
  kind: 'report',
  title: 'Weekly Report',
  entrypoint: 'index.html',
  files: [
    {
      path: 'index.html',
      contentType: 'text/html; charset=utf-8',
      sourcePath: `${artifactDir}/index.html`,
    },
  ],
})
```

For multi-file bundles, make asset URLs relative to `index.html`:

```html
<link rel="stylesheet" href="./assets/styles.css">
<script type="module" src="./assets/app.js"></script>
<img src="./images/chart.png" alt="Revenue chart">
```

Then publish matching file paths:

```ts
files: [
  { path: 'index.html', contentType: 'text/html; charset=utf-8', sourcePath: `${artifactDir}/index.html` },
  { path: 'assets/styles.css', contentType: 'text/css; charset=utf-8', sourcePath: `${artifactDir}/assets/styles.css` },
  { path: 'assets/app.js', contentType: 'text/javascript; charset=utf-8', sourcePath: `${artifactDir}/assets/app.js` },
  { path: 'images/chart.png', contentType: 'image/png', sourcePath: `${artifactDir}/images/chart.png` },
]
```

For image-heavy bundles, keep images as separate file entries with relative
paths rather than embedding them as `data:` URLs in HTML.

## Product Guidance

Publish only when the user explicitly asks to share/export/publish, or when the
app has a clear share action. Do not silently publish private workspace data.

Good artifact kinds:

- `slides`
- `meeting-notes`
- `report`
- `image-gallery`
- `static-snapshot`
- `html-demo`

Keep artifact pages self-contained, useful without Moldable running, and clear
about what they represent. Avoid marketing-style placeholder pages unless the
artifact itself is a website/mockup.
