import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type RaceGenre = 'Fantasy' | 'Modern' | 'Sci-Fi';

export interface RacePayload {
  name: string;
  slug?: string;
  genres: RaceGenre[];
  appearance?: string;
  archetypeThemes?: string[];
  defaultAbilityBonus?: string;
  defaultKeywords?: string[];
  languageStyle?: string | null;
  portraitLabel?: string | null;
  flySpeed?: number;
  climbSpeed?: number;
  swimSpeed?: number;
  enabled?: boolean;
}

export interface Race {
  id: string;
  slug: string;
  name: string;
  genres: RaceGenre[];
  appearance: string;
  archetypeThemes: string[];
  defaultAbilityBonus: string;
  defaultKeywords: string[];
  languageStyle?: string | null;
  portraitLabel?: string | null;
  flySpeed: number;
  climbSpeed: number;
  swimSpeed: number;
  isProtected: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const RACE_CATALOG_QUERY_KEY = ['race-catalog'] as const;

async function fetchRaceCatalog(
  getToken: (options?: any) => Promise<string | null>,
  genre?: string,
  search?: string
): Promise<Race[]> {
  const params = new URLSearchParams();
  if (genre && genre !== 'All') params.set('genre', genre);
  if (search?.trim()) params.set('search', search.trim());
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  const data = await fetchRpgAdmin<{ races?: Race[] }>(
    `/api/admin/races${queryStr}`,
    getToken
  );
  return data.races || [];
}

export function useRaceCatalog(options?: { genre?: string; search?: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...RACE_CATALOG_QUERY_KEY, options?.genre, options?.search],
    queryFn: () => fetchRaceCatalog(getToken, options?.genre, options?.search),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: RACE_CATALOG_QUERY_KEY });
  }, [queryClient]);

  const createRace = useCallback(
    async (payload: RacePayload): Promise<Race> => {
      const result = await fetchRpgAdmin<{ race: Race }>(
        '/api/admin/races',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      await queryClient.invalidateQueries({ queryKey: RACE_CATALOG_QUERY_KEY });
      return result.race;
    },
    [getToken, queryClient]
  );

  const updateRace = useCallback(
    async (id: string, payload: Partial<RacePayload>): Promise<Race> => {
      const result = await fetchRpgAdmin<{ race: Race }>(
        `/api/admin/races/${id}`,
        getToken,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );
      await queryClient.invalidateQueries({ queryKey: RACE_CATALOG_QUERY_KEY });
      return result.race;
    },
    [getToken, queryClient]
  );

  const deleteRace = useCallback(
    async (id: string): Promise<boolean> => {
      await fetchRpgAdmin<{ success: boolean }>(
        `/api/admin/races/${id}`,
        getToken,
        {
          method: 'DELETE',
        }
      );
      await queryClient.invalidateQueries({ queryKey: RACE_CATALOG_QUERY_KEY });
      return true;
    },
    [getToken, queryClient]
  );

  return {
    races: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch,
    createRace,
    updateRace,
    deleteRace,
  };
}
