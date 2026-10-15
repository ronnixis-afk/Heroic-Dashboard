-- Migration: MCP write audit log.
-- Apply manually in the Supabase SQL editor. This repo does not run scripts/ against the database.
--
-- Failure policy: api/mcp.ts logs an error when the insert fails and still returns
-- the CMS write. The mutation has already succeeded; failing the tool call would
-- cause clients to retry and duplicate the monster update or patch-note draft.
-- Audit is observability, not the commit path.

CREATE TABLE IF NOT EXISTS public.mcp_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  tool text NOT NULL,
  target_id text,
  diff_summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mcp_audit_log IS
  'MCP write audit. Insert failures are logged by the server and do not roll back the CMS write.';

CREATE INDEX IF NOT EXISTS mcp_audit_log_created_at_idx
  ON public.mcp_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS mcp_audit_log_key_name_created_at_idx
  ON public.mcp_audit_log (key_name, created_at DESC);

ALTER TABLE public.mcp_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mcp_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.mcp_audit_log TO service_role;
