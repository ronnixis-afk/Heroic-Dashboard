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
import { optimizeImageToSquare, OptimizedImageResult } from '../../lib/imageOptimizer';

const QUICK_TAGS: Record<ImageAssetType, string[]> = {
  'Character Portrait': ['Male', 'Female', 'Human', 'Elf', 'Dwarf', 'Orc', 'Draconic', 'Undead', 'Beastfolk'],
  'Point Of Interest Image': ['Settlement', 'Dungeon', 'Tavern', 'Temple', 'Ruins', 'Castle', 'Cave', 'Wilderness'],
  'Zone Image': ['Forest', 'Desert', 'Mountain', 'Coast', 'Swamp', 'Urban', 'Arctic', 'Volcanic'],
  'Item Image': ['Weapon', 'Armor', 'Potion', 'Scroll', 'Relic', 'Gem', 'Tool', 'Food'],
};

const POI_TAG_SUGGESTIONS: Record<ImageGenre, { baseTypes: string[]; modifiers: string[] }> = {
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

const ZONE_TAG_SUGGESTIONS: Record<ImageGenre, Record<string, string[]>> = {
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
  gender: ['Male', 'Female', 'Nonbinary', 'Androgynous', 'Unknown'],
  race: ['Human', 'Elf', 'Dwarf', 'Orc', 'Draconic', 'Undead', 'Beastfolk', 'Construct', 'Alien', 'Synthetic'],
};

const ITEM_METADATA_OPTIONS = {
  itemCategory: ['Weapon', 'Armor', 'Consumable', 'Relic', 'Material', 'Tool', 'Currency', 'Quest Item'],
  itemSubtype: ['Sword', 'Bow', 'Firearm', 'Shield', 'Potion', 'Scroll', 'Gem', 'Key', 'Food', 'Device'],
};

const initialForm = {
  title: '',
  description: '',
  genre: 'Fantasy' as ImageGenre,
  assetType: 'Character Portrait' as ImageAssetType,
  tags: [] as string[],
  metadata: {} as Record<string, string>,
};

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const getStringMetadata = (metadata: Record<string, unknown> | null | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries(metadata || {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );

export default function AdminMedia() {
  const { assets, loading, createImageAsset, updateImageAsset, deleteImageAsset } = useImageAssets();
  const [formData, setFormData] = useState(initialForm);
  const [editingAsset, setEditingAsset] = useState<ImageAsset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImageAsset | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImageResult | null>(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'All',
    assetType: 'All',
    tag: 'All',
  });

  useEffect(() => {
    return () => {
      if (optimizedImage?.previewUrl) {
        URL.revokeObjectURL(optimizedImage.previewUrl);
      }
    };
  }, [optimizedImage?.previewUrl]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach((asset) => asset.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !search ||
        asset.title.toLowerCase().includes(search) ||
        (asset.description || '').toLowerCase().includes(search) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(search)) ||
        Object.values(asset.metadata || {}).some((value) => String(value).toLowerCase().includes(search));
      const matchesGenre = filters.genre === 'All' || asset.genre === filters.genre;
      const matchesType = filters.assetType === 'All' || asset.assetType === filters.assetType;
      const matchesTag = filters.tag === 'All' || asset.tags.includes(filters.tag);

      return matchesSearch && matchesGenre && matchesType && matchesTag;
    });
  }, [assets, filters]);

  const zonePropertyOptions = useMemo(() => Object.keys(ZONE_TAG_SUGGESTIONS[formData.genre]), [formData.genre]);
  const zoneQualityOptions = useMemo(
    () => ZONE_TAG_SUGGESTIONS[formData.genre][formData.metadata.zoneProperty] || [],
    [formData.genre, formData.metadata.zoneProperty]
  );

  const resetForm = () => {
    if (optimizedImage?.previewUrl) {
      URL.revokeObjectURL(optimizedImage.previewUrl);
    }
    setFormData(initialForm);
    setEditingAsset(null);
    setOptimizedImage(null);
    setSourceFileName('');
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

  const removeTag = (tag: string) => {
    setFormData((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagDraft);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setStatusMessage(null);
    setIsOptimizing(true);
    setSourceFileName(file.name);

    try {
      const optimized = await optimizeImageToSquare(file);
      if (optimizedImage?.previewUrl) {
        URL.revokeObjectURL(optimizedImage.previewUrl);
      }
      setOptimizedImage(optimized);
      setStatusMessage('Image Optimized To 500px By 500px.');
    } catch (error) {
      setOptimizedImage(null);
      setErrorMessage(error instanceof Error ? error.message : 'Image Optimization Failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleEdit = (asset: ImageAsset) => {
    if (optimizedImage?.previewUrl) {
      URL.revokeObjectURL(optimizedImage.previewUrl);
    }
    setEditingAsset(asset);
    setFormData({
      title: asset.title,
      description: asset.description || '',
      genre: asset.genre,
      assetType: asset.assetType,
      tags: asset.tags || [],
      metadata: getStringMetadata(asset.metadata),
    });
    setOptimizedImage(null);
    setSourceFileName('');
    setTagDraft('');
    setErrorMessage(null);
    setStatusMessage('Editing Metadata Only.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      if (editingAsset) {
        await updateImageAsset(editingAsset.id, formData);
        resetForm();
        setStatusMessage('Image Metadata Updated.');
        return;
      }

      if (!optimizedImage) {
        throw new Error('Please Select And Optimize An Image First.');
      }

      await createImageAsset({
        ...formData,
        blob: optimizedImage.blob,
        sizeBytes: optimizedImage.outputSize,
      });
      resetForm();
      setStatusMessage('Image Uploaded To Media Library.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Save Image Asset.');
    } finally {
      setIsSaving(false);
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
      setStatusMessage('Image Asset Deleted.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Delete Image Asset.');
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
                  <label className="input-label">Image File</label>
                  <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-brand-primary bg-brand-bg p-3 text-center transition-colors hover:border-brand-accent">
                    {optimizedImage ? (
                      <img
                        src={optimizedImage.previewUrl}
                        alt="Optimized Preview"
                        className="h-36 w-36 rounded-lg object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="mb-2 text-brand-accent" size={28} />
                        <span className="text-xs font-medium text-brand-text">Select Image To Optimize</span>
                        <span className="mt-1 text-xs text-brand-text-muted">
                          Output Will Be 500px By 500px WebP
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  {isOptimizing && <p className="mt-2 text-xs text-brand-text-muted">Optimizing Image...</p>}
                  {optimizedImage && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                      <span className="badge-muted truncate">{sourceFileName}</span>
                      <span className="badge-accent">{optimizedImage.width}px Square</span>
                      <span>Original: {formatBytes(optimizedImage.sourceSize)}</span>
                      <span>Optimized: {formatBytes(optimizedImage.outputSize)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="input-label">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Elven Ranger Portrait"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Short notes for future matching and accessibility."
                  className="input-field !h-auto resize-none py-2"
                />
              </div>

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
                <label className="input-label">General Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS[formData.assetType].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="badge-muted hover:border-brand-accent hover:text-brand-text"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-brand-primary/50 bg-brand-bg/50 p-2">
                <div>
                  <label className="input-label mb-0">Structured Details</label>
                  <p className="text-xs text-brand-text-muted">
                    Dropdowns Save Cleaner Metadata For Future Game Matching.
                  </p>
                </div>

                {formData.assetType === 'Character Portrait' && (
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
                        {POI_TAG_SUGGESTIONS[formData.genre].baseTypes.map((option) => (
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
                        {POI_TAG_SUGGESTIONS[formData.genre].modifiers.map((option) => (
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

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                {editingAsset && (
                  <button type="button" onClick={resetForm} className="btn-ghost">
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || isOptimizing || (!editingAsset && !optimizedImage)}
                  className="btn-primary"
                >
                  <Save size={14} />
                  {isSaving ? 'Saving...' : editingAsset ? 'Save Metadata' : 'Upload Image'}
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
                <p className="card-subtitle">Filter And Manage Uploaded Game Imagery.</p>
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

            {loading ? (
              <div className="py-12 text-center text-xs italic text-brand-text-muted">Loading Image Assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-brand-primary bg-brand-bg py-12 text-center text-xs italic text-brand-text-muted">
                No Image Assets Found.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,180px))] justify-start gap-3">
                {filteredAssets.map((asset) => (
                  <div key={asset.id} className="card group relative aspect-square w-full overflow-hidden">
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
