/**
 * Heroic Dashboard AI config types + fetch helpers (RPG admin API).
 */
import type { RpgAdminTokenSource } from '../lib/rpgAdminApi';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type CatalogModel = {
  id: string;
  displayName: string;
  provider: string;
  tier: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
  creditMultiplier: number;
  defaultTimeoutMs: number | null;
  capabilities: string[];
};

export type RoleAssignment = {
  primary: string;
  fallback: string;
  timeoutMs: number | null;
  thinkingBudget: number;
  label: string;
  description: string;
  stack: string;
};

export type AiConfigResponse = {
  catalog: CatalogModel[];
  roles: Array<{
    id: string;
    label: string;
    description: string;
    stack: string;
    defaults: {
      primary: string;
      fallback: string;
      timeoutMs: number | null;
      thinkingBudget: number;
    };
  }>;
  stacks: Record<string, string[]>;
  current: Record<string, RoleAssignment>;
  overrides?: Record<string, { primary?: string; fallback?: string; timeoutMs?: number | null }>;
};

export type RoleOverrideDraft = {
  primary: string;
  fallback: string;
  timeoutMs: number | null;
};

export async function fetchAiConfig(token: RpgAdminTokenSource): Promise<AiConfigResponse> {
  return fetchRpgAdmin<AiConfigResponse>('/api/admin/ai-config', token);
}

/**
 * Reduce the edited matrix to real deviations from the server defaults.
 * Roles left untouched are omitted so they keep following the code defaults
 * instead of being frozen at whatever the defaults happened to be today.
 */
export function buildRoleOverridePayload(
  roles: AiConfigResponse['roles'],
  drafts: Record<string, RoleOverrideDraft>
): Record<string, Partial<RoleOverrideDraft>> {
  const payload: Record<string, Partial<RoleOverrideDraft>> = {};
  for (const role of roles) {
    const draft = drafts[role.id];
    if (!draft) continue;
    const override: Partial<RoleOverrideDraft> = {};
    if (draft.primary && draft.primary !== role.defaults.primary) {
      override.primary = draft.primary;
    }
    if (draft.fallback && draft.fallback !== role.defaults.fallback) {
      override.fallback = draft.fallback;
    }
    if ((draft.timeoutMs ?? null) !== (role.defaults.timeoutMs ?? null)) {
      override.timeoutMs = draft.timeoutMs ?? null;
    }
    if (Object.keys(override).length > 0) {
      payload[role.id] = override;
    }
  }
  return payload;
}

export async function saveAiConfig(
  token: RpgAdminTokenSource,
  roles: Record<string, Partial<RoleOverrideDraft>>
): Promise<AiConfigResponse & { success?: boolean }> {
  return fetchRpgAdmin<AiConfigResponse & { success?: boolean }>(
    '/api/admin/ai-config',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ roles }),
    }
  );
}
