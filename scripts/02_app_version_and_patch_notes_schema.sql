-- Migration: Add version and is_patch_note to News table, and insert initial app_version into SystemSetting
ALTER TABLE IF EXISTS public."News"
  ADD COLUMN IF NOT EXISTS "version" TEXT,
  ADD COLUMN IF NOT EXISTS "is_patch_note" BOOLEAN DEFAULT false;

-- Insert default app_version if not present
INSERT INTO public."SystemSetting" ("key", "value", "updatedAt")
VALUES ('app_version', 'v0.5', NOW())
ON CONFLICT ("key") DO NOTHING;

-- SystemSetting is admin/server-only (RPG Prisma + /api/admin/*). Never grant to anon.
-- Authenticated PostgREST DML/SELECT was revoked in 20260805070000_revoke_authenticated_cms_dml.sql.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."SystemSetting" TO service_role;
