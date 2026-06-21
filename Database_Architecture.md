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
> **Data API Schema Exposure Update (Supabase May/October 2026)**
> In new Supabase projects created after May 30, 2026 (and existing projects starting October 30, 2026), tables and views are not exposed to the Data API (PostgREST) by default. You must explicitly run `GRANT` statements for all tables and views that the client queries via `supabase-js`.
> 
> Execute the following SQL script in the Supabase SQL Editor. This script uses a PL/pgSQL block to verify whether each table or view exists in your database before executing the `GRANT` statement, ensuring it runs without any errors even if some views or tables are not yet created:
> 
> ```sql
> DO $$
> DECLARE
>   relation_name text;
>   relations text[] := ARRAY[
>     'active_users_by_tier',
>     'user_tier_distribution',
>     'daily_usage_summary',
>     'monthly_usage_summary',
>     'top_consumers_summary',
>     'model_usage_distribution',
>     'feature_usage_distribution',
>     'session_metrics_summary',
>     'real_time_hourly_stats',
>     'page_visit_summary',
>     'global_usage_stats',
>     'user_daily_usage_summary',
>     'user_save_sizes_summary',
>     'game_save_metadata'
>   ];
>   tables text[] := ARRAY[
>     'News',
>     'User',
>     'UsageLog',
>     'UserSession',
>     'CreditAdjustment',
>     'EngineTelemetry',
>     'PageVisit',
>     'GameSave'
>   ];
> BEGIN
>   -- 1. Grant SELECT Access to Views for the Analytical Dashboard
>   FOREACH relation_name IN ARRAY relations
>   LOOP
>     IF EXISTS (SELECT 1 FROM pg_class WHERE relname = relation_name AND (relkind = 'v' OR relkind = 'm')) THEN
>       EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated, service_role', relation_name);
>     END IF;
>   END LOOP;
> 
>   -- 2. Grant CRUD Access to Underlying Tables
>   FOREACH relation_name IN ARRAY tables
>   LOOP
>     IF EXISTS (SELECT 1 FROM pg_class WHERE relname = relation_name AND relkind = 'r') THEN
>       IF relation_name = 'News' THEN
>         -- News needs SELECT granted to anon for public feed access
>         EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated, service_role', relation_name);
>       ELSE
>         EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role', relation_name);
>       END IF;
>     END IF;
>   END LOOP;
> END $$;
> ```


