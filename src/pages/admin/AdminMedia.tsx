import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  Image as ImageIcon,
  Save,
  Search,
  Tags,
  Trash2,
  UploadCloud,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Check,
  Copy,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { PageHeader, StatusBanner, CountPendingControl } from '../../components/ui';
import {
  IMAGE_ASSET_PAGE_SIZE,
  IMAGE_ASSET_TYPES,
  IMAGE_GENRES,
  ImageAsset,
  ImageAssetType,
  ImageGenre,
  useImageAssets,
} from '../../hooks/useImageAssets';
import { useMonsterCatalogWithSubtypes } from '../../hooks/useMonsterCatalog';
import { useDiscoveredRaces } from '../../hooks/useDiscoveredRaces';
import {
  findPortraitRaceSecondaryMapping,
  usePortraitRaceSecondaryImagery,
  type PortraitRaceSecondaryGenre,
} from '../../hooks/usePortraitRaceSecondaryImagery';
import {
  countByAssetType,
  countByGenre,
  countByMetadataKey,
  countByTag,
  countScopedTotal,
  expandAssetTypeFilter,
  formatOptionLabel,
  getCount,
} from '../../lib/imageAssetFacetCounts';
import { formatBytes } from '../../lib/utils';
import {
  optimizeImageToOriginalWebp,
  optimizeImageToSquare,
  optimizeImageToSquareGrid,
  OptimizedImageResult,
} from '../../lib/imageOptimizer';
import {
  getRideableTypeSuggestions,
  RideablePortraitGenre,
} from '../../constants/rideablePortraitCatalog';
import {
  getMonsterSubtypeDescription,
  getMonsterSubtypes,
  getMonsterTypeNames,
} from '../../constants/monsterPortraitCatalog';
import {
  getItemArtFamilyMembers,
  getItemPortraitCategoryNames,
  getItemPortraitSubtypes,
  getItemWeightCategory,
  resolveItemArtFamily,
} from '../../constants/itemPortraitCatalog';
import {
  getPowerImageCategoryNames,
  getPowerImageSubtypes,
  POWER_IMAGE_CATEGORIES,
  POWER_IMAGE_DAMAGE_SUBTYPES,
  POWER_IMAGE_STATUS_SUBTYPES,
} from '../../constants/powerImageCatalog';
import {
  getOriginItemDisplayName,
  isOriginItemStartingStoryId,
  ORIGIN_ITEM_OPTIONS,
} from '../../constants/originItemCatalog';

type SpecificImageGenre = Exclude<ImageGenre, 'Any Genre'>;

const GENERATED_MONSTER_TYPE_OPTIONS = getMonsterTypeNames();
const ITEM_CATEGORY_OPTIONS = getItemPortraitCategoryNames();
const POWER_IMAGE_CATEGORY_OPTIONS = getPowerImageCategoryNames();
/** Uploadable types. */
const UPLOADABLE_IMAGE_ASSET_TYPES = [...IMAGE_ASSET_TYPES] as ImageAssetType[];
const getAssetTypeOptionsForGenre = (
  _genre: ImageGenre
): ImageAssetType[] => [...UPLOADABLE_IMAGE_ASSET_TYPES];

const WEIGHT_SORT_ORDER: Record<string, number> = {
  Light: 0,
  Medium: 1,
  Heavy: 2,
  Shield: 3,
};

/** Art Family option text: family name only (plus weight for Weapons / Protection). */
const formatArtFamilyOptionLabel = (
  family: string,
  count: number,
  genre: string | null | undefined,
  category: string | null | undefined
): string => {
  let label = family;
  const categoryKey = (category || '').trim().toLowerCase();
  if (categoryKey === 'weapons' || categoryKey === 'protection') {
    const weight = getItemWeightCategory(family, genre);
    if (weight) label = `${weight} - ${label}`;
  }
  return formatOptionLabel(label, count);
};

/** Transform raw Supabase storage object URLs into resized thumbnails for high performance. */
export function getOptimizedThumbnailUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  const { width = 240, height = 240, quality = 80 } = options;

  try {
    if (url.includes('/storage/v1/object/public/')) {
      const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const separator = transformed.includes('?') ? '&' : '?';
      return `${transformed}${separator}width=${width}&height=${height}&resize=cover&quality=${quality}`;
    }
  } catch {
    // Return original url if transformation parsing fails
  }

  return url;
}

interface MediaGridItemImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailWidth?: number;
}

const MediaGridItemImage: React.FC<MediaGridItemImageProps> = ({
  src,
  alt,
  className = '',
  thumbnailWidth = 240,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const thumbUrl = useMemo(
    () => getOptimizedThumbnailUrl(src, { width: thumbnailWidth, height: thumbnailWidth, quality: 80 }),
    [src, thumbnailWidth]
  );

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [thumbUrl]);

  if (!thumbUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-brand-bg text-brand-text-muted">
        <ImageIcon size={20} className="opacity-40" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-bg">
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-brand-border/40" />
      )}

      {error ? (
        <div className="flex h-full w-full items-center justify-center bg-brand-bg text-brand-text-muted">
          <ImageIcon size={20} className="opacity-40" />
        </div>
      ) : (
        <img
          src={thumbUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`${className} ${
            loaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
        />
      )}
    </div>
  );
};

const POI_TAG_SUGGESTIONS: Record<SpecificImageGenre, { baseTypes: string[]; modifiers: string[] }> = {
  Fantasy: {
    baseTypes: [
      'Cave / Cavern',
      'Ancient Ruin',
      'Shrine / Altar',
      'Encampment',
      'Tower / Spire',
      'Excavation Site',
      'Tunnel / Shaft',
      'Bridge / Crossing',
      'Monolith / Obelisk',
      'Crossroads',
    ],
    modifiers: [
      'Bandit Hideout',
      'Haunted / Cursed',
      'Abandoned / Forgotten',
      'Heavily Trapped',
      'Monster Lair',
      'Secret Stash',
      'Guarded / Patrolled',
      'Illusionary / Shifting',
      'Sealed / Locked',
      "Smuggler's Den",
    ],
  },
  Modern: {
    baseTypes: [
      'Industrial Warehouse',
      'Transit Station',
      'Corporate Office / Clinic',
      'Underground Network / Sewer',
      'Parking Structure',
      'Construction Site',
      'Recreation Area / Park',
      'Intersection / Overpass',
      'Disposal Site / Junkyard',
      'Rooftop / Helipad',
    ],
    modifiers: [
      'Quarantined / Biohazard',
      'Gang-Controlled',
      'Heavily Surveilled',
      'Abandoned / Condemned',
      'Secretly Fortified',
      'Black Market / Smuggler Den',
      'Pitch Black / Grid Failure',
      'Active Crime Scene',
      'Cultist Front',
      'Structurally Unstable',
    ],
  },
  'Sci-Fi': {
    baseTypes: [
      'Derelict Vessel',
      'Research Outpost',
      'Mining Extraction Facility',
      'Spatial Anomaly',
      'Relay Station / Comm Buoy',
      'Orbital Habitat',
      'Debris Field / Wreckage',
      'Automated Drone Hive',
      "Smuggler's Cache",
      'Alien Monolith / Precursor Ruin',
    ],
    modifiers: [
      'Controlled By Rogue Ai',
      'Quarantined / Locked Down',
      'Overrun By Bio-Horrors',
      'Heavily Irradiated',
      'Caught In A Gravity Well',
      'Stripped By Scavengers',
      'Broadcasting A Distress Signal',
      'Cloaked / Stealth-Activated',
      'Protected By Active Turrets',
      'Caught In A Temporal Distortion',
    ],
  },

};

/** Genre-scoped zone terrains from RPG `src/constants/terrainConfig.ts` (`GENRE_TERRAIN_MAP`). */
const ZONE_TERRAIN_OPTIONS: Record<SpecificImageGenre, string[]> = {
  Fantasy: ['Plains', 'Forest', 'Swamp', 'Desert', 'Mountain', 'Coastal', 'Underwater', 'Airborne'],
  Modern: ['Plains', 'Forest', 'Swamp', 'Desert', 'Mountain', 'Coastal', 'Underwater', 'Airborne'],
  'Sci-Fi': ['Orbital', 'Asteroid Field', 'Deep Space', 'Nebula Core', 'Warp Rift', 'Planetary Surface'],
};

const ALL_ZONE_TERRAIN_OPTIONS = new Set(
  Object.values(ZONE_TERRAIN_OPTIONS).flat()
);

const getZoneTerrainOptions = (genre: ImageGenre): string[] => {
  if (genre !== 'Any Genre') return ZONE_TERRAIN_OPTIONS[genre];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of Object.values(ZONE_TERRAIN_OPTIONS)) {
    for (const terrain of list) {
      if (seen.has(terrain)) continue;
      seen.add(terrain);
      out.push(terrain);
    }
  }
  return out;
};

const PORTRAIT_METADATA_OPTIONS = {
  gender: ['Male', 'Female'],
  race: ['Human', 'Elf', 'Dwarf', 'Orc', 'Halfling/Gnome'],
};

/** Suggested rideable types from RPG rideableCatalog (synced via npm run sync:rideable-catalog). */
const getCatalogRideableSuggestions = (
  genre: SpecificImageGenre,
  category: 'mount' | 'vehicle' | 'ship'
): string[] => [...getRideableTypeSuggestions(genre as RideablePortraitGenre, category)];

const CUSTOM_RACES_STORAGE_KEY = 'heroic-dashboard-custom-portrait-races';
const PORTRAIT_RACE_ASSET_TYPES = new Set(['Character Portrait', 'NPC Portrait']);

const normalizeAssetTypeForForm = (assetType: string): ImageAssetType =>
  assetType as ImageAssetType;

const mergePortraitRaceOptions = (...lists: string[][]) => {
  const byLower = new Map<string, string>();
  for (const list of lists) {
    for (const value of list) {
      const race = value.trim();
      if (!race) continue;
      const key = race.toLowerCase();
      if (!byLower.has(key)) byLower.set(key, race);
    }
  }
  return Array.from(byLower.values()).sort((a, b) => a.localeCompare(b));
};

/**
 * Catalog rideable names first (game order), then any same-genre orphan metadata
 * values from existing uploads — never mix types from other genres into the dropdown.
 */
const mergeRideableTypeOptions = (
  catalogTypes: string[],
  assetTypes: string[],
  currentType?: string
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(trimmed);
  };
  catalogTypes.forEach(push);
  assetTypes.forEach(push);
  if (currentType) push(currentType);
  return out;
};

const assetMatchesStructuredGenre = (assetGenre: string, formGenre: ImageGenre, structuredGenre: SpecificImageGenre) => {
  if (formGenre === 'Any Genre') {
    return assetGenre === structuredGenre || assetGenre === 'Any Genre';
  }
  return assetGenre === formGenre || assetGenre === 'Any Genre';
};

/**
 * Suggested custom races beyond the core five — structured by genre so uploads
 * stay aligned with RPG races and world creation.
 */
const SUGGESTED_PORTRAIT_RACES_BY_GENRE: Record<SpecificImageGenre, readonly string[]> = {
  Fantasy: [
    'Aasimar',
    'Angel',
    'Birdfolk',
    'Catfolk',
    'Dark-Elf',
    'Demon',
    'Dragonborn',
    'Fae',
    'Fey',
    'Giant',
    'Goblin',
    'Half-Elf',
    'Half-Orc',
    'Lizardfolk',
    'Nephilim',
    'Nymph',
    'Tiefling',
    'Troll',
    'Undead',
    'Witch',
  ],
  'Sci-Fi': [
    'Aetherian',
    'Cygnian',
    'Gorgon',
    'Homunculus',
    'Krynn',
    'Neura',
    'Orionan',
    'Synthetic',
    'Vespidan',
    'Voidborn',
  ],
  Modern: [
    'Dhampir',
    'Djinn',
    'Fae',
    'Gargoyle',
    'Ghost',
    'Homunculus',
    'Lycanthrope',
    'Nephilim',
    'Revenant',
    'Vampire',
    'Werewolf',
    'Witch',
  ],
};

const ALL_SUGGESTED_PORTRAIT_RACES = [
  ...new Set([
    ...SUGGESTED_PORTRAIT_RACES_BY_GENRE.Fantasy,
    ...SUGGESTED_PORTRAIT_RACES_BY_GENRE['Sci-Fi'],
    ...SUGGESTED_PORTRAIT_RACES_BY_GENRE.Modern,
  ]),
].sort((a, b) => a.localeCompare(b));

const getSuggestedPortraitRacesForGenre = (genre: ImageGenre): string[] => {
  if (genre === 'Any Genre') {
    return [...ALL_SUGGESTED_PORTRAIT_RACES];
  }
  return [...(SUGGESTED_PORTRAIT_RACES_BY_GENRE[genre] || ALL_SUGGESTED_PORTRAIT_RACES)];
};

const getCatalogPortraitRaces = (assets: ImageAsset[], genre: ImageGenre) => {
  const races: string[] = [];
  for (const asset of assets) {
    if (!PORTRAIT_RACE_ASSET_TYPES.has(asset.assetType)) continue;
    if (genre !== 'Any Genre' && asset.genre !== genre && asset.genre !== 'Any Genre') continue;
    const race = getStringMetadata(asset.metadata).race?.trim();
    if (race) races.push(race);
  }
  return races;
};

const isPortraitAssetType = (assetType: string | undefined) =>
  assetType === 'Character Portrait';

const getStructuredGenre = (genre: ImageGenre): SpecificImageGenre =>
  genre === 'Any Genre' ? 'Fantasy' : genre;

const initialForm = {
  genre: 'Fantasy' as ImageGenre,
  assetType: 'Character Portrait' as ImageAssetType,
  description: '',
  tags: [] as string[],
  metadata: {} as Record<string, string>,
};

const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const MEDIA_GRID_PAGE_SIZE = IMAGE_ASSET_PAGE_SIZE;

interface OptimizedImageDraft extends OptimizedImageResult {
  sourceFileName: string;
  title: string;
}

type UploadMode = 'single' | 'original' | 'grid';

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};
const getTitleFromFileName = (fileName: string) => {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
  return toTitleCase(nameWithoutExtension) || 'Image Asset';
};

const getSuffixedFileName = (fileName: string, suffix: number) => {
  const extensionMatch = fileName.match(/(\.[^/.]+)$/);
  const extension = extensionMatch?.[1] || '';
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  return `${baseName} ${suffix}${extension}`;
};

const getStringMetadata = (metadata: Record<string, unknown> | null | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries(metadata || {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );

interface NamingInput {
  genre: ImageGenre;
  assetType: ImageAssetType;
  metadata: Record<string, string>;
}

const NAMING_METADATA_KEYS: Record<ImageAssetType, string[]> = {
  'Character Portrait': ['race', 'gender'],
  'Monster Portrait': ['monsterType', 'monsterSubtype'],
  'Mount Portrait': ['mountType'],
  'Vehicle Portrait': ['vehicleType'],
  'Ship Portrait': ['shipType'],
  'Point Of Interest Image': ['poiBaseType', 'poiModifier'],
  'Zone Image': ['terrainType'],
  'Item Image': ['itemCategory', 'itemSubtype'],
  'Power Image': ['powerCategory', 'powerSubtype'],
  'Origin Item': ['startingStoryId'],
  'App Assets': [],
};

const hasStructuredMetadataFields = (assetType: ImageAssetType) =>
  assetType === 'Point Of Interest Image' ||
  assetType === 'Zone Image' ||
  assetType === 'Item Image' ||
  assetType === 'Power Image' ||
  assetType === 'Origin Item' ||
  assetType === 'Monster Portrait' ||
  assetType === 'Mount Portrait' ||
  assetType === 'Vehicle Portrait' ||
  assetType === 'Ship Portrait';

/** Primary "Type" field kept after a successful upload for faster repeat uploads. */
const PRIMARY_TYPE_METADATA_KEY: Partial<Record<ImageAssetType, string>> = {
  'Character Portrait': 'race',
  'Monster Portrait': 'monsterType',
  'Mount Portrait': 'mountType',
  'Vehicle Portrait': 'vehicleType',
  'Ship Portrait': 'shipType',
  'Point Of Interest Image': 'poiBaseType',
  'Zone Image': 'terrainType',
  'Item Image': 'itemCategory',
  'Power Image': 'powerCategory',
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getNamingMetadataValues = (input: NamingInput) =>
  NAMING_METADATA_KEYS[input.assetType]
    .map((key) => {
      const value = input.metadata[key];
      if (!value) return '';
      if (input.assetType === 'Origin Item' && key === 'startingStoryId') {
        return getOriginItemDisplayName(value);
      }
      return value;
    })
    .filter(Boolean);

const getImageTitlePrefix = (input: NamingInput) =>
  [input.genre, input.assetType, ...getNamingMetadataValues(input)].join(' ');

const getGeneratedImageTitle = (input: NamingInput, uploadOrder: number) =>
  `${getImageTitlePrefix(input)} ${uploadOrder}`;

const getUploadOrderFromTitle = (title: string, prefix: string) => {
  const match = title.match(new RegExp(`^${escapeRegExp(prefix)}\\s+(\\d+)$`, 'i'));
  if (!match) return null;
  const order = Number(match[1]);
  return Number.isFinite(order) ? order : null;
};

const getTrailingUploadOrder = (title: string) => {
  const match = title.match(/\s+(\d+)$/);
  if (!match) return null;
  const order = Number(match[1]);
  return Number.isFinite(order) ? order : null;
};

const matchesNamingInput = (asset: ImageAsset, input: NamingInput) => {
  if (asset.genre !== input.genre || asset.assetType !== input.assetType) return false;

  const assetMetadata = getStringMetadata(asset.metadata);
  return NAMING_METADATA_KEYS[input.assetType].every(
    (key) => (assetMetadata[key] || '') === (input.metadata[key] || '')
  );
};

const getNextUploadOrder = (assets: ImageAsset[], input: NamingInput) => {
  const prefix = getImageTitlePrefix(input);
  const existingOrders = assets
    .filter((asset) => matchesNamingInput(asset, input))
    .map((asset) => getUploadOrderFromTitle(asset.title, prefix))
    .filter((order): order is number => order !== null);

  return existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;
};

const ALL_MONSTER_PORTRAIT_TAG_OPTIONS = (() => {
  const options = new Set<string>();
  GENERATED_MONSTER_TYPE_OPTIONS.forEach((typeName) => {
    options.add(typeName);
    getMonsterSubtypes(typeName).forEach((subtype) => options.add(subtype.name));
  });
  return options;
})();

const ALL_ITEM_SUBTYPES = (() => {
  const options = new Set<string>();
  for (const category of ITEM_CATEGORY_OPTIONS) {
    for (const subtype of getItemPortraitSubtypes(category)) {
      options.add(subtype);
    }
  }
  return options;
})();

const getManagedStructuredTagOptions = (assetType: ImageAssetType): Set<string> => {
  if (assetType === 'Character Portrait') {
    return new Set([...PORTRAIT_METADATA_OPTIONS.race, ...PORTRAIT_METADATA_OPTIONS.gender]);
  }
  if (assetType === 'Monster Portrait') {
    return ALL_MONSTER_PORTRAIT_TAG_OPTIONS;
  }
  if (assetType === 'Mount Portrait') {
    return new Set([
      ...getCatalogRideableSuggestions('Fantasy', 'mount'),
      ...getCatalogRideableSuggestions('Modern', 'mount'),
      ...getCatalogRideableSuggestions('Sci-Fi', 'mount'),
    ]);
  }
  if (assetType === 'Vehicle Portrait') {
    return new Set([
      ...getCatalogRideableSuggestions('Fantasy', 'vehicle'),
      ...getCatalogRideableSuggestions('Modern', 'vehicle'),
      ...getCatalogRideableSuggestions('Sci-Fi', 'vehicle'),
    ]);
  }
  if (assetType === 'Ship Portrait') {
    return new Set([
      ...getCatalogRideableSuggestions('Fantasy', 'ship'),
      ...getCatalogRideableSuggestions('Modern', 'ship'),
      ...getCatalogRideableSuggestions('Sci-Fi', 'ship'),
    ]);
  }
  if (assetType === 'Power Image') {
    return new Set([
      ...POWER_IMAGE_CATEGORIES,
      ...POWER_IMAGE_DAMAGE_SUBTYPES,
      ...POWER_IMAGE_STATUS_SUBTYPES,
    ]);
  }
  if (assetType === 'Origin Item') {
    return new Set(
      ORIGIN_ITEM_OPTIONS.flatMap((option) => [option.id, option.name, option.storyTitle])
    );
  }
  if (assetType === 'Zone Image') {
    return ALL_ZONE_TERRAIN_OPTIONS;
  }
  return new Set();
};

const getTagsWithStructuredMetadata = (input: typeof initialForm) => {
  const selectionTags = [
    input.genre,
    input.assetType,
    ...getNamingMetadataValues(input),
    ...(input.assetType === 'Origin Item' && input.metadata.startingStoryId
      ? [input.metadata.startingStoryId]
      : []),
  ].filter(Boolean);
  const managedTags = getManagedStructuredTagOptions(input.assetType);
  const baseTags =
    managedTags.size > 0
      ? input.tags.filter((tag) => !managedTags.has(tag))
      : input.tags;

  return Array.from(new Set([...baseTags, ...selectionTags]));
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminMedia() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'All',
    assetType: 'All',
    tag: 'All',
  });
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.genre, filters.assetType, filters.tag]);

  const {
    types: liveMonsterTypesWithSubtypes,
    loading: liveMonsterCatalogLoading,
    error: liveMonsterCatalogError,
  } = useMonsterCatalogWithSubtypes();

  const liveMonsterTypesByName = useMemo(() => {
    const map: Record<string, { id: string; subtypes: Array<{ id: string; name: string; visualDescription: string }> }> =
      {};
    for (const t of liveMonsterTypesWithSubtypes) {
      map[t.name] = t;
    }
    return map;
  }, [liveMonsterTypesWithSubtypes]);

  const monsterTypeOptions = useMemo(() => {
    const generatedSet = new Set(GENERATED_MONSTER_TYPE_OPTIONS);
    const appended = liveMonsterTypesWithSubtypes
      .map((t) => t.name)
      .filter((name) => !generatedSet.has(name));
    return [...GENERATED_MONSTER_TYPE_OPTIONS, ...appended];
  }, [liveMonsterTypesWithSubtypes]);

  const {
    assets,
    facetRows,
    facetsLoading,
    facetsError,
    isFetchingFacets,
    totalAssetCount,
    totalStorageBytes,
    totalPages,
    loading,
    isFetching,
    createImageAsset,
    updateImageAsset,
    addTagsToImageAssets,
    deleteImageAsset,
    deleteImageAssets,
  } = useImageAssets({
    page,
    pageSize: MEDIA_GRID_PAGE_SIZE,
    search: debouncedSearch,
    genre: filters.genre,
    assetType: filters.assetType,
    tag: filters.tag,
  });
  const [formData, setFormData] = useState(initialForm);

  const [editingAsset, setEditingAsset] = useState<ImageAsset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImageAsset | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [batchTagDraft, setBatchTagDraft] = useState('');
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImageDraft[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
  const [pendingSingleFile, setPendingSingleFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [customRacesByGenre, setCustomRacesByGenre] = useState<Record<string, string[]>>({});
  const [isRaceMenuOpen, setIsRaceMenuOpen] = useState(false);
  const [onlyUncoveredRaces, setOnlyUncoveredRaces] = useState(false);

  const {
    races: dynamicDiscoveredRaces,
    uncoveredCount: dynamicUncoveredRaceCount,
    isLoading: isLoadingDiscoveredRaces,
    isFetching: isFetchingDiscoveredRaces,
    refetch: refetchDiscoveredRaces,
  } = useDiscoveredRaces();

  const countsPending = facetsLoading;
  const raceFieldPending = facetsLoading || isLoadingDiscoveredRaces;

  const {
    mappings: secondaryImageryMappings,
    isSaving: isSavingSecondaryImagery,
    setSecondaryRace: saveSecondaryRace,
  } = usePortraitRaceSecondaryImagery();

  const discoveredRaceNamesByGenre = useMemo(() => {
    const byGenre: Record<string, string[]> = { Fantasy: [], 'Sci-Fi': [], Modern: [] };
    const all: string[] = [];
    for (const item of dynamicDiscoveredRaces) {
      all.push(item.race);
      for (const g of item.genres) {
        if (byGenre[g]) byGenre[g].push(item.race);
      }
    }
    return {
      all: [...new Set(all)],
      Fantasy: [...new Set(byGenre.Fantasy)],
      'Sci-Fi': [...new Set(byGenre['Sci-Fi'])],
      Modern: [...new Set(byGenre.Modern)],
    };
  }, [dynamicDiscoveredRaces]);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const selectedRaceInfo = useMemo(() => {
    const race = (formData.metadata.race || '').trim().toLowerCase();
    if (!race) return null;
    return (
      dynamicDiscoveredRaces.find(
        (r) => r.race.toLowerCase() === race || r.canonicalKey === race
      ) || null
    );
  }, [dynamicDiscoveredRaces, formData.metadata.race]);

  useEffect(() => {
    return () => {
      optimizedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [optimizedImages]);

  useEffect(() => {
    try {
      const storedRaces = window.localStorage.getItem(CUSTOM_RACES_STORAGE_KEY);
      if (storedRaces) {
        setCustomRacesByGenre(JSON.parse(storedRaces) as Record<string, string[]>);
      }
    } catch (error) {
      console.warn('[MediaLibrary] Unable To Load Custom Race Options:', error);
    }
  }, []);

  useEffect(() => {
    if (raceFieldPending) setIsRaceMenuOpen(false);
  }, [raceFieldPending]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    if (filters.tag !== 'All') tags.add(filters.tag);
    facetRows.forEach((row) => row.tags?.forEach((tag) => tags.add(tag)));
    assets.forEach((asset) => asset.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [assets, facetRows, filters.tag]);

  const filteredAssets = assets;
  const visibleAssets = assets;
  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedAssetIds.includes(asset.id)),
    [assets, selectedAssetIds]
  );
  const selectedCount = selectedAssets.length;
  const areAllVisibleSelected =
    visibleAssets.length > 0 && visibleAssets.every((asset) => selectedAssetIds.includes(asset.id));
  const storageUsagePercent = Math.min(100, (totalStorageBytes / SUPABASE_FREE_STORAGE_LIMIT_BYTES) * 100);
  const remainingStorageBytes = Math.max(0, SUPABASE_FREE_STORAGE_LIMIT_BYTES - totalStorageBytes);
  const storageBarClassName =
    storageUsagePercent >= 90
      ? 'bg-red-500'
      : storageUsagePercent >= 75
        ? 'bg-amber-500'
        : 'bg-brand-accent';
  const portraitRaceOptions = useMemo(
    () =>
      mergePortraitRaceOptions(
        PORTRAIT_METADATA_OPTIONS.race,
        getSuggestedPortraitRacesForGenre(formData.genre),
        formData.genre === 'Any Genre'
          ? discoveredRaceNamesByGenre.all
          : discoveredRaceNamesByGenre[formData.genre] || [],
        getCatalogPortraitRaces(assets, formData.genre),
        customRacesByGenre[formData.genre] || [],
        // Keep cross-genre customs discoverable while typing on Any Genre uploads.
        formData.genre === 'Any Genre' ? Object.values(customRacesByGenre).flat() : []
      ),
    [assets, customRacesByGenre, discoveredRaceNamesByGenre, formData.genre]
  );
  const structuredGenre = getStructuredGenre(formData.genre);

  const formGenreScope = useMemo(
    () => ({ genre: formData.genre }),
    [formData.genre]
  );
  const formAssetTypeScope = useMemo(
    () => ({
      genre: formData.genre,
      assetTypes: expandAssetTypeFilter(formData.assetType),
    }),
    [formData.assetType, formData.genre]
  );
  const genreCounts = useMemo(() => countByGenre(facetRows), [facetRows]);
  const formAssetTypeCounts = useMemo(
    () => countByAssetType(facetRows, formGenreScope),
    [facetRows, formGenreScope]
  );
  const portraitGenderCounts = useMemo(
    () => countByMetadataKey(facetRows, 'gender', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const portraitRaceCounts = useMemo(
    () => countByMetadataKey(facetRows, 'race', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const filteredPortraitRaceOptions = useMemo(() => {
    const raceQuery = (formData.metadata.race || '').trim().toLowerCase();
    let options = portraitRaceOptions;
    if (onlyUncoveredRaces) {
      options = options.filter((option) => getCount(portraitRaceCounts, option) === 0);
    }
    if (!raceQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(raceQuery));
  }, [formData.metadata.race, onlyUncoveredRaces, portraitRaceCounts, portraitRaceOptions]);
  const selectedPortraitRace = (formData.metadata.race || '').trim();
  const secondaryImageryGenre: PortraitRaceSecondaryGenre =
    formData.genre === 'Fantasy' || formData.genre === 'Sci-Fi' || formData.genre === 'Modern'
      ? formData.genre
      : structuredGenre;
  const currentSecondaryRace =
    findPortraitRaceSecondaryMapping(
      secondaryImageryMappings,
      secondaryImageryGenre,
      selectedPortraitRace
    )?.secondaryRace || '';
  const secondaryRaceOptions = useMemo(() => {
    const currentKey = selectedPortraitRace.toLowerCase();
    const selectedSecondaryKey = currentSecondaryRace.toLowerCase();
    const options = portraitRaceOptions.filter((option) => {
      const optionKey = option.toLowerCase();
      if (optionKey === currentKey) return false;
      return getCount(portraitRaceCounts, option) > 0 || optionKey === selectedSecondaryKey;
    });
    if (
      currentSecondaryRace &&
      !options.some((option) => option.toLowerCase() === selectedSecondaryKey)
    ) {
      options.unshift(currentSecondaryRace);
    }
    return options.sort((a, b) => a.localeCompare(b));
  }, [currentSecondaryRace, portraitRaceCounts, portraitRaceOptions, selectedPortraitRace]);
  const formAssetTypeTotal = useMemo(
    () => countScopedTotal(facetRows, formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const poiTypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'poiBaseType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const poiSubtypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'poiModifier', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const zoneTerrainCounts = useMemo(
    () => countByMetadataKey(facetRows, 'terrainType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const itemCategoryCounts = useMemo(
    () => countByMetadataKey(facetRows, 'itemCategory', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const itemSubtypeScope = useMemo(
    () => ({
      ...formAssetTypeScope,
      metadata: { itemCategory: formData.metadata.itemCategory || '' },
    }),
    [formAssetTypeScope, formData.metadata.itemCategory]
  );
  /** Roll retired chassis uploads (e.g. Composite Bow) into their art family (Longbow). */
  const itemSubtypeCounts = useMemo(() => {
    const raw = countByMetadataKey(facetRows, 'itemSubtype', itemSubtypeScope);
    const rolled: Record<string, number> = {};
    for (const [key, count] of Object.entries(raw)) {
      const family = resolveItemArtFamily(key, structuredGenre);
      rolled[family] = (rolled[family] || 0) + count;
    }
    return rolled;
  }, [facetRows, itemSubtypeScope, structuredGenre]);
  const itemSubtypeTotal = useMemo(
    () => countScopedTotal(facetRows, itemSubtypeScope),
    [facetRows, itemSubtypeScope]
  );
  const powerCategoryCounts = useMemo(
    () => countByMetadataKey(facetRows, 'powerCategory', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const powerSubtypeScope = useMemo(
    () => ({
      ...formAssetTypeScope,
      metadata: { powerCategory: formData.metadata.powerCategory || '' },
    }),
    [formAssetTypeScope, formData.metadata.powerCategory]
  );
  const powerSubtypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'powerSubtype', powerSubtypeScope),
    [facetRows, powerSubtypeScope]
  );
  const powerSubtypeTotal = useMemo(
    () => countScopedTotal(facetRows, powerSubtypeScope),
    [facetRows, powerSubtypeScope]
  );
  const originStoryCounts = useMemo(
    () =>
      countByMetadataKey(facetRows, 'startingStoryId', {
        assetTypes: ['Origin Item'],
      }),
    [facetRows]
  );
  const mountTypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'mountType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const vehicleTypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'vehicleType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const shipTypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'shipType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const monsterTypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'monsterType', formAssetTypeScope),
    [facetRows, formAssetTypeScope]
  );
  const monsterSubtypeScope = useMemo(
    () => ({
      ...formAssetTypeScope,
      metadata: { monsterType: formData.metadata.monsterType || '' },
    }),
    [formAssetTypeScope, formData.metadata.monsterType]
  );
  const monsterSubtypeCounts = useMemo(
    () => countByMetadataKey(facetRows, 'monsterSubtype', monsterSubtypeScope),
    [facetRows, monsterSubtypeScope]
  );
  const monsterSubtypeTotal = useMemo(
    () => countScopedTotal(facetRows, monsterSubtypeScope),
    [facetRows, monsterSubtypeScope]
  );
  const libraryAssetTypeCounts = useMemo(
    () => countByAssetType(facetRows, { genre: filters.genre }),
    [facetRows, filters.genre]
  );
  const libraryAssetTypeTotal = useMemo(
    () => countScopedTotal(facetRows, { genre: filters.genre }),
    [facetRows, filters.genre]
  );
  const libraryTagScope = useMemo(
    () => ({
      genre: filters.genre,
      assetTypes: expandAssetTypeFilter(filters.assetType),
    }),
    [filters.assetType, filters.genre]
  );
  const libraryTagCounts = useMemo(
    () => countByTag(facetRows, libraryTagScope),
    [facetRows, libraryTagScope]
  );
  const libraryTagTotal = useMemo(
    () => countScopedTotal(facetRows, libraryTagScope),
    [facetRows, libraryTagScope]
  );
  const zoneTerrainOptions = useMemo(() => {
    const catalog = getZoneTerrainOptions(formData.genre);
    const current = formData.metadata.terrainType?.trim();
    if (current && !catalog.includes(current)) return [...catalog, current];
    return catalog;
  }, [formData.genre, formData.metadata.terrainType]);
  const monsterSubtypeOptions = useMemo(
    () => {
      const typeName = formData.metadata.monsterType || '';
      const liveType = liveMonsterTypesByName[typeName];
      if (liveType && Array.isArray(liveType.subtypes)) return liveType.subtypes;

      // Fallback: generated catalog (stale but keeps the page usable before live load).
      return getMonsterSubtypes(typeName);
    },
    [formData.metadata.monsterType, liveMonsterTypesByName]
  );

  const selectedMonsterSubtypeVisualDescription = useMemo(() => {
    const typeName = formData.metadata.monsterType || '';
    const subtypeName = formData.metadata.monsterSubtype || '';
    if (!typeName || !subtypeName) return '';

    const liveType = liveMonsterTypesByName[typeName];
    const liveSubtype = liveType?.subtypes?.find((s) => s.name === subtypeName);
    if (liveSubtype?.visualDescription) return liveSubtype.visualDescription;

    return getMonsterSubtypeDescription(typeName, subtypeName);
  }, [formData.metadata.monsterType, formData.metadata.monsterSubtype, liveMonsterTypesByName]);
  /** Catalog art-family names only — retired chassis are not listed as separate upload targets. Genre-scoped for Weapons. */
  const itemSubtypeOptions = useMemo(() => {
    const catalogTypes = [
      ...getItemPortraitSubtypes(formData.metadata.itemCategory || '', structuredGenre),
    ];
    const currentFamily = formData.metadata.itemSubtype
      ? resolveItemArtFamily(formData.metadata.itemSubtype, structuredGenre)
      : undefined;
    const merged = mergeRideableTypeOptions(catalogTypes, [], currentFamily);
    const categoryKey = (formData.metadata.itemCategory || '').trim().toLowerCase();
    if (categoryKey !== 'weapons' && categoryKey !== 'protection') return merged;
    return [...merged].sort((a, b) => {
      const weightA = getItemWeightCategory(a, structuredGenre);
      const weightB = getItemWeightCategory(b, structuredGenre);
      const orderA = weightA != null ? (WEIGHT_SORT_ORDER[weightA] ?? 99) : 99;
      const orderB = weightB != null ? (WEIGHT_SORT_ORDER[weightB] ?? 99) : 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [formData.metadata.itemCategory, formData.metadata.itemSubtype, structuredGenre]);

  /** Chassis / aliases that share the selected art family (image applies to all of these). */
  const selectedItemArtFamilyMembers = useMemo(() => {
    const family = (formData.metadata.itemSubtype || '').trim();
    if (!family || formData.assetType !== 'Item Image') return [];
    const category = (formData.metadata.itemCategory || '').trim().toLowerCase();
    if (
      category !== 'weapons' &&
      category !== 'protection' &&
      category !== 'consumables'
    ) {
      return [];
    }
    const members = getItemArtFamilyMembers(family, structuredGenre);
    if (members.length === 0) return [family];
    return [...members].sort((a, b) => a.localeCompare(b));
  }, [formData.assetType, formData.metadata.itemCategory, formData.metadata.itemSubtype, structuredGenre]);
  const powerSubtypeOptions = useMemo(() => {
    const catalogTypes = [...getPowerImageSubtypes(formData.metadata.powerCategory || '')];
    const current = formData.metadata.powerSubtype?.trim();
    if (current && !catalogTypes.includes(current)) return [...catalogTypes, current];
    return catalogTypes;
  }, [formData.metadata.powerCategory, formData.metadata.powerSubtype]);
  const mountTypeOptions = useMemo(() => {
    const fromAssets = assets
      .filter(
        (asset) =>
          asset.assetType === 'Mount Portrait' &&
          assetMatchesStructuredGenre(asset.genre, formData.genre, structuredGenre)
      )
      .map((asset) => getStringMetadata(asset.metadata).mountType?.trim())
      .filter((value): value is string => Boolean(value));
    return mergeRideableTypeOptions(
      getCatalogRideableSuggestions(structuredGenre, 'mount'),
      fromAssets,
      formData.metadata.mountType
    );
  }, [assets, formData.genre, formData.metadata.mountType, structuredGenre]);
  const vehicleTypeOptions = useMemo(() => {
    const fromAssets = assets
      .filter(
        (asset) =>
          asset.assetType === 'Vehicle Portrait' &&
          assetMatchesStructuredGenre(asset.genre, formData.genre, structuredGenre)
      )
      .map((asset) => getStringMetadata(asset.metadata).vehicleType?.trim())
      .filter((value): value is string => Boolean(value));
    return mergeRideableTypeOptions(
      getCatalogRideableSuggestions(structuredGenre, 'vehicle'),
      fromAssets,
      formData.metadata.vehicleType
    );
  }, [assets, formData.genre, formData.metadata.vehicleType, structuredGenre]);
  const shipTypeOptions = useMemo(() => {
    const fromAssets = assets
      .filter(
        (asset) =>
          asset.assetType === 'Ship Portrait' &&
          assetMatchesStructuredGenre(asset.genre, formData.genre, structuredGenre)
      )
      .map((asset) => getStringMetadata(asset.metadata).shipType?.trim())
      .filter((value): value is string => Boolean(value));
    return mergeRideableTypeOptions(
      getCatalogRideableSuggestions(structuredGenre, 'ship'),
      fromAssets,
      formData.metadata.shipType
    );
  }, [assets, formData.genre, formData.metadata.shipType, structuredGenre]);
  const previewUploadOrder = useMemo(
    () => (editingAsset ? getTrailingUploadOrder(editingAsset.title) || 1 : getNextUploadOrder(assets, formData)),
    [assets, editingAsset, formData]
  );
  const generatedNamePreview = getGeneratedImageTitle(formData, previewUploadOrder);
  const generatedNameEndPreview =
    optimizedImages.length > 1
      ? getGeneratedImageTitle(formData, previewUploadOrder + optimizedImages.length - 1)
      : null;

  const resetForm = () => {
    optimizedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setFormData(initialForm);
    setEditingAsset(null);
    setOptimizedImages([]);
    setUploadMode(null);
    setPendingSingleFile(null);
    setTagDraft('');
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const resetFormAfterUpload = () => {
    optimizedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setEditingAsset(null);
    setOptimizedImages([]);
    setUploadMode(null);
    setPendingSingleFile(null);
    setTagDraft('');
    setErrorMessage(null);

    setFormData((current) => {
      const typeKey = PRIMARY_TYPE_METADATA_KEY[current.assetType];
      const preservedType = typeKey ? current.metadata[typeKey] : undefined;
      const metadata = {
        ...(typeKey && preservedType ? { [typeKey]: preservedType } : {}),
      } as Record<string, string>;
      const nextForm = {
        genre: current.genre,
        assetType: current.assetType,
        description: '',
        tags: [] as string[],
        metadata,
      };
      return {
        ...nextForm,
        tags: getTagsWithStructuredMetadata(nextForm),
      };
    });
  };

  const addTag = (value: string) => {
    const tag = toTitleCase(value);
    if (!tag || formData.tags.includes(tag)) return;
    setFormData((current) => ({ ...current, tags: [...current.tags, tag] }));
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    setFormData((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  };

  const parseTagList = (value: string) =>
    Array.from(
      new Set(
        value
          .split(',')
          .map((tag) => toTitleCase(tag))
          .filter(Boolean)
      )
    );

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagDraft);
    }
  };

  const clearOptimizedImages = () => {
    optimizedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setOptimizedImages([]);
  };

  const handleSingleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setPendingSingleFile(file);
    setUploadMode(null);
    clearOptimizedImages();
  };

  const handleSingleUploadChoice = async (mode: Exclude<UploadMode, 'grid'>) => {
    if (!pendingSingleFile) return;

    const file = pendingSingleFile;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsOptimizing(true);
    setUploadMode(mode);
    clearOptimizedImages();
    setPendingSingleFile(null);

    try {
      const optimized =
        mode === 'original' ? await optimizeImageToOriginalWebp(file) : await optimizeImageToSquare(file);
      const nextImages = [
        {
          ...optimized,
          sourceFileName: file.name,
          title: getTitleFromFileName(file.name),
        },
      ];
      setOptimizedImages(nextImages);
      setStatusMessage(
        mode === 'original'
          ? `1 Image Converted To ${optimized.width}px By ${optimized.height}px WebP.`
          : '1 Image Optimized To 500px By 500px WebP.'
      );
    } catch (error) {
      setOptimizedImages([]);
      setErrorMessage(error instanceof Error ? error.message : 'Image Optimization Failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGridFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setIsOptimizing(true);
    setUploadMode('grid');
    clearOptimizedImages();

    try {
      const optimizedFileGroups = await Promise.all(
        files.map(async (file) => {
          const optimizedGrid = await optimizeImageToSquareGrid(file);
          const baseTitle = getTitleFromFileName(file.name);

          return optimizedGrid.map((optimized, index) => {
            const suffix = index + 1;
            return {
              ...optimized,
              sourceFileName: getSuffixedFileName(file.name, suffix),
              title: `${baseTitle} ${suffix}`,
            };
          });
        })
      );
      const nextImages = optimizedFileGroups.flat();

      setOptimizedImages(nextImages);
      setStatusMessage(
        `${files.length} ${files.length === 1 ? 'Grid' : 'Grids'} Extracted Into ${nextImages.length} Images And Optimized To 500px By 500px.`
      );
    } catch (error) {
      setOptimizedImages([]);
      setErrorMessage(error instanceof Error ? error.message : 'Image Grid Extraction Failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleEdit = (asset: ImageAsset) => {
    optimizedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setEditingAsset(asset);
    const assetType = normalizeAssetTypeForForm(asset.assetType);
    const metadata = getStringMetadata(asset.metadata);
    // Show retired chassis under their art family in the upload form (genre-aware).
    if (assetType === 'Item Image' && metadata.itemSubtype) {
      const editGenre = getStructuredGenre(asset.genre as ImageGenre);
      metadata.itemSubtype = resolveItemArtFamily(metadata.itemSubtype, editGenre);
    }
    setFormData({
      genre: asset.genre,
      assetType,
      description: asset.description || '',
      tags: asset.tags || [],
      metadata,
    });
    setOptimizedImages([]);
    setUploadMode(null);
    setTagDraft('');
    setErrorMessage(null);
    setStatusMessage('Editing Metadata Only.');
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]
    );
  };

  const handleSelectVisible = () => {
    if (areAllVisibleSelected) {
      setSelectedAssetIds((current) => current.filter((id) => !visibleAssets.some((asset) => asset.id === id)));
      return;
    }

    setSelectedAssetIds((current) => Array.from(new Set([...current, ...visibleAssets.map((asset) => asset.id)])));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      if (formData.assetType === 'Origin Item') {
        const startingStoryId = formData.metadata.startingStoryId || '';
        if (!isOriginItemStartingStoryId(startingStoryId)) {
          throw new Error('Pick Which Origin Item This Picture Belongs To.');
        }
        const existingCount = getCount(originStoryCounts, startingStoryId);
        const isSameOriginEdit =
          Boolean(editingAsset) &&
          getStringMetadata(editingAsset?.metadata).startingStoryId === startingStoryId;
        if (existingCount > 0 && !isSameOriginEdit) {
          throw new Error(
            'This Origin Item Already Has An Image. Delete The Existing One To Replace It.'
          );
        }
      }

      const saveData =
        formData.assetType === 'Origin Item'
          ? { ...formData, genre: 'Any Genre' as ImageGenre }
          : formData;

      if (editingAsset) {
        const uploadOrder = getTrailingUploadOrder(editingAsset.title) || 1;
        await updateImageAsset(editingAsset.id, {
          ...saveData,
          tags: getTagsWithStructuredMetadata(saveData),
          title: getGeneratedImageTitle(saveData, uploadOrder),
          description: saveData.description.trim(),
        });
        resetForm();
        setStatusMessage('Image Metadata Updated.');
        return;
      }

      if (optimizedImages.length === 0) {
        throw new Error('Please Select And Optimize At Least One Image First.');
      }

      if (saveData.assetType === 'Origin Item' && optimizedImages.length > 1) {
        throw new Error('Origin Item Uploads One Picture Per Origin Item. Select A Single Image.');
      }

      const firstUploadOrder = getNextUploadOrder(assets, saveData);

      for (const [index, image] of optimizedImages.entries()) {
        await createImageAsset({
          ...saveData,
          tags: getTagsWithStructuredMetadata(saveData),
          title: getGeneratedImageTitle(saveData, firstUploadOrder + index),
          description: saveData.description.trim(),
          blob: image.blob,
          sizeBytes: image.outputSize,
          width: image.width,
          height: image.height,
        });
      }

      const uploadedCount = optimizedImages.length;
      resetFormAfterUpload();
      setStatusMessage(
        `${uploadedCount} ${uploadedCount === 1 ? 'Image' : 'Images'} Uploaded To Media Library.`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable To Save Image Asset.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchTag = async () => {
    const tags = parseTagList(batchTagDraft);
    if (selectedAssets.length === 0) {
      setErrorMessage('Select At Least One Image Asset First.');
      return;
    }
    if (tags.length === 0) {
      setErrorMessage('Add At Least One Tag First.');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsBatchSaving(true);

    try {
      await addTagsToImageAssets(selectedAssets, tags);
      setBatchTagDraft('');
      setStatusMessage(
        `${tags.length === 1 ? 'Tag' : 'Tags'} Added To ${selectedAssets.length} ${
          selectedAssets.length === 1 ? 'Image Asset' : 'Image Assets'
        }.`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable To Batch Tag Image Assets.'));
    } finally {
      setIsBatchSaving(false);
    }
  };

  const setMetadataField = (key: string, value: string) => {
    setFormData((current) => {
      const metadata = { ...current.metadata };
      if (value) {
        metadata[key] = value;
      } else {
        delete metadata[key];
      }

      if (key === 'itemCategory') {
        delete metadata.itemSubtype;
      }

      if (key === 'powerCategory') {
        delete metadata.powerSubtype;
      }

      if (key === 'monsterType') {
        const previousTypeName = current.metadata.monsterType || '';
        const previousSubtypeName = current.metadata.monsterSubtype || '';
        const previousLiveType = liveMonsterTypesByName[previousTypeName];
        const previousLiveSubtype = previousLiveType?.subtypes?.find(
          (s) => s.name === previousSubtypeName
        );

        const previousDescription =
          previousLiveSubtype?.visualDescription ??
          getMonsterSubtypeDescription(previousTypeName, previousSubtypeName);

        delete metadata.monsterSubtype;
        delete metadata.monsterSubtypeId;

        const nextTypeName = value;
        const nextLiveType = nextTypeName ? liveMonsterTypesByName[nextTypeName] : undefined;
        if (nextTypeName && nextLiveType?.id) {
          metadata.monsterTypeId = nextLiveType.id;
        } else {
          delete metadata.monsterTypeId;
        }
        const shouldClearDescription =
          !current.description.trim() || current.description.trim() === previousDescription.trim();
        const nextForm = {
          ...current,
          metadata,
          description: shouldClearDescription ? '' : current.description,
        };
        return {
          ...nextForm,
          tags: getTagsWithStructuredMetadata(nextForm),
        };
      }

      const nextForm = { ...current, metadata };
      if (NAMING_METADATA_KEYS[current.assetType].includes(key)) {
        return {
          ...nextForm,
          tags: getTagsWithStructuredMetadata(nextForm),
        };
      }

      return nextForm;
    });
  };

  const setMonsterSubtype = (subtypeName: string) => {
    setFormData((current) => {
      const metadata = { ...current.metadata };
      const previousTypeName = current.metadata.monsterType || '';
      const typeName = previousTypeName;
      const previousSubtypeName = current.metadata.monsterSubtype || '';

      const previousLiveType = liveMonsterTypesByName[previousTypeName];
      const previousLiveSubtype = previousLiveType?.subtypes?.find(
        (s) => s.name === previousSubtypeName
      );

      const previousDescription =
        previousLiveSubtype?.visualDescription ??
        getMonsterSubtypeDescription(previousTypeName, previousSubtypeName);

      if (subtypeName) {
        metadata.monsterSubtype = subtypeName;

        const liveType = liveMonsterTypesByName[typeName];
        const liveSubtype = liveType?.subtypes?.find((s) => s.name === subtypeName);
        if (liveSubtype?.id) {
          metadata.monsterSubtypeId = liveSubtype.id;
        } else {
          delete metadata.monsterSubtypeId;
        }
      } else {
        delete metadata.monsterSubtype;
        delete metadata.monsterSubtypeId;
      }

      const nextDescription = subtypeName
        ? liveMonsterTypesByName[typeName]?.subtypes?.find((s) => s.name === subtypeName)
            ?.visualDescription ?? getMonsterSubtypeDescription(typeName, subtypeName)
        : '';
      const shouldSeedDescription =
        !current.description.trim() || current.description.trim() === previousDescription.trim();

      const nextForm = {
        ...current,
        metadata,
        description: shouldSeedDescription ? nextDescription : current.description,
      };
      return {
        ...nextForm,
        tags: getTagsWithStructuredMetadata(nextForm),
      };
    });
  };

  const addCustomRaceOption = (value: string) => {
    const race = toTitleCase(value);
    if (!race || PORTRAIT_METADATA_OPTIONS.race.includes(race)) return;

    setCustomRacesByGenre((current) => {
      const currentOptions = current[formData.genre] || [];
      if (currentOptions.includes(race)) return current;

      const next = {
        ...current,
        [formData.genre]: [...currentOptions, race].sort((a, b) => a.localeCompare(b)),
      };
      window.localStorage.setItem(CUSTOM_RACES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleRaceBlur = () => {
    const race = toTitleCase(formData.metadata.race || '');
    setMetadataField('race', race);
    addCustomRaceOption(race);
    window.setTimeout(() => setIsRaceMenuOpen(false), 120);
  };

  const handleSecondaryRaceChange = async (value: string) => {
    if (!selectedPortraitRace) return;
    setErrorMessage(null);
    try {
      await saveSecondaryRace(secondaryImageryGenre, selectedPortraitRace, value);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable To Save Secondary Imagery.'));
    }
  };

  const handleDelete = async (asset: ImageAsset) => {
    if (!window.confirm(`Permanently Delete ${asset.title}?`)) return;

    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await deleteImageAsset(asset);
      if (editingAsset?.id === asset.id) {
        resetForm();
      }
      setSelectedAssetIds((current) => current.filter((id) => id !== asset.id));
      setStatusMessage('Image Asset Deleted.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable To Delete Image Asset.'));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAssets.length === 0) {
      setErrorMessage('Select At Least One Image Asset First.');
      return;
    }

    if (!window.confirm(`Permanently Delete ${selectedAssets.length} Selected Image Assets?`)) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setIsBatchSaving(true);

    try {
      await deleteImageAssets(selectedAssets);
      const deletedIds = new Set(selectedAssets.map((asset) => asset.id));
      if (editingAsset && deletedIds.has(editingAsset.id)) resetForm();
      if (selectedAsset && deletedIds.has(selectedAsset.id)) setSelectedAsset(null);
      setSelectedAssetIds([]);
      setStatusMessage(
        `${selectedAssets.length} ${selectedAssets.length === 1 ? 'Image Asset' : 'Image Assets'} Deleted.`
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable To Batch Delete Image Assets.'));
    } finally {
      setIsBatchSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Media Library"
        description="Upload and tag WebP image assets for game imagery."
      />

      {(statusMessage || errorMessage) && (
        <StatusBanner
          type={errorMessage ? 'error' : 'success'}
          message={errorMessage || statusMessage || ''}
          onDismiss={() => {
            setErrorMessage(null);
            setStatusMessage(null);
          }}
        />
      )}
      {facetsError && (
        <StatusBanner
          type="error"
          message={`Unable To Load Image Counts. ${facetsError}`}
        />
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <UploadCloud className="text-brand-accent" size={16} />
              {editingAsset ? 'Edit Image Metadata' : 'Upload Image Asset'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!editingAsset && (
                <div>
                  <label className="input-label">Upload Source</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-brand-primary bg-brand-bg p-3 text-center transition-colors hover:border-brand-accent">
                      <ImageIcon className="mb-2 text-brand-accent" size={28} />
                      <span className="text-xs font-medium text-brand-text">Single Image Frame</span>
                      <span className="mt-1 text-xs text-brand-text-muted">
                        Choose 500px Square Or Original Proportion WebP
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleSingleFileChange}
                        className="sr-only"
                      />
                    </label>

                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-brand-primary bg-brand-bg p-3 text-center transition-colors hover:border-brand-accent">
                      <div className="mb-2 grid h-7 w-7 grid-cols-2 gap-0.5 text-brand-accent">
                        <span className="rounded-sm border border-current" />
                        <span className="rounded-sm border border-current" />
                        <span className="rounded-sm border border-current" />
                        <span className="rounded-sm border border-current" />
                      </div>
                      <span className="text-xs font-medium text-brand-text">2x2 Grid Extraction</span>
                      <span className="mt-1 text-xs text-brand-text-muted">
                        Upload Grids To Extract 4 Images Each. Center Grid Line Is Skipped.
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        onChange={handleGridFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {isOptimizing && <p className="mt-2 text-xs text-brand-text-muted">Optimizing Images...</p>}
                  {optimizedImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-brand-primary bg-brand-bg p-2 text-center">
                        <div className="grid max-h-48 w-full grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">
                          {optimizedImages.map((image) => (
                            <img
                              key={image.previewUrl}
                              src={image.previewUrl}
                              alt={`${image.title} Preview`}
                              className={`w-full rounded-lg bg-black/40 ${
                                uploadMode === 'original' ? 'h-20 object-contain' : 'aspect-square object-cover'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-brand-text">
                          {uploadMode === 'grid'
                            ? `${optimizedImages.length} Extracted Images Ready To Upload`
                            : uploadMode === 'original'
                              ? '1 Original-Proportion Image Ready To Upload'
                              : '1 Square Image Ready To Upload'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                        <span className="badge-muted truncate">
                          {optimizedImages.length === 1
                            ? optimizedImages[0].sourceFileName
                            : `${optimizedImages.length} Files`}
                        </span>
                        <span className="badge-accent">
                          {optimizedImages[0].width === optimizedImages[0].height
                            ? `${optimizedImages[0].width}px Square`
                            : `${optimizedImages[0].width}px By ${optimizedImages[0].height}px`}
                        </span>
                        <span>
                          Original:{' '}
                          {formatBytes(optimizedImages.reduce((total, image) => total + image.sourceSize, 0))}
                        </span>
                        <span>
                          Optimized:{' '}
                          {formatBytes(optimizedImages.reduce((total, image) => total + image.outputSize, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <fieldset
                disabled={countsPending}
                className="min-w-0 space-y-3 border-0 p-0 m-0 disabled:opacity-100"
              >
              {countsPending && (
                <p
                  className="flex items-center gap-1.5 text-xs text-brand-text-muted"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 size={12} className="shrink-0 animate-spin text-brand-accent" />
                  Loading Image Counts
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="input-label">Genre</label>
                  <CountPendingControl loading={countsPending}>
                  <select
                    value={formData.genre}
                    disabled={countsPending || formData.assetType === 'Origin Item'}
                    onChange={(event) => {
                      const nextGenre = event.target.value as ImageGenre;
                      const allowedTypes = getAssetTypeOptionsForGenre(nextGenre);
                      const nextAssetType = allowedTypes.includes(formData.assetType)
                        ? formData.assetType
                        : 'Character Portrait';
                      setFormData((current) => {
                        const nextForm = {
                          ...current,
                          genre: nextGenre,
                          assetType: nextAssetType,
                          metadata: {},
                          description: nextAssetType === 'Monster Portrait' ? current.description : '',
                          tags: [] as string[],
                        };
                        return {
                          ...nextForm,
                          tags: getTagsWithStructuredMetadata(nextForm),
                        };
                      });
                    }}
                    className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                    title={
                      formData.assetType === 'Origin Item'
                        ? 'Origin Item Always Uses Any Genre'
                        : undefined
                    }
                  >
                    {IMAGE_GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {formatOptionLabel(genre, getCount(genreCounts, genre))}
                      </option>
                    ))}
                  </select>
                  </CountPendingControl>
                </div>

                <div>
                  <label className="input-label">Asset Type</label>
                  <CountPendingControl loading={countsPending}>
                  <select
                    value={formData.assetType}
                    disabled={countsPending}
                    onChange={(event) => {
                      const nextAssetType = event.target.value as ImageAssetType;
                      setFormData((current) => {
                        const nextForm = {
                          ...current,
                          genre:
                            nextAssetType === 'Origin Item' ? ('Any Genre' as ImageGenre) : current.genre,
                          assetType: nextAssetType,
                          metadata: {},
                          description: '',
                          tags: [] as string[],
                        };
                        return {
                          ...nextForm,
                          tags: getTagsWithStructuredMetadata(nextForm),
                        };
                      });
                    }}
                    className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {getAssetTypeOptionsForGenre(formData.genre).map((assetType) => (
                      <option key={assetType} value={assetType}>
                        {formatOptionLabel(assetType, getCount(formAssetTypeCounts, assetType))}
                      </option>
                    ))}
                  </select>
                  </CountPendingControl>
                </div>
              </div>

              {isPortraitAssetType(formData.assetType) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="input-label">Portrait Gender</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.gender || ''}
                        disabled={countsPending}
                        onChange={(event) => setMetadataField('gender', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {formatOptionLabel('Any Gender', formAssetTypeTotal)}
                        </option>
                        {PORTRAIT_METADATA_OPTIONS.gender.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(option, getCount(portraitGenderCounts, option))}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="input-label mb-0">Portrait Race</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOnlyUncoveredRaces((prev) => !prev)}
                            disabled={raceFieldPending}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                              onlyUncoveredRaces
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-brand-primary/30 text-brand-text-muted hover:text-brand-text border border-transparent'
                            }`}
                            title="Filter race list to races with 0 uploaded portraits"
                          >
                            Needs Artwork
                            {dynamicUncoveredRaceCount > 0 && ` (${dynamicUncoveredRaceCount})`}
                          </button>
                          <button
                            type="button"
                            onClick={() => refetchDiscoveredRaces()}
                            disabled={isFetchingDiscoveredRaces || raceFieldPending}
                            className="rounded p-0.5 text-brand-text-muted hover:text-brand-text transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            title="Refresh discovered races from realms and library"
                          >
                            <RotateCw
                              size={11}
                              className={isFetchingDiscoveredRaces ? 'animate-spin' : ''}
                            />
                          </button>
                        </div>
                      </div>
                      <CountPendingControl loading={raceFieldPending}>
                      <div className="relative">
                        <input
                          value={formData.metadata.race || ''}
                          disabled={raceFieldPending}
                          onChange={(event) => {
                            setMetadataField('race', event.target.value);
                            setIsRaceMenuOpen(true);
                          }}
                          onFocus={() => {
                            if (!raceFieldPending) setIsRaceMenuOpen(true);
                          }}
                          onBlur={handleRaceBlur}
                          className="input-field pr-9 disabled:cursor-not-allowed disabled:opacity-60"
                          placeholder="Any Race"
                        />
                        <button
                          type="button"
                          disabled={raceFieldPending}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setIsRaceMenuOpen((current) => !current)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-text-muted hover:text-brand-text disabled:cursor-not-allowed"
                          aria-label="Toggle Race Options"
                        >
                          v
                        </button>
                        {isRaceMenuOpen && !raceFieldPending && (
                          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-y-auto rounded-lg border border-brand-primary bg-brand-bg p-1 shadow-xl">
                            {filteredPortraitRaceOptions.map((option) => {
                              const count = getCount(portraitRaceCounts, option);
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setMetadataField('race', option);
                                    addCustomRaceOption(option);
                                    setIsRaceMenuOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-body-sm text-brand-text hover:bg-brand-primary/30"
                                >
                                  <span>{option}</span>
                                  {count === 0 ? (
                                    <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400">
                                      0 Portraits
                                    </span>
                                  ) : (
                                    <span className="text-xs text-brand-text-muted">
                                      ({count})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                            {filteredPortraitRaceOptions.length === 0 && (
                              <div className="px-2 py-1.5 text-body-sm text-brand-text-muted">
                                {onlyUncoveredRaces
                                  ? 'No Uncovered Races Found'
                                  : 'Type A New Race Name'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      </CountPendingControl>

                      {selectedPortraitRace && (
                        <div className="mt-3">
                          <label className="input-label">Secondary Imagery</label>
                          <CountPendingControl loading={countsPending}>
                          <select
                            value={currentSecondaryRace}
                            onChange={(event) => {
                              void handleSecondaryRaceChange(event.target.value);
                            }}
                            disabled={countsPending || isSavingSecondaryImagery}
                            className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">None</option>
                            {secondaryRaceOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatOptionLabel(option, getCount(portraitRaceCounts, option))}
                              </option>
                            ))}
                          </select>
                          </CountPendingControl>
                          <p className="mt-1 text-xs text-brand-text-muted">
                            Uses This Race's Portraits First, Then The Selected Race.
                          </p>
                        </div>
                      )}

                      {selectedRaceInfo?.appearance && (
                        <div className="mt-2.5 rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2 text-xs text-brand-text-muted space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-medium text-brand-text">
                              <Sparkles size={13} className="text-brand-accent" />
                              <span>{selectedRaceInfo.race} Visual Guide</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(selectedRaceInfo.appearance, 'race-prompt')
                              }
                              className="flex items-center gap-1 rounded bg-brand-primary/30 px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary hover:bg-brand-primary/50 hover:text-brand-text transition-colors"
                              title="Copy Visual Appearance To Clipboard"
                            >
                              {copiedField === 'race-prompt' ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div>
                            <span className="font-semibold text-brand-text">Visual Appearance: </span>
                            <span className="text-brand-text-secondary leading-relaxed">
                              {selectedRaceInfo.appearance}
                            </span>
                          </div>

                          {selectedRaceInfo.themes && selectedRaceInfo.themes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              <span className="font-semibold text-brand-text mr-1">Themes:</span>
                              {selectedRaceInfo.themes.map((theme) => (
                                <span
                                  key={theme}
                                  className="rounded bg-brand-bg/80 px-1.5 py-0.5 text-[10px] text-brand-text-muted"
                                >
                                  {theme}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hasStructuredMetadataFields(formData.assetType) && (
                <div className="space-y-3 rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2">
                  <div>
                    <label className="input-label mb-0">Structured Details</label>
                    <p className="text-xs text-brand-text-muted">
                      Dropdowns Save Cleaner Metadata For Future Game Matching.
                    </p>
                  </div>

                {formData.assetType === 'Point Of Interest Image' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="input-label">Point Of Interest Type</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.poiBaseType || ''}
                        disabled={countsPending}
                        onChange={(event) => setMetadataField('poiBaseType', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {formatOptionLabel('Any Type', formAssetTypeTotal)}
                        </option>
                        {POI_TAG_SUGGESTIONS[structuredGenre].baseTypes.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(option, getCount(poiTypeCounts, option))}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                    </div>
                    <div>
                      <label className="input-label">Point Of Interest Subtype</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.poiModifier || ''}
                        disabled={countsPending}
                        onChange={(event) => setMetadataField('poiModifier', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {formatOptionLabel('Any Subtype', formAssetTypeTotal)}
                        </option>
                        {POI_TAG_SUGGESTIONS[structuredGenre].modifiers.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(option, getCount(poiSubtypeCounts, option))}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                    </div>
                  </div>
                )}

                {formData.assetType === 'Zone Image' && (
                  <div>
                    <label className="input-label">Terrain Type</label>
                    <CountPendingControl loading={countsPending}>
                    <select
                      value={formData.metadata.terrainType || ''}
                      disabled={countsPending}
                      onChange={(event) => setMetadataField('terrainType', event.target.value)}
                      className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {formatOptionLabel('Any Terrain', formAssetTypeTotal)}
                      </option>
                      {zoneTerrainOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatOptionLabel(option, getCount(zoneTerrainCounts, option))}
                        </option>
                      ))}
                    </select>
                    </CountPendingControl>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      Open-World Zone Art For This Genre. Must Match The RPG Terrain Type (E.g. Forest, Orbital).
                    </p>
                  </div>
                )}

                {formData.assetType === 'Item Image' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="input-label">Item Category</label>
                        <CountPendingControl loading={countsPending}>
                        <select
                          value={formData.metadata.itemCategory || ''}
                          disabled={countsPending}
                          onChange={(event) => setMetadataField('itemCategory', event.target.value)}
                          className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {formatOptionLabel('Any Category', formAssetTypeTotal)}
                          </option>
                          {ITEM_CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {formatOptionLabel(option, getCount(itemCategoryCounts, option))}
                            </option>
                          ))}
                        </select>
                        </CountPendingControl>
                      </div>
                      <div>
                        <label className="input-label">Art Family</label>
                        <CountPendingControl loading={countsPending}>
                        <select
                          value={
                            formData.metadata.itemSubtype
                              ? resolveItemArtFamily(formData.metadata.itemSubtype, structuredGenre)
                              : ''
                          }
                          onChange={(event) => setMetadataField('itemSubtype', event.target.value)}
                          className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={countsPending || !formData.metadata.itemCategory}
                        >
                          <option value="">
                            {formatOptionLabel('Any Art Family', itemSubtypeTotal)}
                          </option>
                          {itemSubtypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatArtFamilyOptionLabel(
                                option,
                                getCount(itemSubtypeCounts, option),
                                structuredGenre,
                                formData.metadata.itemCategory
                              )}
                            </option>
                          ))}
                        </select>
                        </CountPendingControl>
                      </div>
                    </div>
                    {selectedItemArtFamilyMembers.length > 0 && (
                      <p className="text-xs text-brand-text-muted">
                        Applies To: {selectedItemArtFamilyMembers.join(', ')}.
                      </p>
                    )}
                  </div>
                )}

                {formData.assetType === 'Power Image' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="input-label">Power Category</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.powerCategory || ''}
                        disabled={countsPending}
                        onChange={(event) => setMetadataField('powerCategory', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {formatOptionLabel('Any Category', formAssetTypeTotal)}
                        </option>
                        {POWER_IMAGE_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(option, getCount(powerCategoryCounts, option))}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                    </div>
                    <div>
                      <label className="input-label">Power Subtype</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.powerSubtype || ''}
                        onChange={(event) => setMetadataField('powerSubtype', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={countsPending || !formData.metadata.powerCategory}
                      >
                        <option value="">
                          {formatOptionLabel('Any Subtype', powerSubtypeTotal)}
                        </option>
                        {powerSubtypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatOptionLabel(option, getCount(powerSubtypeCounts, option))}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                    </div>
                  </div>
                )}

                {formData.assetType === 'Origin Item' && (() => {
                  const selectedOrigin = ORIGIN_ITEM_OPTIONS.find(
                    (option) => option.id === formData.metadata.startingStoryId
                  );
                  return (
                    <div>
                      <label className="input-label">Origin Item</label>
                      <CountPendingControl loading={countsPending}>
                      <select
                        value={formData.metadata.startingStoryId || ''}
                        disabled={countsPending}
                        onChange={(event) => setMetadataField('startingStoryId', event.target.value)}
                        className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select Origin Item</option>
                        {ORIGIN_ITEM_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {formatOptionLabel(
                              `${option.name} (${option.storyTitle})`,
                              getCount(originStoryCounts, option.id)
                            )}
                          </option>
                        ))}
                      </select>
                      </CountPendingControl>
                      {selectedOrigin && (
                        <div className="mt-2 rounded-md border border-brand-border/40 bg-brand-surface/60 p-2.5 text-xs text-brand-text-muted">
                          <p>
                            <span className="font-semibold text-brand-text">Origin Story:</span>{' '}
                            {selectedOrigin.storyTitle}
                            <span className="mx-1.5 text-brand-border">•</span>
                            <span className="font-semibold text-brand-text">Item Type:</span>{' '}
                            {selectedOrigin.itemType}
                          </p>
                          <p className="mt-1 leading-relaxed text-brand-text-secondary">
                            <span className="font-semibold text-brand-text">Description:</span>{' '}
                            {selectedOrigin.description}
                          </p>
                        </div>
                      )}
                      <p className="mt-1.5 text-xs text-brand-text-muted">
                        One Picture Per Origin Item. Genre Is Always Any Genre So The Live Game Can Find It.
                      </p>
                    </div>
                  );
                })()}

                {formData.assetType === 'Mount Portrait' && (
                  <div>
                    <label className="input-label">Template Name</label>
                    <CountPendingControl loading={countsPending}>
                    <select
                      value={formData.metadata.mountType || ''}
                      disabled={countsPending}
                      onChange={(event) => setMetadataField('mountType', event.target.value)}
                      className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {formatOptionLabel('Any Mount Type', formAssetTypeTotal)}
                      </option>
                      {mountTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatOptionLabel(option, getCount(mountTypeCounts, option))}
                        </option>
                      ))}
                    </select>
                    </CountPendingControl>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      Combat Mounts Sold At Stables For This Genre (E.g. War Destrier, Hover-Bike). Must Match The RPG Catalog Exactly.
                    </p>
                  </div>
                )}

                {formData.assetType === 'Vehicle Portrait' && (
                  <div>
                    <label className="input-label">Template Name</label>
                    <CountPendingControl loading={countsPending}>
                    <select
                      value={formData.metadata.vehicleType || ''}
                      disabled={countsPending}
                      onChange={(event) => setMetadataField('vehicleType', event.target.value)}
                      className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {formatOptionLabel('Any Vehicle Type', formAssetTypeTotal)}
                      </option>
                      {vehicleTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatOptionLabel(option, getCount(vehicleTypeCounts, option))}
                        </option>
                      ))}
                    </select>
                    </CountPendingControl>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      Travel Vehicles Sold At The Garage / Motor Pool For This Genre (E.g. Cargo Truck, Speeder Taxi). Must Match The RPG Catalog Exactly.
                    </p>
                  </div>
                )}

                {formData.assetType === 'Ship Portrait' && (
                  <div>
                    <label className="input-label">Template Name</label>
                    <CountPendingControl loading={countsPending}>
                    <select
                      value={formData.metadata.shipType || ''}
                      disabled={countsPending}
                      onChange={(event) => setMetadataField('shipType', event.target.value)}
                      className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {formatOptionLabel('Any Ship Type', formAssetTypeTotal)}
                      </option>
                      {shipTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatOptionLabel(option, getCount(shipTypeCounts, option))}
                        </option>
                      ))}
                    </select>
                    </CountPendingControl>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      Shipyard Templates For This Genre (E.g. War Galley, SWAT Command Van, Heavy Dreadnought). Must Match The RPG Catalog Exactly.
                    </p>
                  </div>
                )}

                {formData.assetType === 'Monster Portrait' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="input-label">Monster Type</label>
                        <CountPendingControl loading={countsPending}>
                        <select
                          value={formData.metadata.monsterType || ''}
                          disabled={countsPending}
                          onChange={(event) => setMetadataField('monsterType', event.target.value)}
                          className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {formatOptionLabel('Any Type', formAssetTypeTotal)}
                          </option>
                          {monsterTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatOptionLabel(option, getCount(monsterTypeCounts, option))}
                            </option>
                          ))}
                        </select>
                        </CountPendingControl>
                      </div>
                      <div>
                        <label className="input-label">Monster Subtype</label>
                        <CountPendingControl loading={countsPending}>
                        <select
                          value={formData.metadata.monsterSubtype || ''}
                          onChange={(event) => setMonsterSubtype(event.target.value)}
                          className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={countsPending || !formData.metadata.monsterType}
                        >
                          <option value="">
                            {formatOptionLabel('Any Subtype', monsterSubtypeTotal)}
                          </option>
                          {monsterSubtypeOptions.map((option) => (
                            <option key={option.name} value={option.name}>
                              {formatOptionLabel(
                                option.name,
                                getCount(monsterSubtypeCounts, option.name)
                              )}
                            </option>
                          ))}
                        </select>
                        </CountPendingControl>
                      </div>
                    </div>
                    {formData.metadata.monsterSubtype && (
                      <p className="help-text">
                        {selectedMonsterSubtypeVisualDescription}
                      </p>
                    )}
                    <div>
                      <label className="input-label">Portrait Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, description: event.target.value }))
                        }
                        className="input-field min-h-[72px]"
                        placeholder="Visual Description Used For Matching And Artist Reference"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                </div>
              )}
              </fieldset>

              <div>
                <label className="input-label">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add Tag And Press Enter"
                    className="input-field"
                  />
                  <button type="button" onClick={() => addTag(tagDraft)} className="btn-secondary">
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="badge-accent"
                      title="Remove Tag"
                    >
                      {tag}
                      <X size={10} />
                    </button>
                  ))}
                  {formData.tags.length === 0 && <span className="badge-muted">No Tags</span>}
                </div>
              </div>

              <div className="rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2">
                <label className="input-label mb-0">Naming Convention</label>
                <p className="mt-1 text-xs text-brand-text-muted">
                  Pattern: Genre + Asset Type + Structured Details + Upload Number.
                </p>
                <p className="mt-2 truncate text-xs font-medium text-brand-text">
                  {generatedNameEndPreview
                    ? `${generatedNamePreview} Through ${generatedNameEndPreview}`
                    : generatedNamePreview}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 pt-2">
                {editingAsset && (
                  <button type="button" onClick={resetForm} className="btn-ghost w-full">
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || isOptimizing || (!editingAsset && optimizedImages.length === 0)}
                  className="btn-primary w-full"
                >
                  <Save size={14} />
                  {isSaving ? 'Saving...' : editingAsset ? 'Save Metadata' : 'Upload Images'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-3.5">
            <div className="mb-3 space-y-3">
              <div>
                <h3 className="section-title flex items-center gap-2">
                  <Tags className="text-brand-accent" size={16} />
                  Image Assets ({totalAssetCount.toLocaleString()})
                </h3>
                <p className="card-subtitle">
                  Showing {visibleAssets.length} Of {totalAssetCount.toLocaleString()} Matching Image Assets
                  {countsPending
                    ? ' · Loading Counts…'
                    : isFetchingFacets
                      ? ' · Refreshing Counts…'
                      : isFetching && !loading
                        ? ' · Refreshing…'
                        : '.'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={13} />
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                    placeholder="Search"
                    className="input-field !pl-8"
                  />
                </div>
                <CountPendingControl loading={countsPending}>
                <select
                  value={filters.genre}
                  disabled={countsPending}
                  onChange={(event) => setFilters({ ...filters, genre: event.target.value })}
                  className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="All">
                    {formatOptionLabel('All Genres', facetRows.length)}
                  </option>
                  {IMAGE_GENRES.filter((genre) => genre !== 'Any Genre').map((genre) => (
                    <option key={genre} value={genre}>
                      {formatOptionLabel(genre, getCount(genreCounts, genre))}
                    </option>
                  ))}
                </select>
                </CountPendingControl>
                <CountPendingControl loading={countsPending}>
                <select
                  value={filters.assetType}
                  disabled={countsPending}
                  onChange={(event) => setFilters({ ...filters, assetType: event.target.value })}
                  className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="All">
                    {formatOptionLabel('All Asset Types', libraryAssetTypeTotal)}
                  </option>
                  {IMAGE_ASSET_TYPES.map((assetType) => (
                    <option key={assetType} value={assetType}>
                      {formatOptionLabel(assetType, getCount(libraryAssetTypeCounts, assetType))}
                    </option>
                  ))}
                </select>
                </CountPendingControl>
                <CountPendingControl loading={countsPending}>
                <select
                  value={filters.tag}
                  disabled={countsPending}
                  onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
                  className="input-field disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="All">
                    {formatOptionLabel('All Tags', libraryTagTotal)}
                  </option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {formatOptionLabel(tag, getCount(libraryTagCounts, tag))}
                    </option>
                  ))}
                </select>
                </CountPendingControl>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-brand-text">Supabase Free Tier Storage</p>
                  <p className="text-xs text-brand-text-muted">
                    Tracked Media Assets Use {formatBytes(totalStorageBytes)} Of {formatBytes(SUPABASE_FREE_STORAGE_LIMIT_BYTES)}.
                  </p>
                </div>
                <div className="text-xs font-medium text-brand-text">
                  {storageUsagePercent.toFixed(1)}% Used
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-primary">
                <div
                  className={`h-full rounded-full transition-all ${storageBarClassName}`}
                  style={{ width: `${storageUsagePercent}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-brand-text-muted">
                <span>{formatBytes(remainingStorageBytes)} Remaining</span>
                <span>Free Plan File Storage Limit: 1 GB</span>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-medium text-brand-text">
                    {selectedCount} {selectedCount === 1 ? 'Image Asset Selected' : 'Image Assets Selected'}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    Add Tags To Selected Images Or Delete Them In One Batch.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectVisible}
                    disabled={filteredAssets.length === 0 || isBatchSaving}
                    className="btn-secondary btn-sm"
                  >
                    {areAllVisibleSelected ? 'Deselect Visible' : `Select Visible (${visibleAssets.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAssetIds([])}
                    disabled={selectedCount === 0 || isBatchSaving}
                    className="btn-ghost btn-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {selectedCount > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <input
                    type="text"
                    value={batchTagDraft}
                    onChange={(event) => setBatchTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleBatchTag();
                      }
                    }}
                    placeholder="Add Batch Tags, Separated By Commas"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={handleBatchTag}
                    disabled={isBatchSaving || batchTagDraft.trim().length === 0}
                    className="btn-primary"
                  >
                    Add Tags
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    disabled={isBatchSaving}
                    className="btn-danger"
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs italic text-brand-text-muted">Loading Image Assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-brand-primary bg-brand-bg py-12 text-center text-xs italic text-brand-text-muted">
                No Image Assets Found.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {visibleAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className={`card group relative aspect-square w-full overflow-hidden ${
                        selectedAssetIds.includes(asset.id) ? 'ring-2 ring-brand-accent' : ''
                      }`}
                    >
                      <label
                        className="absolute left-2 top-2 z-10 flex cursor-pointer items-center rounded-md bg-black/70 p-1 text-xs text-white backdrop-blur"
                        onClick={(event) => event.stopPropagation()}
                        title={`Select ${asset.title}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                          className="h-3.5 w-3.5 accent-brand-accent"
                          aria-label={`Select ${asset.title}`}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className="relative h-full w-full bg-brand-bg text-left"
                        title={`Open ${asset.title}`}
                      >
                        <MediaGridItemImage
                          src={asset.publicUrl}
                          alt={asset.title}
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                          thumbnailWidth={240}
                        />
                        {(asset.assetType === 'Mount Portrait' ||
                          asset.assetType === 'Vehicle Portrait' ||
                          asset.assetType === 'Ship Portrait' ||
                          asset.assetType === 'Item Image' ||
                          asset.assetType === 'Power Image' ||
                          asset.assetType === 'Origin Item') &&
                          (() => {
                            const meta = getStringMetadata(asset.metadata);
                            const templateName =
                              asset.assetType === 'Item Image'
                                ? meta.itemSubtype
                                  ? resolveItemArtFamily(
                                      meta.itemSubtype,
                                      getStructuredGenre(asset.genre as ImageGenre)
                                    )
                                  : ''
                                : asset.assetType === 'Power Image'
                                  ? [meta.powerCategory, meta.powerSubtype].filter(Boolean).join(' · ')
                                  : asset.assetType === 'Origin Item'
                                    ? meta.startingStoryId
                                      ? getOriginItemDisplayName(meta.startingStoryId)
                                      : ''
                                  : meta.mountType || meta.vehicleType || meta.shipType;
                            return templateName ? (
                              <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 text-center text-[10px] font-medium leading-tight text-white backdrop-blur">
                                {templateName}
                              </span>
                            ) : null;
                          })()}
                      </button>
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(asset);
                          }}
                          className="btn-icon bg-black/60 text-white backdrop-blur hover:bg-brand-accent hover:text-black"
                          title="Edit Metadata"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(asset);
                          }}
                          className="btn-icon bg-black/60 text-white backdrop-blur hover:bg-red-500/80 hover:text-white"
                          title="Delete Image Asset"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="btn-secondary"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <span className="text-xs text-brand-text-muted tabular-nums">
                      Page {page} Of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      className="btn-secondary"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {pendingSingleFile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
          onClick={() => setPendingSingleFile(null)}
        >
          <div
            className="card w-full max-w-md p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="section-title mb-1">Choose Image Processing</h3>
                <p className="text-xs text-brand-text-muted">
                  {pendingSingleFile.name} Can Be Saved As A Square Game Frame Or Kept At Its Original Proportion For Reusable App Art.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingSingleFile(null)}
                className="btn-icon"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSingleUploadChoice('single')}
                className="rounded-lg border border-brand-primary bg-brand-bg p-3 text-left transition-colors hover:border-brand-accent"
              >
                <ImageIcon className="mb-2 text-brand-accent" size={22} />
                <span className="block text-xs font-medium text-brand-text">Square Game Frame</span>
                <span className="mt-1 block text-xs text-brand-text-muted">
                  Crop And Resize To 500px By 500px WebP.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSingleUploadChoice('original')}
                className="rounded-lg border border-brand-accent bg-brand-accent/10 p-3 text-left transition-colors hover:bg-brand-accent/15"
              >
                <ImageIcon className="mb-2 text-brand-accent" size={22} />
                <span className="block text-xs font-medium text-brand-text">Keep Original Proportion</span>
                <span className="mt-1 block text-xs text-brand-text-muted">
                  Convert To WebP Without Cropping Or Resizing.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAsset && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="card max-h-[92vh] w-full max-w-4xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border p-3">
              <div className="min-w-0">
                <h3 className="truncate text-title font-semibold text-brand-text">{selectedAsset.title}</h3>
                <p className="text-xs text-brand-text-muted">
                  {selectedAsset.genre} / {selectedAsset.assetType}
                </p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="btn-icon" title="Close">
                <X size={14} />
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-56px)] grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex items-center justify-center bg-black p-3">
                <img
                  src={selectedAsset.publicUrl}
                  alt={selectedAsset.title}
                  className="max-h-[72vh] max-w-full rounded-lg object-contain"
                />
              </div>

              <div className="space-y-3 border-t border-brand-border p-3 lg:border-l lg:border-t-0">
                {selectedAsset.description && (
                  <div>
                    <h4 className="input-label">Description</h4>
                    <p className="text-xs text-brand-text">{selectedAsset.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="input-label">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAsset.tags.length > 0 ? (
                      selectedAsset.tags.map((tag) => (
                        <span key={tag} className="badge-muted">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="badge-muted">No Tags</span>
                    )}
                  </div>
                </div>

                {Object.keys(selectedAsset.metadata || {}).length > 0 && (
                  <div>
                    <h4 className="input-label">Structured Details</h4>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {Object.entries(getStringMetadata(selectedAsset.metadata)).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-brand-text-muted">{toTitleCase(key.replace(/([A-Z])/g, ' $1'))}</span>
                          <span className="text-right text-brand-text">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                  <span>Width</span>
                  <span className="text-right text-brand-text">{selectedAsset.width}px</span>
                  <span>Height</span>
                  <span className="text-right text-brand-text">{selectedAsset.height}px</span>
                  <span>File Size</span>
                  <span className="text-right text-brand-text">{formatBytes(selectedAsset.sizeBytes || 0)}</span>
                  <span>Type</span>
                  <span className="text-right text-brand-text">{selectedAsset.mimeType}</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleEdit(selectedAsset);
                      setSelectedAsset(null);
                    }}
                    className="btn-secondary"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const assetToDelete = selectedAsset;
                      setSelectedAsset(null);
                      handleDelete(assetToDelete);
                    }}
                    className="btn-danger"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
