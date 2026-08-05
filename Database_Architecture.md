# Database & Analytics Architecture

This document outlines the database design, analytics aggregation pipeline, and Supabase views used by the Heroic Dashboard analytical layer.

## Analytics Pipeline

The Heroic Dashboard operates as a read-only visual overlay on top of the RPG engine's database structure:

1. **Logging Stage:** The RPG engine logs every AI generation event into the `UsageLog` table (recording `costUsd`, `tokens`, `model`, `durationMs`, and player identifiers).
2. **Aggregation Stage:** Postgres views in Supabase aggregate raw usage logs dynamically to create performant daily, hourly, and model-level statistics.
3. **Consumption Stage:** The dashboard client queries these Postgres views via the PostgREST API client for low-latency visual rendering.

---

## Required SQL Views

To support the analytics dashboard, the following views must exist in Supabase. If the schema of `UsageLog` changes, these views must be updated or dropped and recreated.

```sql
-- Aggregates total cost and request count per AI model
CREATE OR REPLACE VIEW model_usage_distribution AS
SELECT model,
   count(*) AS usage_count,
   sum("inputTokens") AS total_input_tokens,
   sum("outputTokens") AS total_output_tokens,
   sum(tokens) AS total_tokens,
   sum("costUsd") AS total_cost,
   avg("durationMs") AS avg_latency
  FROM "UsageLog"
 GROUP BY model;

-- Aggregates daily platform totals for token usage, costs, and active users
CREATE OR REPLACE VIEW daily_usage_summary AS
SELECT date_trunc('day'::text, "createdAt") AS date,
   sum(tokens) AS total_tokens,
   sum("costUsd") AS total_cost,
   count(DISTINCT "userId") AS active_users
  FROM "UsageLog"
 GROUP BY (date_trunc('day'::text, "createdAt"));

-- Tracks real-time hourly performance metrics for the last 24 hours
CREATE OR REPLACE VIEW real_time_hourly_stats AS
SELECT date_trunc('hour'::text, "createdAt") AS hour,
   count(DISTINCT "userId") AS active_users,
   sum("costUsd") AS total_cost,
   avg("durationMs") AS avg_latency
  FROM "UsageLog"
 WHERE "createdAt" > (now() - '24:00:00'::interval)
 GROUP BY (date_trunc('hour'::text, "createdAt"))
 ORDER BY (date_trunc('hour'::text, "createdAt"));

-- Aggregates save count and total save size in bytes per user
CREATE OR REPLACE VIEW user_save_sizes_summary AS
SELECT 
  "userId",
  count(*) AS save_count,
  coalesce(sum(octet_length(data::text)), 0) AS total_bytes
FROM "GameSave"
GROUP BY "userId";

-- Exposes basic metadata and text size of individual cloud saves
CREATE OR REPLACE VIEW game_save_metadata AS
SELECT 
  id,
  "userId",
  "worldId",
  name,
  "updatedAt",
  "createdAt",
  octet_length(data::text) AS size_bytes
FROM "GameSave";
```

> [!IMPORTANT]
> **Analytics Access (PostgREST Grants Revoked)**
> Anon (and broad authenticated) `GRANT SELECT` on analytics views was revoked. Do **not** grant `anon` SELECT on analytics views or PII-bearing tables for the dashboard.
>
> The Heroic Dashboard must read analytics exclusively through Clerk-gated RPG admin APIs:
> `fetchRpgAdmin` → `/api/admin/analytics/*` (and related `/api/admin/*` routes), using the standard Clerk session token.
>
> Remaining PostgREST usage in the dashboard (e.g. Feedback, SurveyResponse, CreditAdjustment, User list, realtime channels) requires an authenticated Supabase JWT via `getAdminSupabase` — never an anonymous client.
>
> Historical note: older scripts used `GRANT SELECT … TO anon, authenticated, service_role` on analytics views. Those grants are obsolete and must not be re-applied.

