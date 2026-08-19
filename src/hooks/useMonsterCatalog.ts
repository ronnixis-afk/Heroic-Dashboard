import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type MonsterGenre = 'Fantasy' | 'Modern' | 'Sci-Fi';

export interface MonsterTypePayload {
  name: string;
  description: string;
  genres: MonsterGenre[];
  minEncounterLevel: number;
  defaultArchetype: string;
  allowedArchetypes: string[];
  maturityPrefixes: Array<{ minLevel: number; prefix: string }>;
  immunities: string[];
  resistances: string[];
  vulnerabilities: string[];
  statusImmunities: string[];
  defaultAffinity: string | null;
  poiTags: string[];
  enabled?: boolean;
}

export interface MonsterType {
  id: string;
  name: string;
  description: string;
  genres: MonsterGenre[];
  minEncounterLevel: number;
  defaultArchetype: string;
  allowedArchetypes: string[];
  maturityPrefixes: Array<{ minLevel: number; prefix: string }>;
  immunities: string[];
  resistances: string[];
  vulnerabilities: string[];
  statusImmunities: string[];
  defaultAffinity: string | null;
  poiTags: string[];
  enabled: boolean;
  isProtected: boolean;
}

export interface MonsterSubtype {
  id: string;
  name: string;
  visualDescription: string;
  size: string;
  archetype: string | null;
  allowedTerrains: string[];
  encounterExcluded: boolean;
  rideable: boolean;
  affinityOverride: string | null;
  acquisition: unknown | null;
  enabled: boolean;
  isProtected: boolean;
}

async function fetchMonsterTypes(getToken: (options?: any) => Promise<string | null>) {
  const data = await fetchRpgAdmin<{ types?: MonsterType[] }>('/api/admin/monster-types', getToken);
  return data.types || [];
}

export function useMonsterCatalog() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const typesQuery = useQuery({
    queryKey: ['monster-types'],
    queryFn: () => fetchMonsterTypes(getToken),
  });

  // Convenience: invalidate the list when the tab regains focus.
  useEffect(() => {
    const onFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ['monster-types'] });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [queryClient]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['monster-types'] });
  };

  const createType = async (payload: MonsterTypePayload) => {
    const data = await fetchRpgAdmin('/api/admin/monster-types', getToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await refresh();
    return data;
  };

  const updateType = async (id: string, payload: Partial<MonsterTypePayload> & { name?: string }) => {
    const data = await fetchRpgAdmin(`/api/admin/monster-types/${id}`, getToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await refresh();
    return data;
  };

  const deleteType = async (id: string) => {
    await fetchRpgAdmin(`/api/admin/monster-types/${id}`, getToken, { method: 'DELETE' });
    await refresh();
  };

  const fetchTypeDetails = async (id: string) => {
    const data = await fetchRpgAdmin<{ type?: (MonsterType & { subtypes: MonsterSubtype[] }) }>(
      `/api/admin/monster-types/${id}`,
      getToken
    );
    return data.type || null;
  };

  const createSubtype = async (typeId: string, payload: Partial<MonsterSubtype> & { name: string }) => {
    const data = await fetchRpgAdmin(
      `/api/admin/monster-types/${typeId}/subtypes`,
      getToken,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    await refresh();
    return data;
  };

  const updateSubtype = async (
    typeId: string,
    subtypeId: string,
    payload: Partial<MonsterSubtype> & { allowedTerrains?: string[] }
  ) => {
    const data = await fetchRpgAdmin(
      `/api/admin/monster-types/${typeId}/subtypes/${subtypeId}`,
      getToken,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
    await refresh();
    return data;
  };

  const deleteSubtype = async (typeId: string, subtypeId: string) => {
    await fetchRpgAdmin(`/api/admin/monster-types/${typeId}/subtypes/${subtypeId}`, getToken, {
      method: 'DELETE',
    });
    await refresh();
  };

  return {
    ...typesQuery,
    types: typesQuery.data || [],
    createType,
    updateType,
    deleteType,
    fetchTypeDetails,
    createSubtype,
    updateSubtype,
    deleteSubtype,
    refresh,
  };
}

