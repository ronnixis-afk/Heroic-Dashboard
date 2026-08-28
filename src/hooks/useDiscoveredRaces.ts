import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type DiscoveredRaceGenre = 'Fantasy' | 'Sci-Fi' | 'Modern';

export interface DiscoveredRace {
  race: string;
  canonicalKey: string;
  genres: DiscoveredRaceGenre[];
  portraitCount: number;
  realmCount: number;
  isUncovered: boolean;
  sources: ('preset' | 'public_realm' | 'catalog')[];
  description?: string | null;
  appearance?: string | null;
  themes?: string[];
}

export interface DiscoveredRacesResponse {
  totalDiscovered: number;
  uncoveredCount: number;
  races: DiscoveredRace[];
}

export const DISCOVERED_RACES_QUERY_KEY = ['discovered-races'] as const;

export function useDiscoveredRaces() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DISCOVERED_RACES_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchRpgAdmin<DiscoveredRacesResponse>(
        '/api/admin/image-assets/discovered-races',
        getToken
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: DISCOVERED_RACES_QUERY_KEY });
  }, [queryClient]);

  return {
    races: query.data?.races ?? [],
    totalDiscovered: query.data?.totalDiscovered ?? 0,
    uncoveredCount: query.data?.uncoveredCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch,
  };
}
