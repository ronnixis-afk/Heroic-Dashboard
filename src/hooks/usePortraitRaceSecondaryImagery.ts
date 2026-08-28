import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type PortraitRaceSecondaryGenre = 'Fantasy' | 'Sci-Fi' | 'Modern';

export interface PortraitRaceSecondaryMapping {
  genre: PortraitRaceSecondaryGenre;
  race: string;
  secondaryRace: string;
}

interface SecondaryImageryResponse {
  mappings?: PortraitRaceSecondaryMapping[];
}

export const PORTRAIT_RACE_SECONDARY_QUERY_KEY = ['portrait-race-secondary-imagery'] as const;

const canonicalRaceKey = (race: string): string =>
  race.trim().toLowerCase().replace(/s$/i, '');

export function findPortraitRaceSecondaryMapping(
  mappings: PortraitRaceSecondaryMapping[],
  genre: PortraitRaceSecondaryGenre,
  race: string
): PortraitRaceSecondaryMapping | undefined {
  const trimmed = race.trim().toLowerCase();
  if (!trimmed) return undefined;
  return (
    mappings.find((mapping) => mapping.genre === genre && mapping.race.trim().toLowerCase() === trimmed) ||
    mappings.find(
      (mapping) => mapping.genre === genre && canonicalRaceKey(mapping.race) === canonicalRaceKey(race)
    )
  );
}

export function usePortraitRaceSecondaryImagery() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PORTRAIT_RACE_SECONDARY_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchRpgAdmin<SecondaryImageryResponse>(
        '/api/admin/image-assets/race-secondary-imagery',
        getToken
      );
      return data.mappings ?? [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      genre: PortraitRaceSecondaryGenre;
      race: string;
      secondaryRace: string;
    }) => {
      const data = await fetchRpgAdmin<SecondaryImageryResponse>(
        '/api/admin/image-assets/race-secondary-imagery',
        getToken,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
      return data.mappings ?? [];
    },
    onSuccess: (mappings) => {
      queryClient.setQueryData(PORTRAIT_RACE_SECONDARY_QUERY_KEY, mappings);
    },
  });

  const setSecondaryRace = useCallback(
    (genre: PortraitRaceSecondaryGenre, race: string, secondaryRace: string) =>
      mutation.mutateAsync({ genre, race, secondaryRace }),
    [mutation]
  );

  return {
    mappings: query.data ?? [],
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    error: query.error ?? mutation.error,
    setSecondaryRace,
  };
}
