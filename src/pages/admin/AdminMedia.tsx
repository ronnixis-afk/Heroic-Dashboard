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
import { PageHeader } from '../../components/ui';
import {
  IMAGE_ASSET_TYPES,
  IMAGE_GENRES,
  ImageAsset,
  ImageAssetType,
  ImageGenre,
  useImageAssets,
} from '../../hooks/useImageAssets';
import { formatBytes } from '../../lib/utils';
import { optimizeImageToSquare, optimizeImageToSquareGrid, OptimizedImageResult } from '../../lib/imageOptimizer';

type SpecificImageGenre = Exclude<ImageGenre, 'Any Genre'>;

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
  Magitech: {
    baseTypes: [
      'Etheric Spire',
      'Synchronized Citadel',
      'Prime-Logic Depot',
      'Essence-Forge Precinct',
      'Crystal-Link Relay',
      'Arcane Factory',
      'Golemetric Lab',
      'Pneumatic Transit Hub',
      'Alchemical Refinery',
      'Levitation Platform',
    ],
    modifiers: [
      'Leaking Raw Resonance',
      'Overclocked / Unstable',
      'Abandoned / Corroded',
      'Highly Pressurized',
      'Automated / Guarded',
      'Flux-Corrupted',
      'Techno-Arcane Shielded',
      'Drained Of Power',
      'Vibrating With Resonance',
      'Experimental / Top-Secret',
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
  Magitech: {
    'Etheric Vibrancy': ['Harmonic / Empowering', 'Dissonant / Damaging', 'Null-Magic Void', 'Pulsing Resonance'],
    'Technomantic Infrastructure': ['Automated Celestial Network', 'Rune-Gate Hub', 'Resonance-Forges', 'Aetheric Railroads'],
    'Power Source': ['Captured Dying Star', 'Mass Essence-Extractors', 'Crystal-Flux Cores', 'Volatile Void-Siphons'],
    'Ruling Caste': ['Arch-Mage Syndicate', 'Cyber-Lich Dynasty', 'Artificer Guilds', 'Order Of The Prime-Logic'],
    'Construct Population': ['Sentient Reinforced Colossi', 'Bound Stellar Elementals', 'Homunculi Workforce', 'Rogue Golem Swarms'],
    'Astral Alignment': ['Planar Convergence', 'Void-Touched / Eldritch', 'Celestially Shielded', 'Echoes Of Other-Self'],
    'Space-Time Stability': ['Temporal Echoes', 'Warped Gravity Wells', 'Stasis Fields', 'Chrono-Flicker'],
    'Travel Medium': ['Flux-Currents', 'Ancient Warp-Gates', 'Void-Skimmer Docks', 'Astral Rifts'],
    'Arcane Hazard': ['Wild Magic Storms', 'Resonance Fallout Zones', 'Ethereal Parasite Swarms', 'Arcane Leakage'],
    'Planetary Biome': ['Biomechanical Flora', 'Liquid Mercury Oceans', 'Crystalline Forests', 'Molten Glass Plains'],
  },
};

const PORTRAIT_METADATA_OPTIONS = {
  gender: ['Male', 'Female'],
  race: ['Human', 'Elf', 'Dwarf', 'Orc', 'Halfling/Gnome'],
};

const isPortraitAssetType = (assetType: ImageAssetType) =>
  assetType === 'Character Portrait' || assetType === 'Monster Portrait';

const getStructuredGenre = (genre: ImageGenre): SpecificImageGenre =>
  genre === 'Any Genre' ? 'Fantasy' : genre;

const ITEM_METADATA_OPTIONS = {
  itemCategory: ['Weapon', 'Armor', 'Consumable', 'Relic', 'Material', 'Tool', 'Currency', 'Quest Item'],
  itemSubtype: ['Sword', 'Bow', 'Firearm', 'Shield', 'Potion', 'Scroll', 'Gem', 'Key', 'Food', 'Device'],
};

const initialForm = {
  genre: 'Fantasy' as ImageGenre,
  assetType: 'Character Portrait' as ImageAssetType,
  tags: [] as string[],
  metadata: {} as Record<string, string>,
};

const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const MEDIA_GRID_PAGE_SIZE = 60;

interface OptimizedImageDraft extends OptimizedImageResult {
  sourceFileName: string;
  title: string;
}

type UploadMode = 'single' | 'grid';

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

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
  'Monster Portrait': ['race', 'gender'],
  'Point Of Interest Image': ['poiBaseType', 'poiModifier'],
  'Zone Image': ['zoneProperty', 'zoneQuality'],
  'Item Image': ['itemCategory', 'itemSubtype'],
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

const getTagsWithStructuredMetadata = (input: typeof initialForm) => {
  const metadataTags =
    isPortraitAssetType(input.assetType)
      ? [input.metadata.race, input.metadata.gender].filter(Boolean)
      : [];
  const portraitMetadataOptions = [...PORTRAIT_METADATA_OPTIONS.race, ...PORTRAIT_METADATA_OPTIONS.gender];
  const baseTags =
    isPortraitAssetType(input.assetType)
      ? input.tags.filter((tag) => !portraitMetadataOptions.includes(tag))
      : input.tags;

  return Array.from(new Set([...baseTags, ...metadataTags]));
};

export default function AdminMedia() {
  const {
    assets,
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [visibleAssetCount, setVisibleAssetCount] = useState(MEDIA_GRID_PAGE_SIZE);
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
        ...asset.tags,
        ...Object.values(asset.metadata || {}).map((value) => String(value)),
      ].map((value) => value.toLowerCase());
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every((term) => searchableValues.some((value) => value.includes(term)));
      const matchesGenre = filters.genre === 'All' || asset.genre === filters.genre;
      const matchesType = filters.assetType === 'All' || asset.assetType === filters.assetType;
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

  const structuredGenre = getStructuredGenre(formData.genre);
  const zonePropertyOptions = useMemo(() => Object.keys(ZONE_TAG_SUGGESTIONS[structuredGenre]), [structuredGenre]);
  const zoneQualityOptions = useMemo(
    () => ZONE_TAG_SUGGESTIONS[structuredGenre][formData.metadata.zoneProperty] || [],
    [structuredGenre, formData.metadata.zoneProperty]
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
    setTagDraft('');
    setErrorMessage(null);
    setStatusMessage(null);
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
    setIsOptimizing(true);
    setUploadMode('single');
    clearOptimizedImages();

    try {
      const optimized = await optimizeImageToSquare(file);
      const nextImages = [
        {
          ...optimized,
          sourceFileName: file.name,
          title: getTitleFromFileName(file.name),
        },
      ];
      setOptimizedImages(nextImages);
      setStatusMessage('1 Image Optimized To 500px By 500px.');
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
    setFormData({
      genre: asset.genre,
      assetType: asset.assetType,
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
          description: '',
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
          description: '',
          blob: image.blob,
          sizeBytes: image.outputSize,
        });
      }

      const uploadedCount = optimizedImages.length;
      resetForm();
      setStatusMessage(
        `${uploadedCount} ${uploadedCount === 1 ? 'Image' : 'Images'} Uploaded To Media Library.`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Save Image Asset.');
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Batch Tag Image Assets.');
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

      return { ...current, metadata };
    });
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Delete Image Asset.');
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Batch Delete Image Assets.');
    } finally {
      setIsBatchSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Media Library"
        description="Upload Optimized 500px Image Assets For Future Game Imagery."
      />

      {(statusMessage || errorMessage) && (
        <div className={errorMessage ? 'badge-danger' : 'badge-success'}>
          {errorMessage || statusMessage}
        </div>
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
                        Upload 1 Image To Become 500px By 500px WebP
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
                              className="aspect-square w-full rounded-lg object-cover"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-brand-text">
                          {uploadMode === 'grid'
                            ? `${optimizedImages.length} Extracted Images Ready To Upload`
                            : '1 Image Ready To Upload'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                        <span className="badge-muted truncate">
                          {optimizedImages.length === 1
                            ? optimizedImages[0].sourceFileName
                            : `${optimizedImages.length} Files`}
                        </span>
                        <span className="badge-accent">{optimizedImages[0].width}px Square</span>
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
                    onChange={(event) =>
                      setFormData({ ...formData, genre: event.target.value as ImageGenre, metadata: {} })
                    }
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
                    onChange={(event) =>
                      setFormData({ ...formData, assetType: event.target.value as ImageAssetType, metadata: {} })
                    }
                    className="input-field"
                  >
                    {IMAGE_ASSET_TYPES.map((assetType) => (
                      <option key={assetType} value={assetType}>
                        {assetType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isPortraitAssetType(formData.assetType) && (
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
                    <select
                      value={formData.metadata.race || ''}
                      onChange={(event) => setMetadataField('race', event.target.value)}
                      className="input-field"
                    >
                      <option value="">Any Race</option>
                      {PORTRAIT_METADATA_OPTIONS.race.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
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

              {!isPortraitAssetType(formData.assetType) && (
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
                </div>
              )}

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
                  Image Assets ({filteredAssets.length})
                </h3>
                <p className="card-subtitle">
                  Showing {visibleAssets.length} Of {filteredAssets.length} Filtered Image Assets.
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
                  {IMAGE_GENRES.map((genre) => (
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,180px))] justify-start gap-3">
                  {visibleAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className={`card group relative aspect-square w-full overflow-hidden ${
                        selectedAssetIds.includes(asset.id) ? 'ring-2 ring-brand-accent' : ''
                      }`}
                    >
                      <label
                        className="absolute left-2 top-2 z-10 flex cursor-pointer items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white backdrop-blur"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                          className="h-3.5 w-3.5 accent-brand-accent"
                          aria-label={`Select ${asset.title}`}
                        />
                        Select
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
