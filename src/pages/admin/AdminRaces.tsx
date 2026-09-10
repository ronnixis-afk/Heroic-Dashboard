import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Feather,
  Loader2,
  Lock,
  Mountain,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  EmptyState,
  FilterTabs,
  PageHeader,
  PageLoader,
  StatCard,
  StatusBanner,
} from '../../components/ui';
import {
  useRaceCatalog,
  type Race,
  type RaceGenre,
  type RacePayload,
} from '../../hooks/useRaceCatalog';

type GenreTab = 'All' | 'Fantasy' | 'Modern' | 'Sci-Fi';
type StatusTab = 'All' | 'Enabled' | 'Disabled';

const GENRES: RaceGenre[] = ['Fantasy', 'Modern', 'Sci-Fi'];

const ABILITY_OPTIONS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

interface RaceFormData {
  name: string;
  genres: RaceGenre[];
  appearance: string;
  archetypeThemes: string;
  defaultAbilityBonus: string;
  hasFly: boolean;
  flySpeed: number;
  hasClimb: boolean;
  climbSpeed: number;
  hasSwim: boolean;
  swimSpeed: number;
  enabled: boolean;
}

const EMPTY_FORM: RaceFormData = {
  name: '',
  genres: ['Fantasy'],
  appearance: '',
  archetypeThemes: '',
  defaultAbilityBonus: 'strength',
  hasFly: false,
  flySpeed: 30,
  hasClimb: false,
  climbSpeed: 30,
  hasSwim: false,
  swimSpeed: 30,
  enabled: true,
};

function raceToFormData(race: Race): RaceFormData {
  return {
    name: race.name,
    genres: race.genres && race.genres.length > 0 ? race.genres : ['Fantasy'],
    appearance: race.appearance || '',
    archetypeThemes: (race.archetypeThemes || []).join(', '),
    defaultAbilityBonus: race.defaultAbilityBonus || 'strength',
    hasFly: race.flySpeed > 0,
    flySpeed: race.flySpeed > 0 ? race.flySpeed : 30,
    hasClimb: race.climbSpeed > 0,
    climbSpeed: race.climbSpeed > 0 ? race.climbSpeed : 30,
    hasSwim: race.swimSpeed > 0,
    swimSpeed: race.swimSpeed > 0 ? race.swimSpeed : 30,
    enabled: race.enabled,
  };
}

export default function AdminRaces() {
  const { races, isLoading, error, refetch, createRace, updateRace, deleteRace } = useRaceCatalog();

  const [selectedGenre, setSelectedGenre] = useState<GenreTab>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [formData, setFormData] = useState<RaceFormData>(EMPTY_FORM);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filtered races
  const filteredRaces = useMemo(() => {
    return races.filter((race) => {
      if (selectedGenre !== 'All' && !race.genres?.includes(selectedGenre as RaceGenre)) {
        return false;
      }
      if (selectedStatus === 'Enabled' && !race.enabled) return false;
      if (selectedStatus === 'Disabled' && race.enabled) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = race.name.toLowerCase().includes(query);
        const matchesAppearance = race.appearance?.toLowerCase().includes(query);
        const matchesThemes = race.archetypeThemes?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesAppearance && !matchesThemes) return false;
      }
      return true;
    });
  }, [races, selectedGenre, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = races.length;
    const winged = races.filter((r) => r.flySpeed > 0).length;
    const climbers = races.filter((r) => r.climbSpeed > 0).length;
    const swimmers = races.filter((r) => r.swimSpeed > 0).length;
    return { total, winged, climbers, swimmers };
  }, [races]);

  const handleOpenCreate = () => {
    setEditingRace(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (race: Race) => {
    setEditingRace(race);
    setFormData(raceToFormData(race));
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditingRace(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('Please Enter A Valid Race Name.');
      return;
    }
    if (formData.genres.length === 0) {
      setFormError('Please Select At Least One Genre.');
      return;
    }

    const payload: RacePayload = {
      name: trimmedName,
      genres: formData.genres,
      appearance: formData.appearance.trim(),
      archetypeThemes: formData.archetypeThemes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      defaultAbilityBonus: formData.defaultAbilityBonus,
      flySpeed: formData.hasFly ? Math.max(5, Math.min(60, Number(formData.flySpeed) || 30)) : 0,
      climbSpeed: formData.hasClimb ? Math.max(5, Math.min(60, Number(formData.climbSpeed) || 30)) : 0,
      swimSpeed: formData.hasSwim ? Math.max(5, Math.min(60, Number(formData.swimSpeed) || 30)) : 0,
      enabled: formData.enabled,
    };

    setIsSubmitting(true);
    try {
      if (editingRace) {
        await updateRace(editingRace.id, payload);
        setStatusMessage(`Updated Race "${payload.name}".`);
      } else {
        await createRace(payload);
        setStatusMessage(`Created Race "${payload.name}".`);
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err?.message || 'Unable To Save Race.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (race: Race) => {
    if (race.isProtected) {
      alert('Cannot Delete A Protected Canonical Race.');
      return;
    }
    if (!confirm(`Are You Sure You Want To Delete "${race.name}"?`)) return;

    try {
      await deleteRace(race.id);
      setStatusMessage(`Deleted Race "${race.name}".`);
    } catch (err: any) {
      alert(err?.message || 'Unable To Delete Race.');
    }
  };

  if (isLoading) {
    return <PageLoader label="Loading Race Catalog..." />;
  }

  return (
    <div className="page pb-12">
      <PageHeader
        title="Race Catalog"
        description="Manage playable and NPC illustrated race archetypes, visual guidelines, and racial movement defaults."
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-accent flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Race</span>
          </button>
        }
      />

      {statusMessage && (
        <div className="mb-4">
          <StatusBanner type="success" message={statusMessage} onDismiss={() => setStatusMessage(null)} />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <StatusBanner
            type="error"
            message={(error as Error).message || 'Failed To Load Race Catalog.'}
            onDismiss={() => refetch()}
          />
        </div>
      )}

      {/* Top Stat Overview */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Races" value={stats.total} icon={Sparkles} />
        <StatCard label="Winged (Fly)" value={stats.winged} icon={Wind} />
        <StatCard label="Climbers" value={stats.climbers} icon={Mountain} />
        <StatCard label="Swimmers" value={stats.swimmers} icon={Waves} />
      </div>

      {/* Controls & Search */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs
            options={['All', 'Fantasy', 'Modern', 'Sci-Fi']}
            value={selectedGenre}
            onChange={(tab) => setSelectedGenre(tab as GenreTab)}
          />

          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted"
            />
            <input
              type="text"
              placeholder="Search Races Or Themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-text-muted">Status:</span>
          {(['All', 'Enabled', 'Disabled'] as StatusTab[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40'
                  : 'bg-brand-primary/40 text-brand-text-muted hover:text-brand-text border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-xs text-brand-text-muted">
            Showing {filteredRaces.length} of {races.length}
          </span>
        </div>
      </div>

      {/* Race Catalog Grid */}
      {filteredRaces.length === 0 ? (
        <EmptyState
          title="No Races Found"
          description="Try Adjusting Your Genre Or Search Query, Or Create A New Race."
          action={
            <button type="button" onClick={handleOpenCreate} className="btn-secondary text-xs">
              Add New Race
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRaces.map((race) => {
            const hasExtraMovement = race.flySpeed > 0 || race.climbSpeed > 0 || race.swimSpeed > 0;
            return (
              <div
                key={race.id}
                className="card flex flex-col justify-between border border-brand-primary bg-brand-surface p-4 transition-all hover:border-brand-accent/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-title font-semibold text-brand-text">{race.name}</h2>
                        {race.isProtected && (
                          <span
                            title="Protected Canonical Archetype"
                            className="inline-flex items-center text-amber-400"
                          >
                            <Lock size={12} />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {race.genres?.map((g) => (
                          <span
                            key={g}
                            className="rounded bg-brand-primary/60 px-1.5 py-0.2 text-[10px] font-medium text-brand-text-muted"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        race.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {race.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Movement Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {race.flySpeed > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-300 border border-sky-500/40">
                        <Wind size={11} />
                        Fly {race.flySpeed} Ft
                      </span>
                    )}
                    {race.climbSpeed > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/40">
                        <Mountain size={11} />
                        Climb {race.climbSpeed} Ft
                      </span>
                    )}
                    {race.swimSpeed > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/40">
                        <Waves size={11} />
                        Swim {race.swimSpeed} Ft
                      </span>
                    )}
                    {!hasExtraMovement && (
                      <span className="rounded bg-brand-primary/30 px-1.5 py-0.5 text-[10px] text-brand-text-muted">
                        No Extra Movement
                      </span>
                    )}
                  </div>

                  {/* Appearance Preview */}
                  {race.appearance && (
                    <p className="mt-3 text-xs leading-relaxed text-brand-text-muted line-clamp-3">
                      {race.appearance}
                    </p>
                  )}

                  {/* Themes Preview */}
                  {race.archetypeThemes && race.archetypeThemes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {race.archetypeThemes.slice(0, 4).map((theme) => (
                        <span
                          key={theme}
                          className="rounded bg-brand-bg px-1.5 py-0.5 text-[10px] text-brand-text-secondary"
                        >
                          {theme}
                        </span>
                      ))}
                      {race.archetypeThemes.length > 4 && (
                        <span className="text-[10px] text-brand-text-muted">
                          +{race.archetypeThemes.length - 4} More
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-brand-primary/40 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(race)}
                    className="flex items-center gap-1 rounded bg-brand-primary/40 px-2.5 py-1 text-xs font-medium text-brand-text hover:bg-brand-primary/70 transition-colors"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  {!race.isProtected && (
                    <button
                      type="button"
                      onClick={() => handleDelete(race)}
                      className="flex items-center gap-1 rounded bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/25 transition-colors"
                      title="Delete Race"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="card my-8 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-brand-primary bg-brand-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-primary/60 pb-3">
              <h2 className="text-header font-semibold text-brand-text">
                {editingRace ? `Edit Race: ${editingRace.name}` : 'Create New Race'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded p-1 text-brand-text-muted hover:text-brand-text"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3">
                <StatusBanner type="error" message={formError} onDismiss={() => setFormError(null)} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="input-label">Race Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Angel, Catfolk, Strix"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="input-label">Supported Genres</label>
                <div className="flex flex-wrap gap-3">
                  {GENRES.map((genre) => (
                    <label
                      key={genre}
                      className="flex cursor-pointer items-center gap-2 text-xs text-brand-text"
                    >
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              genres: [...formData.genres, genre],
                            });
                          } else {
                            if (formData.genres.length > 1) {
                              setFormData({
                                ...formData,
                                genres: formData.genres.filter((g) => g !== genre),
                              });
                            }
                          }
                        }}
                        className="rounded border-brand-primary text-brand-accent focus:ring-brand-accent"
                      />
                      <span>{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Multi-select Fly / Climb / Swim checklist */}
              <div className="rounded-lg border border-brand-primary bg-brand-bg/60 p-3">
                <div className="mb-2">
                  <label className="input-label mb-0">Racial Movement Extras</label>
                  <p className="text-xs text-brand-text-muted">
                    Racial Extras Only; Stacks With Traits And Magic Items.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Fly */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-text">
                      <input
                        type="checkbox"
                        checked={formData.hasFly}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hasFly: e.target.checked,
                            flySpeed: e.target.checked ? formData.flySpeed || 30 : 0,
                          })
                        }
                        className="rounded border-brand-primary text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="flex items-center gap-1.5">
                        <Wind size={13} className="text-sky-400" />
                        <span>Fly Speed</span>
                      </span>
                    </label>
                    {formData.hasFly && (
                      <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                        <input
                          type="number"
                          min="5"
                          max="60"
                          step="5"
                          value={formData.flySpeed}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              flySpeed: Number(e.target.value),
                            })
                          }
                          className="input-field w-20 py-1 text-center text-xs"
                        />
                        <span className="text-xs text-brand-text-muted">Ft</span>
                      </div>
                    )}
                  </div>

                  {/* Climb */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-text">
                      <input
                        type="checkbox"
                        checked={formData.hasClimb}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hasClimb: e.target.checked,
                            climbSpeed: e.target.checked ? formData.climbSpeed || 30 : 0,
                          })
                        }
                        className="rounded border-brand-primary text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="flex items-center gap-1.5">
                        <Mountain size={13} className="text-amber-400" />
                        <span>Climb Speed</span>
                      </span>
                    </label>
                    {formData.hasClimb && (
                      <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                        <input
                          type="number"
                          min="5"
                          max="60"
                          step="5"
                          value={formData.climbSpeed}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              climbSpeed: Number(e.target.value),
                            })
                          }
                          className="input-field w-20 py-1 text-center text-xs"
                        />
                        <span className="text-xs text-brand-text-muted">Ft</span>
                      </div>
                    )}
                  </div>

                  {/* Swim */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-text">
                      <input
                        type="checkbox"
                        checked={formData.hasSwim}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hasSwim: e.target.checked,
                            swimSpeed: e.target.checked ? formData.swimSpeed || 30 : 0,
                          })
                        }
                        className="rounded border-brand-primary text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="flex items-center gap-1.5">
                        <Waves size={13} className="text-cyan-400" />
                        <span>Swim Speed</span>
                      </span>
                    </label>
                    {formData.hasSwim && (
                      <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                        <input
                          type="number"
                          min="5"
                          max="60"
                          step="5"
                          value={formData.swimSpeed}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              swimSpeed: Number(e.target.value),
                            })
                          }
                          className="input-field w-20 py-1 text-center text-xs"
                        />
                        <span className="text-xs text-brand-text-muted">Ft</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Default Ability Bonus</label>
                <select
                  value={formData.defaultAbilityBonus}
                  onChange={(e) => setFormData({ ...formData, defaultAbilityBonus: e.target.value })}
                  className="input-field text-xs"
                >
                  {ABILITY_OPTIONS.map((ability) => (
                    <option key={ability} value={ability}>
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Canonical Visual Appearance</label>
                <textarea
                  rows={3}
                  value={formData.appearance}
                  onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                  placeholder="Describe the canonical physical appearance for portrait matching..."
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="input-label">Archetype Themes (Comma-Separated)</label>
                <input
                  type="text"
                  value={formData.archetypeThemes}
                  onChange={(e) => setFormData({ ...formData, archetypeThemes: e.target.value })}
                  placeholder="e.g. divine, skies, mountains, sacred"
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="raceEnabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-brand-primary text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="raceEnabled" className="cursor-pointer text-xs font-medium text-brand-text">
                  Enabled In Public Catalog
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-brand-primary/60 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-accent flex items-center gap-1.5 text-xs"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{editingRace ? 'Save Changes' : 'Create Race'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
