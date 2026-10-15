<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in Vercel: https://heroic-dashboard-three.vercel.app

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MCP server

`api/mcp.ts` is the Heroic Dashboard MCP endpoint. Callers send `Authorization: Bearer <key>`.

### Keys and scopes

`MCP_API_KEY` remains a full-scope legacy key. Its audit name is `legacy`, and it can call every tool.

`MCP_API_KEYS` is a JSON object. Each name maps to a sha256 hash of the bearer key (preferred) or a raw `key`, plus `scopes`:

```json
{
  "reader": {
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "scopes": ["read"]
  },
  "monster-bot": {
    "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "scopes": ["read", "monsters"]
  },
  "notes-bot": {
    "key": "plaintext-key-do-not-use-prefer-sha256",
    "scopes": ["patch_notes"]
  }
}
```

| Scope | Tools |
| --- | --- |
| `read` | `get_insights`, `list_patch_notes`, `list_monster_types`, `get_monster_type` |
| `monsters` | `create_monster_type`, `update_monster_type`, `create_monster_subtype`, `update_monster_subtype`, `update_monster_combat_flavor` |
| `patch_notes` | `publish_patch_note` |

Comparisons are constant-time. Keys and hashes are never written to logs. Invalid `MCP_API_KEYS` JSON fails closed (HTTP 500) and the error body does not echo the variable. Generate a key and hash with:

```bash
node scripts/generate-mcp-api-key.mjs reader read
```

`sha256` is SHA-256 over the UTF-8 bearer key, hex-encoded. That matches `crypto.subtle` in `api/mcp.ts`. If `sha256` is present it is used and a plaintext `key` on the same entry is ignored. An invalid `sha256` disables that entry instead of falling back to `key`.

### Write audit

The dashboard reaches Postgres through Supabase. MCP writes do not use that client today; they call the RPG admin API. Audit rows are inserted with the Supabase REST API using `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.

Add `scripts/03_mcp_audit_log.sql` in the Supabase SQL editor. Do not expect the app to apply it. The table is `mcp_audit_log` (`key_name`, `tool`, `target_id`, `diff_summary`, `created_at`). Row level security is on, with insert and select granted only to `service_role`.

If the insert fails, the server logs an error and the write still succeeds. The CMS change has already been accepted, so failing the tool call would cause a retry and a duplicate draft or monster edit. Audit is a record of the write, not the commit.

### Write rate limit

`MCP_WRITE_LIMIT_PER_MIN` defaults to 30. Only monster writes and `publish_patch_note` count, per key name, in a one-minute window. Over the cap, the tool returns `Write Rate Limit Exceeded. Key "<name>" Is Limited To <n> Writes Per Minute.`

There is no shared KV or rate-limit table in this repo (`api/clerk-proxy.ts` is also in-memory). The counter lives in the function isolate. On Vercel, cold starts reset it and separate isolates do not share it, so the cap is per instance rather than global.

### Patch notes

`publish_patch_note` keeps its name and now creates an unpublished draft (`published: false`, `is_popup: false`, `is_patch_note: true`) via `POST /api/admin/news`. The admin news form already posts `published: false` to that route for drafts. `list_patch_notes` reads public `GET /api/patch-notes`, which returns published notes, and drops any row sent with `published: false`. An admin publishes the draft in the CMS before it shows up on the public list.
