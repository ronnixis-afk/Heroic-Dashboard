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
} from 'lucide-react';
import { PageHeader, StatusBanner } from '../../components/ui';
import {
  IMAGE_ASSET_TYPES,
  IMAGE_GENRES,
  ImageAsset,
  ImageAssetType,
  ImageGenre,
  useImageAssets,
} from '../../hooks/useImageAssets';
import { formatBytes } from '../../lib/utils';
import {
  optimizeImageToOriginalWebp,
  optimizeImageToSquare,
  optimizeImageToSquareGrid,
  OptimizedImageResult,
} from '../../lib/imageOptimizer';
import {
  getMonsterSubtypeDescription,
  getMonsterSubtypes,
  getMonsterTypeNames,
} from '../../constants/monsterPortraitCatalog';

type SpecificImageGenre = Exclude<ImageGenre, 'Any Genre'>;

const MONSTER_TYPE_OPTIONS = getMonsterTypeNames();
const BASE_IMAGE_ASSET_TYPES = IMAGE_ASSET_TYPES.filter((assetType) => assetType !== 'Monster Portrait');
const getAssetTypeOptionsForGenre = (genre: ImageGenre): ImageAssetType[] =>
  genre === 'Any Genre' ? [...IMAGE_ASSET_TYPES] : BASE_IMAGE_ASSET_TYPES;
const TAG_GROUPS = [
  {
    label: 'Warrior',
    tags: ['Fighter', 'Warrior', 'Martial'],
  },
  {
    label: 'Rogue',
    tags: ['Ranger', 'Rogue', 'Sniper', 'Hunter', 'Scout'],
  },
  {
    label: 'Caster',
    tags: ['Mage', 'Magician', 'Wizard', 'Sorcerer', 'Spellcaster'],
  },
] as const;

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

const ZONE_TAG_SUGGESTIONS: Record<SpecificImageGenre, Record<string, string[]>> = {
  Fantasy: {
    'Mana Density': ['Dead Zone', 'Normal', 'Highly Saturated', 'Wild / Unstable'],
    'Mythic Threat Level': ['Mundane Beasts', 'Goblinoid Hordes', 'Undead Infestation', 'Apex / Dragon Territory'],
    'Leyline Connectivity': ['Isolated', 'Nexus Point', 'Corrupted Leyline', 'Ancient Conduit'],
    'Divine Alignment': ['Blessed By Light', 'Forsaken', 'Cursed', 'Ancient Pagan'],
    'Dominant Terrain / Biome': ['Whispering Woods', 'Scorched Wasteland', 'Floating Archipelagos', 'Crystal Caverns'],
    'Socio-Political State': ['Feudal Kingdom', 'Theocracy', 'Lawless Frontier', 'Elven Isolationists'],
    'Weather Anomaly': ['Eternal Twilight', 'Blood Rain', 'Chrono-Storms', 'Ash-Fall'],
    'Ruins And Relics': ['Untouched First-Age Ruins', 'Looted Tombs', 'Awakened Colossi', 'Sunken Temple'],
    'Resource Abundance': ['Rare Herbs', 'Rich Mythril Ore', 'Barren / Starving', 'Abundant Game'],
    'Local Superstition / Law': ['Magic Is Outlawed', 'Strangers Are Sacrificed', 'Always Leave An Offering', 'Silence Is Mandatory'],
  },
  Modern: {
    'Urban Density': ['Sprawling Metropolis', 'Claustrophobic Slums', 'Abandoned Industrial', 'High-Rise Elite'],
    'Corporate Control': ['Company Town', 'Contested Turf', 'Independent / Mom-And-Pop', 'Corporate Black Site'],
    'Underworld Activity': ['Heavily Policed / Safe', 'Yakuza Territory', 'Petty Gang War', 'Hacker Haven'],
    'Technological Integration': ['Smart City', 'Decaying / Analog', 'Heavy Surveillance', 'Underground / Retro-Tech'],
    'Socioeconomic Status': ['One-Percenter Enclave', 'Working Class', 'Destitute / Homeless', 'Gentrified Heights'],
    'Environmental Hazard': ['Heavy Smog / Pollution', 'Biohazard Quarantine', 'Pristine / Gated Parkland', 'Toxic Landfill'],
    'Law Enforcement Presence': ['Militarized Riot Police', 'Private Pmc Security', 'Corrupt Cops', 'Lawless Vigilantes'],
    'Media Influence': ['Heavy Propaganda', 'Pirate Radio Broadcasts', 'Complete Info-Blackout', 'Viral Social Media'],
    'Hidden Subculture': ['Underground Fight Clubs', 'Doomsday Prepper Cult', 'Vigilante Network', 'Secret Rave Scene'],
    'Infrastructure State': ['Gentrified', 'Under Construction', 'Crumbling / Condemned', 'Reclaimed By Nature'],
  },
  'Sci-Fi': {
    'Stellar Proximity': ['Deep Space / Rogue Planet', 'Binary Star Orbit', 'Black Hole Event Horizon', 'Nebula Core'],
    'Atmospheric And Biosphere State': ['Toxic / Acidic', 'Fully Terraformed', 'Vacuum / Airless', 'Nanite-Infested Biosphere'],
    'Dominant Species / Authority': ['Human Colony Alliance', 'Alien Hive Mind', 'Synthetic / AI Overlords', 'Multi-Species Hub'],
    'Tech Level Rating': ['Pre-Ftl Primitives', 'Post-Scarcity Utopia', 'Scavenger / Junker Fleet', 'Type-Ii Civilization'],
    'Gravity And Physics Modifier': ['Zero-G Station', 'Crushing High Gravity', 'Variable / Flickering Gravity', 'Flickering Space-Time'],
    'Interstellar Trade Status': ['Major Galactic Hub', 'Blockaded / Embargoed', 'Uncharted / Wild Space', 'Abandoned Trade Route'],
    'Cosmic Hazard': ['Lethal Solar Flares', 'Dense Asteroid Field', 'Subspace Rifts', 'Ionized Radiation Belt'],
    'Political Allegiance': ['Galactic Federation Core', 'Rebel Outpost', 'Pirate Warlord Territory', 'Neutral Research Zone'],
    'Primary Output': ['Rare Isotope Mining', 'Agrarian / Food Production', 'Antimatter Refineries', 'Starship Drydocks'],
    'Anomalous Phenomenon': ['Time Dilation Field', 'Psionic Echo Chamber', 'Derelict Dyson Sphere', 'Synthetic Virus Outbreak'],
  },

};

const PORTRAIT_METADATA_OPTIONS = {
  gender: ['Male', 'Female'],
  race: ['Human', 'Elf', 'Dwarf', 'Orc', 'Halfling/Gnome'],
};

const CUSTOM_RACES_STORAGE_KEY = 'heroic-dashboard-custom-portrait-races';
const LEGACY_NPC_PORTRAIT_TYPES = new Set(['Service NPC Portrait']);
const PORTRAIT_RACE_ASSET_TYPES = new Set(['Character Portrait', 'NPC Portrait', 'Service NPC Portrait']);

const normalizeAssetTypeForForm = (assetType: string): ImageAssetType =>
  LEGACY_NPC_PORTRAIT_TYPES.has(assetType) ? 'NPC Portrait' : (assetType as ImageAssetType);

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
 * Suggested custom races beyond the core five — same names for Fantasy, Sci-Fi, and Modern
 * so uploads and world races stay aligned across genres.
 */
const SUGGESTED_PORTRAIT_RACES = [
  'Vampire',
  'Werewolf',
  'Goblin',
  'Troll',
  'Demon',
  'Angel',
  'Undead',
  'Ghost',
  'Giant',
  'Fey',
] as const;

const getSuggestedPortraitRacesForGenre = (_genre: ImageGenre): string[] => [...SUGGESTED_PORTRAIT_RACES];

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
  assetType === 'Character Portrait' || assetType === 'NPC Portrait';

const getStructuredGenre = (genre: ImageGenre): SpecificImageGenre =>
  genre === 'Any Genre' ? 'Fantasy' : genre;

const ITEM_METADATA_OPTIONS = {
  itemCategory: ['Weapon', 'Armor', 'Consumable', 'Relic', 'Material', 'Tool', 'Currency', 'Quest Item'],
  itemSubtype: ['Sword', 'Bow', 'Firearm', 'Shield', 'Potion', 'Scroll', 'Gem', 'Key', 'Food', 'Device'],
};

const initialForm = {
  genre: 'Fantasy' as ImageGenre,
  assetType: 'Character Portrait' as ImageAssetType,
  description: '',
  tags: [] as string[],
  metadata: {} as Record<string, string>,
};

const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const MEDIA_GRID_PAGE_SIZE = 60;

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
  'NPC Portrait': ['race', 'gender'],
  'Monster Portrait': ['monsterType', 'monsterSubtype'],
  'Point Of Interest Image': ['poiBaseType', 'poiModifier'],
  'Zone Image': ['zoneProperty', 'zoneQuality'],
  'Item Image': ['itemCategory', 'itemSubtype'],
  'App Assets': [],
};

const hasStructuredMetadataFields = (assetType: ImageAssetType) =>
  assetType === 'Point Of Interest Image' ||
  assetType === 'Zone Image' ||
  assetType === 'Item Image' ||
  assetType === 'Monster Portrait';

/** Primary "Type" field kept after a successful upload for faster repeat uploads. */
const PRIMARY_TYPE_METADATA_KEY: Partial<Record<ImageAssetType, string>> = {
  'Character Portrait': 'race',
  'NPC Portrait': 'race',
  'Monster Portrait': 'monsterType',
  'Point Of Interest Image': 'poiBaseType',
  'Zone Image': 'zoneProperty',
  'Item Image': 'itemCategory',
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getNamingMetadataValues = (input: NamingInput) =>
  NAMING_METADATA_KEYS[input.assetType].map((key) => input.metadata[key]).filter(Boolean);

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
  MONSTER_TYPE_OPTIONS.forEach((typeName) => {
    options.add(typeName);
    getMonsterSubtypes(typeName).forEach((subtype) => options.add(subtype.name));
  });
  return options;
})();

const getManagedStructuredTagOptions = (assetType: ImageAssetType): Set<string> => {
  if (assetType === 'Character Portrait') {
    return new Set([...PORTRAIT_METADATA_OPTIONS.race, ...PORTRAIT_METADATA_OPTIONS.gender]);
  }
  if (assetType === 'NPC Portrait') {
    return new Set([...PORTRAIT_METADATA_OPTIONS.race, ...PORTRAIT_METADATA_OPTIONS.gender]);
  }
  if (assetType === 'Monster Portrait') {
    return ALL_MONSTER_PORTRAIT_TAG_OPTIONS;
  }
  return new Set();
};

const getTagsWithStructuredMetadata = (input: typeof initialForm) => {
  const selectionTags = [
    input.genre,
    input.assetType,
    ...NAMING_METADATA_KEYS[input.assetType].map((key) => input.metadata[key]),
  ].filter(Boolean);
  const managedTags = getManagedStructuredTagOptions(input.assetType);
  const baseTags =
    managedTags.size > 0
      ? input.tags.filter((tag) => !managedTags.has(tag))
      : input.tags;

  return Array.from(new Set([...baseTags, ...selectionTags]));
};

export default function AdminMedia() {
  const {
    assets,
    totalAssetCount,
    loading,
    createImageAsset,
    updateImageAsset,
    addTagsToImageAssets,
    deleteImageAsset,
    deleteImageAssets,
  } = useImageAssets();
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
  const [visibleAssetCount, setVisibleAssetCount] = useState(MEDIA_GRID_PAGE_SIZE);
  const [customRacesByGenre, setCustomRacesByGenre] = useState<Record<string, string[]>>({});
  const [isRaceMenuOpen, setIsRaceMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'All',
    assetType: 'All',
    tag: 'All',
  });

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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach((asset) => asset.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const searchTerms = filters.search
      .split(/[,\s]+/)
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean);

    return assets.filter((asset) => {
      const searchableValues = [
        asset.title,
        asset.description || '',
        asset.genre,
        normalizeAssetTypeForForm(asset.assetType),
        ...asset.tags,
        ...Object.values(asset.metadata || {}).map((value) => String(value)),
      ].map((value) => value.toLowerCase());
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every((term) => searchableValues.some((value) => value.includes(term)));
      // "Any Genre" in the filter means no genre restriction (upload form still uses the literal value).
      const matchesGenre =
        filters.genre === 'All' ||
        filters.genre === 'Any Genre' ||
        asset.genre === filters.genre;
      const matchesType = filters.assetType === 'All' || normalizeAssetTypeForForm(asset.assetType) === filters.assetType;
      const matchesTag = filters.tag === 'All' || asset.tags.includes(filters.tag);

      return matchesSearch && matchesGenre && matchesType && matchesTag;
    });
  }, [assets, filters]);

  useEffect(() => {
    setVisibleAssetCount(MEDIA_GRID_PAGE_SIZE);
  }, [filters]);

  const visibleAssets = useMemo(
    () => filteredAssets.slice(0, visibleAssetCount),
    [filteredAssets, visibleAssetCount]
  );
  const hiddenAssetCount = Math.max(0, filteredAssets.length - visibleAssets.length);
  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedAssetIds.includes(asset.id)),
    [assets, selectedAssetIds]
  );
  const selectedCount = selectedAssets.length;
  const areAllVisibleSelected =
    visibleAssets.length > 0 && visibleAssets.every((asset) => selectedAssetIds.includes(asset.id));
  const totalStorageBytes = useMemo(
    () => assets.reduce((total, asset) => total + (asset.sizeBytes || 0), 0),
    [assets]
  );
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
        getCatalogPortraitRaces(assets, formData.genre),
        customRacesByGenre[formData.genre] || [],
        // Keep cross-genre customs discoverable while typing on Any Genre uploads.
        formData.genre === 'Any Genre' ? Object.values(customRacesByGenre).flat() : []
      ),
    [assets, customRacesByGenre, formData.genre]
  );
  const filteredPortraitRaceOptions = useMemo(() => {
    const raceQuery = (formData.metadata.race || '').trim().toLowerCase();
    if (!raceQuery) return portraitRaceOptions;
    return portraitRaceOptions.filter((option) => option.toLowerCase().includes(raceQuery));
  }, [formData.metadata.race, portraitRaceOptions]);

  const structuredGenre = getStructuredGenre(formData.genre);
  const zonePropertyOptions = useMemo(() => Object.keys(ZONE_TAG_SUGGESTIONS[structuredGenre]), [structuredGenre]);
  const zoneQualityOptions = useMemo(
    () => ZONE_TAG_SUGGESTIONS[structuredGenre][formData.metadata.zoneProperty] || [],
    [structuredGenre, formData.metadata.zoneProperty]
  );
  const monsterSubtypeOptions = useMemo(
    () => getMonsterSubtypes(formData.metadata.monsterType || ''),
    [formData.metadata.monsterType]
  );
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

  const addTagGroup = (tags: readonly string[]) => {
    setFormData((current) => {
      const nextTags = [...current.tags];
      tags.forEach((value) => {
        const tag = toTitleCase(value);
        if (tag && !nextTags.includes(tag)) {
          nextTags.push(tag);
        }
      });
      return { ...current, tags: nextTags };
    });
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
    setFormData({
      genre: assetType === 'Monster Portrait' ? 'Any Genre' : asset.genre,
      assetType,
      description: asset.description || '',
      tags: asset.tags || [],
      metadata: getStringMetadata(asset.metadata),
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
      if (editingAsset) {
        const uploadOrder = getTrailingUploadOrder(editingAsset.title) || 1;
        await updateImageAsset(editingAsset.id, {
          ...formData,
          tags: getTagsWithStructuredMetadata(formData),
          title: getGeneratedImageTitle(formData, uploadOrder),
          description: formData.description.trim(),
        });
        resetForm();
        setStatusMessage('Image Metadata Updated.');
        return;
      }

      if (optimizedImages.length === 0) {
        throw new Error('Please Select And Optimize At Least One Image First.');
      }

      const firstUploadOrder = getNextUploadOrder(assets, formData);

      for (const [index, image] of optimizedImages.entries()) {
        await createImageAsset({
          ...formData,
          tags: getTagsWithStructuredMetadata(formData),
          title: getGeneratedImageTitle(formData, firstUploadOrder + index),
          description: formData.description.trim(),
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

      if (key === 'zoneProperty') {
        delete metadata.zoneQuality;
      }

      if (key === 'monsterType') {
        const previousDescription = getMonsterSubtypeDescription(
          current.metadata.monsterType || '',
          current.metadata.monsterSubtype || ''
        );
        delete metadata.monsterSubtype;
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
      const previousDescription = getMonsterSubtypeDescription(
        current.metadata.monsterType || '',
        current.metadata.monsterSubtype || ''
      );

      if (subtypeName) {
        metadata.monsterSubtype = subtypeName;
      } else {
        delete metadata.monsterSubtype;
      }

      const nextDescription = subtypeName
        ? getMonsterSubtypeDescription(current.metadata.monsterType || '', subtypeName)
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
                        Upload Grids To Extract 4 Images Each
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="input-label">Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(event) => {
                      const nextGenre = event.target.value as ImageGenre;
                      const allowedTypes = getAssetTypeOptionsForGenre(nextGenre);
                      const nextAssetType = allowedTypes.includes(formData.assetType)
                        ? formData.assetType
                        : 'Character Portrait';
                      setFormData({
                        ...formData,
                        genre: nextGenre,
                        assetType: nextAssetType,
                        metadata: {},
                        description: nextAssetType === 'Monster Portrait' ? formData.description : '',
                      });
                    }}
                    className="input-field"
                  >
                    {IMAGE_GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Asset Type</label>
                  <select
                    value={formData.assetType}
                    onChange={(event) => {
                      const nextAssetType = event.target.value as ImageAssetType;
                      setFormData({
                        ...formData,
                        genre: nextAssetType === 'Monster Portrait' ? 'Any Genre' : formData.genre,
                        assetType: nextAssetType,
                        metadata: {},
                        description: '',
                      });
                    }}
                    className="input-field"
                  >
                    {getAssetTypeOptionsForGenre(formData.genre).map((assetType) => (
                      <option key={assetType} value={assetType}>
                        {assetType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isPortraitAssetType(formData.assetType) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="input-label">Portrait Gender</label>
                      <select
                        value={formData.metadata.gender || ''}
                        onChange={(event) => setMetadataField('gender', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Gender</option>
                        {PORTRAIT_METADATA_OPTIONS.gender.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Portrait Race</label>
                      <div className="relative">
                        <input
                          value={formData.metadata.race || ''}
                          onChange={(event) => {
                            setMetadataField('race', event.target.value);
                            setIsRaceMenuOpen(true);
                          }}
                          onFocus={() => setIsRaceMenuOpen(true)}
                          onBlur={handleRaceBlur}
                          className="input-field pr-9"
                          placeholder="Any Race"
                        />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setIsRaceMenuOpen((current) => !current)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-text-muted hover:text-brand-text"
                          aria-label="Toggle Race Options"
                        >
                          v
                        </button>
                        {isRaceMenuOpen && (
                          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-y-auto rounded-lg border border-brand-primary bg-brand-bg p-1 shadow-xl">
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setMetadataField('race', '');
                                setIsRaceMenuOpen(false);
                              }}
                              className="w-full rounded-md px-2 py-1.5 text-left text-body-sm text-brand-text-muted hover:bg-brand-primary/30 hover:text-brand-text"
                            >
                              Any Race
                            </button>
                            {filteredPortraitRaceOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setMetadataField('race', option);
                                  addCustomRaceOption(option);
                                  setIsRaceMenuOpen(false);
                                }}
                                className="w-full rounded-md px-2 py-1.5 text-left text-body-sm text-brand-text hover:bg-brand-primary/30"
                              >
                                {option}
                              </button>
                            ))}
                            {filteredPortraitRaceOptions.length === 0 && (
                              <div className="px-2 py-1.5 text-body-sm text-brand-text-muted">
                                Type A New Race Name
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-brand-text-muted">
                        Core Races, Genre Suggestions, And Races Already Used On Uploaded Portraits. Type A New Name To Add A Custom Race.
                      </p>
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
                      <select
                        value={formData.metadata.poiBaseType || ''}
                        onChange={(event) => setMetadataField('poiBaseType', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Type</option>
                        {POI_TAG_SUGGESTIONS[structuredGenre].baseTypes.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Point Of Interest Subtype</label>
                      <select
                        value={formData.metadata.poiModifier || ''}
                        onChange={(event) => setMetadataField('poiModifier', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Subtype</option>
                        {POI_TAG_SUGGESTIONS[structuredGenre].modifiers.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.assetType === 'Zone Image' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="input-label">Zone Property</label>
                      <select
                        value={formData.metadata.zoneProperty || ''}
                        onChange={(event) => setMetadataField('zoneProperty', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Property</option>
                        {zonePropertyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Zone Quality</label>
                      <select
                        value={formData.metadata.zoneQuality || ''}
                        onChange={(event) => setMetadataField('zoneQuality', event.target.value)}
                        className="input-field"
                        disabled={!formData.metadata.zoneProperty}
                      >
                        <option value="">Any Quality</option>
                        {zoneQualityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.assetType === 'Item Image' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="input-label">Item Type</label>
                      <select
                        value={formData.metadata.itemCategory || ''}
                        onChange={(event) => setMetadataField('itemCategory', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Type</option>
                        {ITEM_METADATA_OPTIONS.itemCategory.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Item Subtype</label>
                      <select
                        value={formData.metadata.itemSubtype || ''}
                        onChange={(event) => setMetadataField('itemSubtype', event.target.value)}
                        className="input-field"
                      >
                        <option value="">Any Subtype</option>
                        {ITEM_METADATA_OPTIONS.itemSubtype.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.assetType === 'Monster Portrait' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="input-label">Monster Type</label>
                        <select
                          value={formData.metadata.monsterType || ''}
                          onChange={(event) => setMetadataField('monsterType', event.target.value)}
                          className="input-field"
                        >
                          <option value="">Any Type</option>
                          {MONSTER_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Monster Subtype</label>
                        <select
                          value={formData.metadata.monsterSubtype || ''}
                          onChange={(event) => setMonsterSubtype(event.target.value)}
                          className="input-field"
                          disabled={!formData.metadata.monsterType}
                        >
                          <option value="">Any Subtype</option>
                          {monsterSubtypeOptions.map((option) => (
                            <option key={option.name} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {formData.metadata.monsterSubtype && (
                      <p className="help-text">
                        {getMonsterSubtypeDescription(
                          formData.metadata.monsterType || '',
                          formData.metadata.monsterSubtype
                        )}
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

              <div>
                <label className="input-label">Tag Groups</label>
                <div className="space-y-2">
                  {TAG_GROUPS.map((group) => (
                    <div key={group.label} className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addTagGroup(group.tags)}
                        className="badge-accent hover:border-brand-accent hover:text-brand-text"
                        title={`Add All ${group.label} Tags`}
                      >
                        {group.label}
                      </button>
                      {group.tags.map((tag) => (
                        <button
                          key={`${group.label}-${tag}`}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="badge-muted hover:border-brand-accent hover:text-brand-text"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ))}
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

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                {editingAsset && (
                  <button type="button" onClick={resetForm} className="btn-ghost">
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || isOptimizing || (!editingAsset && optimizedImages.length === 0)}
                  className="btn-primary"
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
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="section-title flex items-center gap-2">
                  <Tags className="text-brand-accent" size={16} />
                  Image Assets ({totalAssetCount.toLocaleString()})
                </h3>
                <p className="card-subtitle">
                  Showing {visibleAssets.length} Of {filteredAssets.length} Filtered Image Assets
                  {totalAssetCount > assets.length ? ` (${assets.length.toLocaleString()} Loaded).` : '.'}
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
                <select
                  value={filters.genre}
                  onChange={(event) => setFilters({ ...filters, genre: event.target.value })}
                  className="input-field"
                >
                  <option value="All">All Genres</option>
                  {IMAGE_GENRES.filter((genre) => genre !== 'Any Genre').map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.assetType}
                  onChange={(event) => setFilters({ ...filters, assetType: event.target.value })}
                  className="input-field"
                >
                  <option value="All">All Asset Types</option>
                  {IMAGE_ASSET_TYPES.map((assetType) => (
                    <option key={assetType} value={assetType}>
                      {assetType}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.tag}
                  onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
                  className="input-field"
                >
                  <option value="All">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
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
                        className="h-full w-full bg-brand-bg text-left"
                        title={`Open ${asset.title}`}
                      >
                        <img
                          src={asset.publicUrl}
                          alt={asset.title}
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                          loading="lazy"
                        />
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
                {hiddenAssetCount > 0 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleAssetCount((current) => current + MEDIA_GRID_PAGE_SIZE)}
                      className="btn-secondary"
                    >
                      Show More ({Math.min(MEDIA_GRID_PAGE_SIZE, hiddenAssetCount)} Of {hiddenAssetCount} Remaining)
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
