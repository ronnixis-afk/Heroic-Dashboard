-- Migration: Add App Update Popup columns to News table
ALTER TABLE IF EXISTS public."News"
  ADD COLUMN IF NOT EXISTS "is_popup" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "highlights" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "cta_label" TEXT,
  ADD COLUMN IF NOT EXISTS "cta_url" TEXT;

-- Grant SELECT access on News table for anon and authenticated roles
GRANT SELECT ON TABLE public."News" TO anon, authenticated, service_role;
