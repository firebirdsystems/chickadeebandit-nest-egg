# Chickadee Bandit App Template

A starter template for building apps that install into [Chickadee Bandit](http://chickadeebandit.com).

> **This repo is meant to be used as a GitHub template.** Click "Use this template" to create your own app repo.

---

## Quick start

```bash
# 1. Edit manifest.json — set id, name, description, data_access
# 2. Build your app in src/index.html (and any other src/ files)
# 3. Preview locally
npm run dev   # opens http://localhost:3001

# 4. Build the installable bundle
npm run build  # produces dist/bundle.json

# 5. Install in your hub
#    Paste the dist/bundle.json URL into Hub → Apps → Install from URL
```

---

## File structure

```
manifest.json        App metadata, data access declaration, permissions
src/
  index.html         Your app's entry point (required)
  style.css          Optional additional files
  app.js             ...
build.mjs            Bundles src/ → dist/bundle.json
dist/
  bundle.json        Output — upload this to your hub
.github/workflows/
  release.yml        Auto-publishes a release on every push to main
```

---

## manifest.json reference

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique slug, e.g. `chore-tracker`. Must be unique in the hub. |
| `name` | Yes | Display name shown in the hub |
| `version` | Yes | Semver string |
| `description` | Yes | One-line description |
| `entrypoint` | Yes | Entry file, almost always `index.html` |
| `runtime` | Yes | `static` for HTML/JS apps (use this) |
| `icon` | No | App icon — emoji (e.g. `"🛒"`) or a filename bundled with the app (e.g. `"icon.svg"`, `"icon.png"`). Shown in the marketplace, installed apps list, and nav bar. |
| `storage` | Yes | `"kv"` (key/value blob), `"db"` (SQL), or `"none"` (no app-owned storage — uses hub-native data only) |
| `data_access.reads` | Yes | Family data keys this app reads (see below) |
| `data_access.writes` | Yes | Family data keys this app writes |
| `permissions.default_audience` | Yes | `everyone`, `adults`, or `children` |
| `permissions.requires_approval` | Yes | If true, hub admin must approve before app goes active |
| `resource_limits` | Yes | Storage caps — even if using defaults, declare this to signal the limits were considered (see below) |
| `category` | No | e.g. `health`, `finance`, `games`, `tools` |
| `tags` | No | Array of strings for filtering |
| `nav` | No | `{ "label": "..." }` — adds the app to the hub's top navigation bar. Uses `icon` automatically. Omit for infrequently-accessed apps. |
| `widget` | No | `{ "label": "...", "size": "small" \| "medium" \| "large" }` — shows a summary tile on the dashboard |

### resource_limits

Declare `resource_limits` even when accepting defaults, so limits are explicit:

```json
"resource_limits": {
  "max_store_bytes": 524288,         // kv apps: max KV storage (default 5 MB)
  "max_store_reads_per_day": 500,    // kv apps: read requests per day (default 1000)
  "max_store_writes_per_day": 200,   // kv apps: write requests per day (default 500)
  "max_db_bytes": 52428800,          // db apps: SQLite/Postgres size cap (default 200 MB)
  "max_file_bytes": 10485760,        // file-uploading apps: max size per file (default 10 MB)
  "max_files_bytes": 524288000       // file-uploading apps: total file storage (default 500 MB)
}
```

Apps with `"storage": "none"` do not need `resource_limits`.

### Available data_access keys

```
family.members
family.calendar
family.preferences
family.health.medications
family.health.conditions
family.finances.budget
family.finances.transactions
family.finances.allowances
family.finances.rewards
family.documents
```

---

## Reading family data from your app

The hub injects `window.__FAMILY_HUB_CONTEXT_URL` into your app's page. Use it as the base URL for hub API calls:

```js
const BASE = window.__FAMILY_HUB_CONTEXT_URL ?? "";

const res = await fetch(`${BASE}/api/family`);
const members = await res.json();
```

The hub enforces `data_access` — requests for data not declared in your manifest will be rejected.

---

## Publishing via GitHub releases (optional)

Push to `main` — the included GitHub Actions workflow automatically:
1. Runs `node build.mjs`
2. Creates a release tagged `v{version}` from `manifest.json`
3. Uploads `dist/bundle.json` as the release asset

Anyone can then install your app by pasting the release asset URL into their hub:
```
https://github.com/firebirdsystems/chickadeebandit-your-app/releases/latest/download/bundle.json
```

---

## Creating apps without GitHub

If you're using Claude or another AI connected to your hub via MCP, you can skip the template entirely. Just describe the app you want — the AI will generate and deploy it directly using the `publish_app` MCP tool. No build step, no repo, no release needed.
