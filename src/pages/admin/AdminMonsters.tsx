import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { PageHeader, StatusBanner, PageLoader, Card } from '../../components/ui';
import { cn } from '../../lib/utils';
import { useMonsterCatalog, type MonsterTypePayload } from '../../hooks/useMonsterCatalog';

type GenresInput = string; // comma-separated

const parseGenres = (value: GenresInput): MonsterTypePayload['genres'] => {
  const raw = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // API validation is strict; keep only the known values.
  const allowed = new Set(['Fantasy', 'Modern', 'Sci-Fi']);
  const cleaned = raw.map((g) => (g === 'Sci-Fi' ? 'Sci-Fi' : g)).filter((g) => allowed.has(g));
  return (cleaned.length ? cleaned : ['Fantasy']) as any;
};

const toCsv = (list: string[] | undefined | null): string => (list && list.length ? list.join(', ') : '');

export default function AdminMonsters() {
  const {
    types,
    loading,
    error,
    createType,
    updateType,
    deleteType,
    fetchTypeDetails,
    createSubtype,
    updateSubtype,
    deleteSubtype,
  } = useMonsterCatalog();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<any | null>(null);

  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [typeForm, setTypeForm] = useState({
    description: '',
    enabled: true,
    minEncounterLevel: 1,
    genresCsv: 'Fantasy',
  });

  const [newTypeForm, setNewTypeForm] = useState({
    name: '',
    description: '',
    genresCsv: 'Fantasy',
    minEncounterLevel: 1,
  });

  const defaultTypeForCreate = useMemo(() => types[0] || null, [types]);

  useEffect(() => {
    if (selectedTypeId) return;
    if (types.length > 0) setSelectedTypeId(types[0].id);
  }, [types, selectedTypeId]);

  useEffect(() => {
    if (!selectedTypeId) return;
    void (async () => {
      const details = await fetchTypeDetails(selectedTypeId);
      setSelectedType(details);
      if (details) {
        setTypeForm({
          description: details.description || '',
          enabled: details.enabled,
          minEncounterLevel: details.minEncounterLevel ?? 1,
          genresCsv: toCsv(details.genres || []),
        });
      }
    })();
  }, [selectedTypeId, fetchTypeDetails]);

  const subtypeList = selectedType?.subtypes || [];

  const handleSaveType = async () => {
    if (!selectedTypeId) return;
    setStatus(null);
    setSaving(true);
    try {
      await updateType(selectedTypeId, {
        description: typeForm.description,
        enabled: typeForm.enabled,
        minEncounterLevel: Number(typeForm.minEncounterLevel),
        genres: parseGenres(typeForm.genresCsv),
      } as any);
      setStatus({ type: 'success', msg: 'Monster Type Updated.' });
      const next = await fetchTypeDetails(selectedTypeId);
      setSelectedType(next);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Update Monster Type.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async () => {
    if (!defaultTypeForCreate) return;
    if (!newTypeForm.name.trim()) {
      setStatus({ type: 'error', msg: 'Type Name is required.' });
      return;
    }

    setStatus(null);
    setSaving(true);
    try {
      const payload: MonsterTypePayload = {
        name: newTypeForm.name.trim(),
        description: newTypeForm.description.trim(),
        genres: parseGenres(newTypeForm.genresCsv),
        minEncounterLevel: Number(newTypeForm.minEncounterLevel),
        defaultArchetype: defaultTypeForCreate.defaultArchetype,
        allowedArchetypes: defaultTypeForCreate.allowedArchetypes,
        maturityPrefixes: defaultTypeForCreate.maturityPrefixes,
        immunities: defaultTypeForCreate.immunities,
        resistances: defaultTypeForCreate.resistances,
        vulnerabilities: defaultTypeForCreate.vulnerabilities,
        statusImmunities: defaultTypeForCreate.statusImmunities,
        defaultAffinity: defaultTypeForCreate.defaultAffinity,
        poiTags: defaultTypeForCreate.poiTags,
        enabled: true,
      };

      await createType(payload);
      setStatus({ type: 'success', msg: 'Monster Type Created.' });
      setNewTypeForm({ name: '', description: '', genresCsv: 'Fantasy', minEncounterLevel: 1 });

      // Reload selection.
      if (types.length > 0) {
        const refreshed = await fetchTypeDetails(selectedTypeId || types[0].id);
        setSelectedType(refreshed);
      }
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Create Monster Type.' });
    } finally {
      setSaving(false);
    }
  };

  const [subForm, setSubForm] = useState({
    name: '',
    visualDescription: '',
    size: 'Medium',
    allowedTerrainsCsv: 'Plains',
    enabled: true,
  });

  const handleCreateSubtype = async () => {
    if (!selectedTypeId) return;
    if (!subForm.name.trim()) {
      setStatus({ type: 'error', msg: 'Subtype Name is required.' });
      return;
    }
    setStatus(null);
    setSaving(true);
    try {
      const allowedTerrains = subForm.allowedTerrainsCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createSubtype(selectedTypeId, {
        name: subForm.name.trim(),
        visualDescription: subForm.visualDescription.trim(),
        size: subForm.size,
        archetype: null,
        allowedTerrains,
        enabled: subForm.enabled,
        encounterExcluded: false,
        rideable: false,
      } as any);

      setStatus({ type: 'success', msg: 'Monster Subtype Created.' });
      setSubForm({ name: '', visualDescription: '', size: 'Medium', allowedTerrainsCsv: 'Plains', enabled: true });
      const next = await fetchTypeDetails(selectedTypeId);
      setSelectedType(next);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Create Monster Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSubtypeEnabled = async (subtypeId: string, enabled: boolean) => {
    if (!selectedTypeId) return;
    setStatus(null);
    setSaving(true);
    try {
      await updateSubtype(selectedTypeId, subtypeId, { enabled } as any);
      const next = await fetchTypeDetails(selectedTypeId);
      setSelectedType(next);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Update Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubtypeDescription = async (subtypeId: string, visualDescription: string) => {
    if (!selectedTypeId) return;
    setStatus(null);
    setSaving(true);
    try {
      await updateSubtype(selectedTypeId, subtypeId, { visualDescription } as any);
      const next = await fetchTypeDetails(selectedTypeId);
      setSelectedType(next);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Update Subtype.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubtype = async (subtypeId: string) => {
    if (!selectedTypeId) return;
    if (!window.confirm('Delete this Monster Subtype? (Protected entries cannot be deleted)')) return;
    setStatus(null);
    setSaving(true);
    try {
      await deleteSubtype(selectedTypeId, subtypeId);
      const next = await fetchTypeDetails(selectedTypeId);
      setSelectedType(next);
      setStatus({ type: 'success', msg: 'Monster Subtype Disabled.' });
    } catch (e: any) {
      setStatus({ type: 'error', msg: e?.message || 'Failed To Delete Subtype.' });
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
        <StatusBanner type="error" message={`Failed To Load Monster Catalog: ${error}`} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Monsters"
        description="Edit monster type + subtype identity for procedural encounters (combat templates stay unchanged)."
      />

      {status && (
        <StatusBanner
          type={status.type}
          message={status.msg}
          onDismiss={() => setStatus(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <h3 className="section-title text-center text-header font-medium">Monster Type Catalog</h3>

          <div className="space-y-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTypeId(t.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition',
                  selectedTypeId === t.id
                    ? 'border-brand-accent bg-brand-primary/10'
                    : 'border-brand-surface bg-transparent hover:bg-brand-primary/5'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-brand-text-muted">
                    {t.isProtected ? 'Protected' : t.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className="text-xs text-brand-text-muted mt-1 line-clamp-1">
                  Level {t.minEncounterLevel} • Genres {(t.genres || []).join(', ') || 'Fantasy'}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-brand-primary/20">
            <h4 className="text-body-base font-semibold text-brand-text">Create New Monster Type</h4>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <input
                className="input"
                placeholder="Type Name"
                value={newTypeForm.name}
                onChange={(e) => setNewTypeForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Description"
                value={newTypeForm.description}
                onChange={(e) => setNewTypeForm((p) => ({ ...p, description: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Genres (comma-separated: Fantasy, Modern, Sci-Fi)"
                value={newTypeForm.genresCsv}
                onChange={(e) => setNewTypeForm((p) => ({ ...p, genresCsv: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                value={newTypeForm.minEncounterLevel}
                onChange={(e) => setNewTypeForm((p) => ({ ...p, minEncounterLevel: Number(e.target.value) }))}
              />
              <button
                type="button"
                onClick={handleCreateType}
                className="btn-primary w-full"
                disabled={saving}
              >
                <Plus size={14} className="mr-1" />
                Create
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="section-title text-center text-header font-medium">Edit Selected Type</h3>

          {!selectedType ? (
            <div className="text-sm text-brand-text-muted">Select a type.</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">{selectedType.name}</span>{' '}
                  {selectedType.isProtected && (
                    <span className="text-xs text-brand-accent ml-2">Protected</span>
                  )}
                </div>

                <label className="text-xs text-brand-text-muted block">Description</label>
                <textarea
                  className="textarea"
                  value={typeForm.description}
                  onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  disabled={selectedType.isProtected}
                />

                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-text-muted">Enabled</label>
                  <input
                    type="checkbox"
                    className={cn('h-4 w-4', typeForm.enabled ? 'accent-emerald-400' : 'accent-brand-accent')}
                    checked={typeForm.enabled}
                    onChange={(e) => setTypeForm((p) => ({ ...p, enabled: e.target.checked }))}
                    disabled={selectedType.isProtected}
                  />
                </div>

                <label className="text-xs text-brand-text-muted block">Min Encounter Level</label>
                <input
                  className="input"
                  type="number"
                  value={typeForm.minEncounterLevel}
                  onChange={(e) => setTypeForm((p) => ({ ...p, minEncounterLevel: Number(e.target.value) }))}
                  disabled={selectedType.isProtected}
                />

                <label className="text-xs text-brand-text-muted block">Genres</label>
                <input
                  className="input"
                  value={typeForm.genresCsv}
                  onChange={(e) => setTypeForm((p) => ({ ...p, genresCsv: e.target.value }))}
                  disabled={selectedType.isProtected}
                />

                <button
                  type="button"
                  onClick={handleSaveType}
                  className="btn-primary w-full"
                  disabled={saving || selectedType.isProtected}
                >
                  <Save size={14} className="mr-1" />
                  Save Type
                </button>
              </div>

              <div className="pt-4 border-t border-brand-primary/20">
                <h4 className="text-body-base font-semibold text-brand-text">Monster Subtypes</h4>

                <div className="space-y-2 mt-3">
                  {subtypeList.length === 0 ? (
                    <div className="text-sm text-brand-text-muted">No subtypes for this type.</div>
                  ) : (
                    subtypeList.map((s: any) => (
                      <div key={s.id} className="border border-brand-primary/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-brand-text-muted">{s.isProtected ? 'Protected' : s.enabled ? 'Enabled' : 'Disabled'}</div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <label className="text-xs text-brand-text-muted">Enabled</label>
                          <input
                            type="checkbox"
                            className={cn('h-4 w-4', s.enabled ? 'accent-emerald-400' : 'accent-brand-accent')}
                            checked={Boolean(s.enabled)}
                            disabled={Boolean(s.isProtected)}
                            onChange={(e) => handleToggleSubtypeEnabled(s.id, e.target.checked)}
                          />
                        </div>

                        <label className="text-xs text-brand-text-muted block">Visual Description</label>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={s.visualDescription || ''}
                          disabled={Boolean(s.isProtected)}
                          onChange={(e) => setSelectedType((prev: any) => ({
                            ...prev,
                            subtypes: prev.subtypes.map((x: any) => x.id === s.id ? { ...x, visualDescription: e.target.value } : x),
                          }))}
                        />

                        <div className="flex gap-2 items-center">
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            disabled={Boolean(s.isProtected) || saving}
                            onClick={() => handleUpdateSubtypeDescription(s.id, s.visualDescription)}
                          >
                            <Save size={12} className="mr-1" />
                            Save
                          </button>

                          {!s.isProtected && (
                            <button
                              type="button"
                              className="btn-danger text-xs"
                              disabled={saving}
                              onClick={() => handleDeleteSubtype(s.id)}
                            >
                              <Trash2 size={12} className="mr-1" />
                              Disable
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-brand-primary/20">
                  <h5 className="text-body-base font-semibold text-brand-text">Add Subtype</h5>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <input
                      className="input"
                      placeholder="Subtype Name"
                      value={subForm.name}
                      onChange={(e) => setSubForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="Visual Description"
                      value={subForm.visualDescription}
                      onChange={(e) => setSubForm((p) => ({ ...p, visualDescription: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="Size (Small/Medium/Large)"
                      value={subForm.size}
                      onChange={(e) => setSubForm((p) => ({ ...p, size: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="Allowed Terrains (comma-separated; e.g. Plains, Coastal, Underwater)"
                      value={subForm.allowedTerrainsCsv}
                      onChange={(e) => setSubForm((p) => ({ ...p, allowedTerrainsCsv: e.target.value }))}
                    />
                    <button type="button" className="btn-primary" disabled={saving} onClick={handleCreateSubtype}>
                      <Plus size={14} className="mr-1" />
                      Add Subtype
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

