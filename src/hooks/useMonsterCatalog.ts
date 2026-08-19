import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
  _count?: { subtypes: number };
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

export type MonsterTypeDetails = MonsterType & { subtypes: MonsterSubtype[] };

async function fetchMonsterTypes(getToken: (options?: any) => Promise<string | null>) {
  const data = await fetchRpgAdmin<{ types?: MonsterType[] }>('/api/admin/monster-types', getToken);
  return data.types || [];
}

async function fetchMonsterTypeDetails(
  id: string,
  getToken: (options?: any) => Promise<string | null>
) {
  const data = await fetchRpgAdmin<{ type?: MonsterTypeDetails }>(
    `/api/admin/monster-types/${id}`,
    getToken
  );
  return data.type || null;
}

export function useMonsterTypeDetails(typeId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ['monster-types', 'detail', typeId],
    queryFn: () => fetchMonsterTypeDetails(typeId!, getToken),
    enabled: Boolean(typeId),
  });
}

export function useMonsterCatalog() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const typesQuery = useQuery({
    queryKey: ['monster-types'],
    queryFn: () => fetchMonsterTypes(getToken),
  });

  const { data: types = [], isLoading: loading, error } = typesQuery;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['monster-types'] });
  }, [queryClient]);

  const createType = useCallback(
    async (payload: MonsterTypePayload) => {
      const data = await fetchRpgAdmin<{ type: MonsterType }>('/api/admin/monster-types', getToken, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await refresh();
      return data.type;
    },
    [getToken, refresh]
  );

  const updateType = useCallback(
    async (id: string, payload: Partial<MonsterTypePayload> & { name?: string }) => {
      const data = await fetchRpgAdmin(`/api/admin/monster-types/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await refresh();
      return data;
    },
    [getToken, refresh]
  );

  const deleteType = useCallback(
    async (id: string) => {
      await fetchRpgAdmin(`/api/admin/monster-types/${id}`, getToken, { method: 'DELETE' });
      await refresh();
    },
    [getToken, refresh]
  );

  const createSubtype = useCallback(
    async (typeId: string, payload: Partial<MonsterSubtype> & { name: string }) => {
      const data = await fetchRpgAdmin(
        `/api/admin/monster-types/${typeId}/subtypes`,
        getToken,
        { method: 'POST', body: JSON.stringify(payload) }
      );
      await refresh();
      return data;
    },
    [getToken, refresh]
  );

  const updateSubtype = useCallback(
    async (
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
    },
    [getToken, refresh]
  );

  const deleteSubtype = useCallback(
    async (typeId: string, subtypeId: string) => {
      await fetchRpgAdmin(`/api/admin/monster-types/${typeId}/subtypes/${subtypeId}`, getToken, {
        method: 'DELETE',
      });
      await refresh();
    },
    [getToken, refresh]
  );

  return {
    ...typesQuery,
    loading,
    error,
    types,
    createType,
    updateType,
    deleteType,
    createSubtype,
    updateSubtype,
    deleteSubtype,
    refresh,
  };
}

