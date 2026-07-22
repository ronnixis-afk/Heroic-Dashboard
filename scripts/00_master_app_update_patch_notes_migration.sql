-- Master Migration: Add App Update & Patch Notes fields to News table and SystemSetting
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add all new columns to the public."News" table if they don't already exist
ALTER TABLE IF EXISTS public."News"
  ADD COLUMN IF NOT EXISTS "is_popup" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "highlights" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "cta_label" TEXT,
  ADD COLUMN IF NOT EXISTS "cta_url" TEXT,
  ADD COLUMN IF NOT EXISTS "version" TEXT,
  ADD COLUMN IF NOT EXISTS "is_patch_note" BOOLEAN DEFAULT false;

-- 2. Create public."SystemSetting" table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public."SystemSetting" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default app_version setting
INSERT INTO public."SystemSetting" ("key", "value", "updatedAt")
VALUES ('app_version', 'v0.5', NOW())
ON CONFLICT ("key") DO NOTHING;

-- 4. Grant table access to anon, authenticated, and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."News" TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."SystemSetting" TO anon, authenticated, service_role;

-- 5. Ensure Row Level Security (RLS) policies allow full read/write access for News & SystemSetting
ALTER TABLE public."News" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SystemSetting" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on News" ON public."News";
CREATE POLICY "Allow public read access on News" ON public."News" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow full access on News" ON public."News";
CREATE POLICY "Allow full access on News" ON public."News" FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on SystemSetting" ON public."SystemSetting";
CREATE POLICY "Allow public read access on SystemSetting" ON public."SystemSetting" FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow full access on SystemSetting" ON public."SystemSetting";
CREATE POLICY "Allow full access on SystemSetting" ON public."SystemSetting" FOR ALL TO public USING (true) WITH CHECK (true);
