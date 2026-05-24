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
```

> [!IMPORTANT]
> Always grant appropriate select permissions on newly created views so that the client application can fetch data:
> ```sql
> GRANT SELECT ON "model_usage_distribution" TO anon, authenticated, service_role;
> GRANT SELECT ON "daily_usage_summary" TO anon, authenticated, service_role;
> GRANT SELECT ON "real_time_hourly_stats" TO anon, authenticated, service_role;
> ```
