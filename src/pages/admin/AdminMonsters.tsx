import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Ghost,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
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
import { cn } from '../../lib/utils';
import {
  useMonsterCatalog,
  useMonsterTypeDetails,
  type MonsterGenre,
  type MonsterSubtype,
  type MonsterType,
  type MonsterTypePayload,
} from '../../hooks/useMonsterCatalog';

type CatalogFilter = 'All' | 'Enabled' | 'Disabled';
type SubtypeDraft = {
  visualDescription: string;
  size: string;
  allowedTerrains: string[];
  enabled: boolean;
};

const GENRES: MonsterGenre[] = ['Fantasy', 'Modern', 'Sci-Fi'];
const SIZES = ['Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'] as const;
const TERRAINS = [
  'Plains',
  'Forest',
  'Swamp',
  'Desert',
  'Mountain',
  'Coastal',
  'Underwater',
  'Airborne',
  'Planetary Surface',
  'Orbital',
  'Asteroid Field',
  'Deep Space',
  'Nebula Core',
  'Warp Rift',
] as const;

const EMPTY_TYPE_FORM = {
  description: '',
  enabled: true,
  minEncounterLevel: 1,
  genres: ['Fantasy'] as MonsterGenre[],
};

const EMPTY_NEW_TYPE = {
  name: '',
  description: '',
  genres: ['Fantasy'] as MonsterGenre[],
  minEncounterLevel: 1,
};

const EMPTY_SUB_FORM = {
  name: '',
  visualDescription: '',
  size: 'Medium',
  allowedTerrains: ['Plains'] as string[],
  enabled: true,
};

function toggleValue<T extends string>(list: T[], value: T, min = 1): T[] {
  const has = list.includes(value);
  if (has) {
    const next = list.filter((item) => item !== value);
    return next.length >= min ? next : list;
  }
  return [...list, value];
}

function sameStringList(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function typeStatusBadge(type: Pick<MonsterType, 'enabled' | 'isProtected'>) {
  if (type.isProtected) return { className: 'badge-warning', label: 'Protected' };
  if (type.enabled) return { className: 'badge-success', label: 'Enabled' };
  return { className: 'badge-danger', label: 'Disabled' };
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none disabled:opacity-60',
          checked ? 'border-emerald-500/40 bg-emerald-500/80' : 'border-brand-primary/50 bg-brand-bg'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      <span className="text-xs text-brand-text-muted whitespace-nowrap">{label}</span>
    </div>
  );
}

function ChoicePills({
  options,
  selected,
  onToggle,
  disabled,
  label,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div>
      <p className="input-label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={cn(
                'h-7 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
                active
                  ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-text'
                  : 'border-brand-primary/40 bg-brand-bg text-brand-text-muted hover:border-brand-primary hover:text-brand-text'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminMonsters() {
  const {
    types,
    loading,
    error,
    createType,
    updateType,
    deleteType,
    createSubtype,
    updateSubtype,
    deleteSubtype,
  } = useMonsterCatalog();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [addingSubtype, setAddingSubtype] = useState(false);
  const [expandedSubtypeId, setExpandedSubtypeId] = useState<string | null>(null);
  const [subtypeDrafts, setSubtypeDrafts] = useState<Record<string, SubtypeDraft>>({});
  const [subtypeQuery, setSubtypeQuery] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('All');
  const [genreFilter, setGenreFilter] = useState<'All' | MonsterGenre>('All');

  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [newTypeForm, setNewTypeForm] = useState(EMPTY_NEW_TYPE);
  const [subForm, setSubForm] = useState(EMPTY_SUB_FORM);

  const { data: selectedType = null, isLoading: detailsLoading } = useMonsterTypeDetails(
    isCreating ? null : selectedTypeId
  );

  const templateType = useMemo(
    () => types.find((type) => type.id === selectedTypeId) || types[0] || null,
    [types, selectedTypeId]
  );

  const stats = useMemo(() => {
    const enabled = types.filter((type) => type.enabled).length;
    return {
      total: types.length,
      enabled,
      disabled: types.length - enabled,
      protectedCount: types.filter((type) => type.isProtected).length,
    };
  }, [types]);

  const filteredTypes = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return types.filter((type) => {
      if (catalogFilter === 'Enabled' && !type.enabled) return false;
      if (catalogFilter === 'Disabled' && type.enabled) return false;
      if (genreFilter !== 'All' && !(type.genres || []).includes(genreFilter)) return false;
      if (!query) return true;
      const haystack = [
        type.name,
        type.description,
        ...(type.genres || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [types, catalogQuery, catalogFilter, genreFilter]);

  const subtypeList = selectedType?.subtypes || [];
  const filteredSubtypes = useMemo(() => {
    const query = subtypeQuery.trim().toLowerCase();
    if (!query) return subtypeList;
    return subtypeList.filter((subtype) => {
      const haystack = [subtype.name, subtype.visualDescription, subtype.size, ...(subtype.allowedTerrains || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [subtypeList, subtypeQuery]);

  const typeDirty = useMemo(() => {
    if (!selectedType) return false;
    return (
      typeForm.description !== (selectedType.description || '') ||
      typeForm.enabled !== selectedType.enabled ||
      typeForm.minEncounterLevel !== (selectedType.minEncounterLevel ?? 1) ||
      !sameStringList(typeForm.genres, selectedType.genres || [])
    );
  }, [selectedType, typeForm]);

  useEffect(() => {
    if (selectedTypeId) return;
    if (types.length > 0) setSelectedTypeId(types[0].id);
  }, [types, selectedTypeId]);

  useEffect(() => {
    setExpandedSubtypeId(null);
    setSubtypeDrafts({});
    setAddingSubtype(false);
    setSubtypeQuery('');
  }, [selectedTypeId]);

  useEffect(() => {
    if (!selectedType || selectedType.id !== selectedTypeId) return;
    setTypeForm({
      description: selectedType.description || '',
      enabled: selectedType.enabled,
      minEncounterLevel: selectedType.minEncounterLevel ?? 1,
      genres: (selectedType.genres?.length ? selectedType.genres : ['Fantasy']) as MonsterGenre[],
    });
    // Hydrate when the selected type changes, not on background refetches of the same type.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedType.id is the load signal
  }, [selectedTypeId, selectedType?.id]);

  const selectType = (id: string) => {
    setIsCreating(false);
    setSelectedTypeId(id);
    setStatus(null);
  };

  const startCreate = () => {
    setIsCreating(true);
    setStatus(null);
    setNewTypeForm(EMPTY_NEW_TYPE);
  };

  const handleSaveType = async () => {
    if (!selectedTypeId || selectedType?.isProtected) return;
    setStatus(null);
    setSaving(true);
    try {
      await updateType(selectedTypeId, {
        description: typeForm.description,
        enabled: typeForm.enabled,
        minEncounterLevel: Number(typeForm.minEncounterLevel),
        genres: typeForm.genres,
      });
      setStatus({ type: 'success', msg: 'Monster Type Updated.' });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Update Monster Type.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async () => {
    if (!templateType) {
      setStatus({ type: 'error', msg: 'A Template Type is required to copy combat identity.' });
      return;
    }
    if (!newTypeForm.name.trim() || !newTypeForm.description.trim()) {
      setStatus({ type: 'error', msg: 'Type Name and Description are required.' });
      return;
    }

    setStatus(null);
    setSaving(true);
    try {
      const payload: MonsterTypePayload = {
        name: newTypeForm.name.trim(),
        description: newTypeForm.description.trim(),
        genres: newTypeForm.genres,
        minEncounterLevel: Number(newTypeForm.minEncounterLevel),
        defaultArchetype: templateType.defaultArchetype,
        allowedArchetypes: templateType.allowedArchetypes,
        maturityPrefixes: templateType.maturityPrefixes,
        immunities: templateType.immunities,
        resistances: templateType.resistances,
        vulnerabilities: templateType.vulnerabilities,
        statusImmunities: templateType.statusImmunities,
        defaultAffinity: templateType.defaultAffinity,
        poiTags: templateType.poiTags,
        enabled: true,
      };

      const created = await createType(payload);
      setStatus({ type: 'success', msg: 'Monster Type Created.' });
      setNewTypeForm(EMPTY_NEW_TYPE);
      setIsCreating(false);
      if (created?.id) setSelectedTypeId(created.id);
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Create Monster Type.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisableType = async () => {
    if (!selectedTypeId || selectedType?.isProtected) return;
    if (!window.confirm('Disable this Monster Type and all of its subtypes? Protected entries cannot be disabled this way.')) {
      return;
    }
    setStatus(null);
    setSaving(true);
    try {
      await deleteType(selectedTypeId);
      setStatus({ type: 'success', msg: 'Monster Type Disabled.' });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Disable Monster Type.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubtype = async () => {
    if (!selectedTypeId) return;
    if (!subForm.name.trim() || !subForm.visualDescription.trim()) {
      setStatus({ type: 'error', msg: 'Subtype Name and Visual Description are required.' });
      return;
    }
    if (subForm.allowedTerrains.length === 0) {
      setStatus({ type: 'error', msg: 'Choose at least one terrain.' });
      return;
    }
    setStatus(null);
    setSaving(true);
    try {
      await createSubtype(selectedTypeId, {
        name: subForm.name.trim(),
        visualDescription: subForm.visualDescription.trim(),
        size: subForm.size,
        archetype: null,
        allowedTerrains: subForm.allowedTerrains,
        enabled: subForm.enabled,
        encounterExcluded: false,
        rideable: false,
      });
      setSubForm(EMPTY_SUB_FORM);
      setAddingSubtype(false);
      setStatus({ type: 'success', msg: 'Monster Subtype Created.' });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Create Monster Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const openSubtypeEditor = (subtype: MonsterSubtype) => {
    setExpandedSubtypeId((current) => (current === subtype.id ? null : subtype.id));
    setSubtypeDrafts((prev) => {
      if (prev[subtype.id]) return prev;
      return {
        ...prev,
        [subtype.id]: {
          visualDescription: subtype.visualDescription || '',
          size: subtype.size || 'Medium',
          allowedTerrains: subtype.allowedTerrains?.length ? subtype.allowedTerrains : ['Plains'],
          enabled: Boolean(subtype.enabled),
        },
      };
    });
  };

  const updateDraft = (subtypeId: string, patch: Partial<SubtypeDraft>) => {
    setSubtypeDrafts((prev) => ({
      ...prev,
      [subtypeId]: { ...prev[subtypeId], ...patch },
    }));
  };

  const handleSaveSubtype = async (subtype: MonsterSubtype) => {
    if (!selectedTypeId || subtype.isProtected) return;
    const draft = subtypeDrafts[subtype.id];
    if (!draft) return;
    if (!draft.visualDescription.trim()) {
      setStatus({ type: 'error', msg: 'Visual Description is required.' });
      return;
    }
    if (draft.allowedTerrains.length === 0) {
      setStatus({ type: 'error', msg: 'Choose at least one terrain.' });
      return;
    }
    setStatus(null);
    setSaving(true);
    try {
      await updateSubtype(selectedTypeId, subtype.id, {
        visualDescription: draft.visualDescription.trim(),
        size: draft.size,
        allowedTerrains: draft.allowedTerrains,
        enabled: draft.enabled,
      });
      setStatus({ type: 'success', msg: 'Monster Subtype Updated.' });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Update Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubtypeEnabled = async (subtype: MonsterSubtype, enabled: boolean) => {
    if (!selectedTypeId || subtype.isProtected) return;
    setStatus(null);
    setSaving(true);
    try {
      await updateSubtype(selectedTypeId, subtype.id, { enabled });
      setSubtypeDrafts((prev) =>
        prev[subtype.id] ? { ...prev, [subtype.id]: { ...prev[subtype.id], enabled } } : prev
      );
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Update Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubtype = async (subtypeId: string) => {
    if (!selectedTypeId) return;
    if (!window.confirm('Disable this Monster Subtype? Protected entries cannot be disabled.')) return;
    setStatus(null);
    setSaving(true);
    try {
      await deleteSubtype(selectedTypeId, subtypeId);
      setExpandedSubtypeId((current) => (current === subtypeId ? null : current));
      setStatus({ type: 'success', msg: 'Monster Subtype Disabled.' });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Failed To Disable Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <PageLoader label="Loading Monsters" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <StatusBanner
          type="error"
          message={`Failed To Load Monster Catalog: ${error instanceof Error ? error.message : String(error)}`}
        />
      </div>
    );
  }

  const selectedBadge = selectedType ? typeStatusBadge(selectedType) : null;

  return (
    <div className="page">
      <PageHeader
        title="Monsters"
        description="Edit monster type and subtype identity for procedural encounters. Combat templates stay unchanged."
        actions={
          isCreating ? (
            <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">
              <X size={12} />
              Cancel
            </button>
          ) : (
            <button type="button" onClick={startCreate} className="btn-primary">
              <Plus size={12} />
              New Type
            </button>
          )
        }
      />

      {status && (
        <StatusBanner type={status.type} message={status.msg} onDismiss={() => setStatus(null)} />
      )}

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Monster Types" value={stats.total} icon={Ghost} accent />
        <StatCard label="Enabled" value={stats.enabled} icon={ShieldCheck} />
        <StatCard label="Disabled" value={stats.disabled} icon={Ban} />
        <StatCard label="Protected" value={stats.protectedCount} icon={Lock} />
      </div>

      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-3 items-start">
        <aside className="card p-3.5 sticky top-14 max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="card-title">Type Catalog</h2>
              <p className="card-subtitle">
                {filteredTypes.length} Of {types.length} Types
              </p>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
            <input
              type="search"
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search Types..."
              className="input-field !pl-9"
            />
          </div>

          <FilterTabs
            options={['All', 'Enabled', 'Disabled']}
            value={catalogFilter}
            onChange={(val) => setCatalogFilter(val as CatalogFilter)}
            className="mb-2 w-full [&>button]:flex-1"
          />

          <div className="flex flex-wrap gap-1 mb-3">
            {(['All', ...GENRES] as const).map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setGenreFilter(genre)}
                className={cn(
                  'h-6 rounded-md border px-2 text-xs font-medium transition-colors duration-150',
                  genreFilter === genre
                    ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-text'
                    : 'border-brand-primary/40 bg-brand-bg text-brand-text-muted hover:text-brand-text'
                )}
              >
                {genre === 'All' ? 'All Genres' : genre}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredTypes.length === 0 ? (
              <EmptyState compact title="No Types Match" description="Clear search or filters to see the full catalog." />
            ) : (
              filteredTypes.map((type) => {
                const badge = typeStatusBadge(type);
                const active = !isCreating && selectedTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectType(type.id)}
                    className={cn('select-row', active ? 'select-row-active' : 'select-row-idle')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-brand-text">{type.name}</span>
                      <span className={badge.className}>{badge.label}</span>
                    </div>
                    <p className="help-text mt-1 truncate">
                      Level {type.minEncounterLevel} · {type._count?.subtypes ?? 0} Subtypes ·{' '}
                      {(type.genres || []).join(', ') || 'Fantasy'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="space-y-3 min-w-0">
          {isCreating ? (
            <section className="card p-3.5 space-y-3">
              <div className="card-header">
                <div>
                  <h2 className="card-title">New Monster Type</h2>
                  <p className="card-subtitle">
                    Combat identity copies from {templateType?.name || 'the first catalog type'}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" htmlFor="new-type-name">
                    Type Name
                  </label>
                  <input
                    id="new-type-name"
                    className="input-field"
                    placeholder="Beast"
                    value={newTypeForm.name}
                    onChange={(e) => setNewTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="new-type-level">
                    Min Encounter Level
                  </label>
                  <input
                    id="new-type-level"
                    className="input-field"
                    type="number"
                    min={1}
                    value={newTypeForm.minEncounterLevel}
                    onChange={(e) =>
                      setNewTypeForm((prev) => ({ ...prev, minEncounterLevel: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="new-type-description">
                  Description
                </label>
                <textarea
                  id="new-type-description"
                  className="input-field !h-auto py-2 leading-relaxed"
                  rows={4}
                  placeholder="How this type appears in procedural encounters."
                  value={newTypeForm.description}
                  onChange={(e) => setNewTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <ChoicePills
                label="Genres"
                options={GENRES}
                selected={newTypeForm.genres}
                onToggle={(genre) =>
                  setNewTypeForm((prev) => ({
                    ...prev,
                    genres: toggleValue(prev.genres, genre as MonsterGenre),
                  }))
                }
              />

              <div className="callout">
                New types inherit archetype, immunities, resistances, and POI tags from the selected catalog type so combat templates stay intact.
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" disabled={saving} onClick={() => void handleCreateType()}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Create Type
                </button>
              </div>
            </section>
          ) : !selectedType && detailsLoading ? (
            <section className="card p-3.5">
              <div className="flex items-center gap-2 py-8 justify-center text-brand-text-muted">
                <Loader2 size={14} className="animate-spin text-brand-accent" />
                <span className="text-xs">Loading Type</span>
              </div>
            </section>
          ) : !selectedType ? (
            <section className="card p-3.5">
              <EmptyState title="Select a Monster Type" description="Choose a type from the catalog to edit identity and subtypes." />
            </section>
          ) : (
            <>
              <section className="card p-3.5 space-y-3">
                <div className="card-header">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="card-title truncate">{selectedType.name}</h2>
                      {selectedBadge && <span className={selectedBadge.className}>{selectedBadge.label}</span>}
                    </div>
                    <p className="card-subtitle">
                      {subtypeList.length} Subtypes · Level {selectedType.minEncounterLevel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToggleSwitch
                      checked={typeForm.enabled}
                      disabled={selectedType.isProtected || saving}
                      label={typeForm.enabled ? 'Encounters On' : 'Encounters Off'}
                      onChange={() => setTypeForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={saving || selectedType.isProtected || !typeDirty}
                      onClick={() => void handleSaveType()}
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save Type
                    </button>
                  </div>
                </div>

                {selectedType.isProtected && (
                  <div className="callout-accent text-xs text-brand-text-muted">
                    This type is protected. Identity fields are locked so core encounter templates stay intact.
                  </div>
                )}

                <div>
                  <label className="input-label" htmlFor="type-description">
                    Description
                  </label>
                  <textarea
                    id="type-description"
                    className="input-field !h-auto py-2 leading-relaxed"
                    rows={3}
                    value={typeForm.description}
                    onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={selectedType.isProtected}
                  />
                </div>

                <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-3 items-start">
                  <div>
                    <label className="input-label" htmlFor="type-level">
                      Min Encounter Level
                    </label>
                    <input
                      id="type-level"
                      className="input-field"
                      type="number"
                      min={1}
                      value={typeForm.minEncounterLevel}
                      onChange={(e) =>
                        setTypeForm((prev) => ({ ...prev, minEncounterLevel: Number(e.target.value) }))
                      }
                      disabled={selectedType.isProtected}
                    />
                  </div>
                  <ChoicePills
                    label="Genres"
                    options={GENRES}
                    selected={typeForm.genres}
                    disabled={selectedType.isProtected}
                    onToggle={(genre) =>
                      setTypeForm((prev) => ({
                        ...prev,
                        genres: toggleValue(prev.genres, genre as MonsterGenre),
                      }))
                    }
                  />
                </div>

                {!selectedType.isProtected && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={saving || selectedType.enabled === false}
                      onClick={() => void handleDisableType()}
                    >
                      <Ban size={12} />
                      Disable Type
                    </button>
                  </div>
                )}
              </section>

              <section className="card p-3.5 space-y-3">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Subtypes</h2>
                    <p className="card-subtitle">Expand a row to edit visual identity, size, and terrains.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAddingSubtype((open) => !open)}
                  >
                    {addingSubtype ? <X size={12} /> : <Plus size={12} />}
                    {addingSubtype ? 'Cancel' : 'Add Subtype'}
                  </button>
                </div>

                {subtypeList.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
                    <input
                      type="search"
                      value={subtypeQuery}
                      onChange={(e) => setSubtypeQuery(e.target.value)}
                      placeholder="Search Subtypes..."
                      className="input-field !pl-9"
                    />
                  </div>
                )}

                {addingSubtype && (
                  <div className="rounded-md border border-brand-primary/40 bg-brand-bg p-3 space-y-3">
                    <div className="grid grid-cols-[1fr_160px] gap-3">
                      <div>
                        <label className="input-label" htmlFor="sub-name">
                          Subtype Name
                        </label>
                        <input
                          id="sub-name"
                          className="input-field"
                          placeholder="Forest Stalker"
                          value={subForm.name}
                          onChange={(e) => setSubForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="input-label" htmlFor="sub-size">
                          Size
                        </label>
                        <select
                          id="sub-size"
                          className="input-field cursor-pointer"
                          value={subForm.size}
                          onChange={(e) => setSubForm((prev) => ({ ...prev, size: e.target.value }))}
                        >
                          {SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="input-label" htmlFor="sub-visual">
                        Visual Description
                      </label>
                      <textarea
                        id="sub-visual"
                        className="input-field !h-auto py-2 leading-relaxed"
                        rows={2}
                        placeholder="How this subtype looks in generated encounters."
                        value={subForm.visualDescription}
                        onChange={(e) => setSubForm((prev) => ({ ...prev, visualDescription: e.target.value }))}
                      />
                    </div>
                    <ChoicePills
                      label="Allowed Terrains"
                      options={TERRAINS}
                      selected={subForm.allowedTerrains}
                      onToggle={(terrain) =>
                        setSubForm((prev) => ({
                          ...prev,
                          allowedTerrains: toggleValue(prev.allowedTerrains, terrain),
                        }))
                      }
                    />
                    <div className="flex items-center justify-between">
                      <ToggleSwitch
                        checked={subForm.enabled}
                        label={subForm.enabled ? 'Enabled' : 'Disabled'}
                        onChange={() => setSubForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={saving}
                        onClick={() => void handleCreateSubtype()}
                      >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Add Subtype
                      </button>
                    </div>
                  </div>
                )}

                {filteredSubtypes.length === 0 ? (
                  <EmptyState
                    compact
                    title={subtypeList.length === 0 ? 'No Subtypes' : 'No Subtypes Match'}
                    description={
                      subtypeList.length === 0
                        ? 'Add a subtype to give this type encounter variety.'
                        : 'Clear the subtype search to see every row.'
                    }
                  />
                ) : (
                  <div className="overflow-x-auto -mx-3.5 px-3.5">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Size</th>
                          <th>Terrains</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubtypes.map((subtype) => {
                          const expanded = expandedSubtypeId === subtype.id;
                          const draft = subtypeDrafts[subtype.id];
                          const badge = typeStatusBadge(subtype);
                          return (
                            <React.Fragment key={subtype.id}>
                              <tr
                                className={cn('cursor-pointer', expanded && 'bg-brand-hover')}
                                onClick={() => openSubtypeEditor(subtype)}
                              >
                                <td className="font-medium text-brand-text">{subtype.name}</td>
                                <td className="text-brand-text-muted">{subtype.size}</td>
                                <td className="text-brand-text-muted max-w-[280px] truncate">
                                  {(subtype.allowedTerrains || []).join(', ') || '—'}
                                </td>
                                <td>
                                  <span className={badge.className}>{badge.label}</span>
                                </td>
                                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1">
                                    {!subtype.isProtected && (
                                      <button
                                        type="button"
                                        className="btn-ghost btn-sm"
                                        disabled={saving}
                                        onClick={() => void handleToggleSubtypeEnabled(subtype, !subtype.enabled)}
                                      >
                                        {subtype.enabled ? 'Disable' : 'Enable'}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn-secondary btn-sm"
                                      onClick={() => openSubtypeEditor(subtype)}
                                    >
                                      {expanded ? 'Close' : 'Edit'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expanded && draft && (
                                <tr>
                                  <td colSpan={5} className="bg-brand-bg">
                                    <div className="py-2 space-y-3">
                                      {subtype.isProtected && (
                                        <p className="help-text">Protected subtypes are read-only.</p>
                                      )}
                                      <div>
                                        <label className="input-label" htmlFor={`visual-${subtype.id}`}>
                                          Visual Description
                                        </label>
                                        <textarea
                                          id={`visual-${subtype.id}`}
                                          className="input-field !h-auto py-2 leading-relaxed"
                                          rows={3}
                                          value={draft.visualDescription}
                                          disabled={subtype.isProtected}
                                          onChange={(e) =>
                                            updateDraft(subtype.id, { visualDescription: e.target.value })
                                          }
                                        />
                                      </div>
                                      <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-3 items-start">
                                        <div>
                                          <label className="input-label" htmlFor={`size-${subtype.id}`}>
                                            Size
                                          </label>
                                          <select
                                            id={`size-${subtype.id}`}
                                            className="input-field cursor-pointer"
                                            value={draft.size}
                                            disabled={subtype.isProtected}
                                            onChange={(e) => updateDraft(subtype.id, { size: e.target.value })}
                                          >
                                            {SIZES.map((size) => (
                                              <option key={size} value={size}>
                                                {size}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <ChoicePills
                                          label="Allowed Terrains"
                                          options={TERRAINS}
                                          selected={draft.allowedTerrains}
                                          disabled={subtype.isProtected}
                                          onToggle={(terrain) =>
                                            updateDraft(subtype.id, {
                                              allowedTerrains: toggleValue(draft.allowedTerrains, terrain),
                                            })
                                          }
                                        />
                                      </div>
                                      {!subtype.isProtected && (
                                        <div className="flex items-center justify-between">
                                          <ToggleSwitch
                                            checked={draft.enabled}
                                            disabled={saving}
                                            label={draft.enabled ? 'Enabled' : 'Disabled'}
                                            onChange={() => updateDraft(subtype.id, { enabled: !draft.enabled })}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              className="btn-danger btn-sm"
                                              disabled={saving}
                                              onClick={() => void handleDeleteSubtype(subtype.id)}
                                            >
                                              <Trash2 size={12} />
                                              Disable
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-primary btn-sm"
                                              disabled={saving}
                                              onClick={() => void handleSaveSubtype(subtype)}
                                            >
                                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                              Save Subtype
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
