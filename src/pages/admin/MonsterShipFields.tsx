import {
  COMBAT_FLAVOR_TEMPLATE_NAMES,
  SHIP_CREW_CLASSES,
  SHIP_SUBTYPE_ARCHETYPES,
  type MonsterGenre,
  type MonsterSubtype,
  type MonsterSubtypeAcquisition,
  type MonsterSubtypeShipDetails,
  type ShipCrewClass,
} from '../../hooks/useMonsterCatalog';

/** Matches the RPG seed: atmosphere hulls fly open sky, space hulls fly the space map. */
export const SHIP_ATMOSPHERE_TERRAINS = ['Airborne', 'Mountain', 'Plains', 'Forest', 'Coastal'];
export const SHIP_SPACE_TERRAINS = ['Orbital', 'Deep Space', 'Airborne', 'Warp Rift'];

export type ShipDraft = {
  genre: MonsterGenre;
  archetype: string;
  crewClass: ShipCrewClass;
  spaceCapable: boolean;
  template: string;
  combatMode: 'automatic' | 'noncombat';
  fixedCr: number;
  price: number;
  imagePrompt: string;
};

export const EMPTY_SHIP_DRAFT: ShipDraft = {
  genre: 'Fantasy',
  archetype: 'Aerial',
  crewClass: 'small',
  spaceCapable: false,
  template: 'Tank',
  combatMode: 'automatic',
  fixedCr: 3,
  price: 500,
  imagePrompt: '',
};

const GENRES: MonsterGenre[] = ['Fantasy', 'Modern', 'Sci-Fi'];

const CREW_LABELS: Record<ShipCrewClass, string> = {
  small: 'Small (1 Crew)',
  medium: 'Medium (2 To 3 Crew)',
  large: 'Large (4 To 6 Crew)',
};

const positiveInt = (value: unknown, fallback: number): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
};

export const shipDraftFromSubtype = (subtype: MonsterSubtype): ShipDraft => {
  const acq = subtype.acquisition;
  const details = subtype.shipDetails;
  const genre = (subtype.genres || []).find((g): g is MonsterGenre => GENRES.includes(g));
  return {
    genre: genre ?? 'Fantasy',
    archetype: subtype.archetype || 'Aerial',
    crewClass: details?.crewClass ?? 'small',
    spaceCapable: Boolean(details?.spaceCapable),
    template: acq?.template || 'Tank',
    combatMode: acq?.combatMode === 'noncombat' ? 'noncombat' : 'automatic',
    fixedCr: positiveInt(acq?.fixedCr, 3),
    price: positiveInt(acq?.price, 500),
    imagePrompt: details?.imagePrompt || '',
  };
};

/** Subtype fields every Ship row must carry (RPG `validateShipSubtypeRules`). */
export const shipPayloadFromDraft = (
  draft: ShipDraft
): Pick<
  MonsterSubtype,
  'genres' | 'archetype' | 'movementModes' | 'primaryMovementMode' | 'encounterExcluded' | 'rideable'
> & { acquisition: MonsterSubtypeAcquisition; shipDetails: MonsterSubtypeShipDetails } => ({
  genres: [draft.genre],
  archetype: draft.archetype,
  movementModes: ['fly'],
  primaryMovementMode: 'fly',
  encounterExcluded: true,
  rideable: false,
  acquisition: {
    allyKind: 'ship',
    template: draft.template,
    combatMode: draft.combatMode,
    progressionMode: 'fixed',
    fixedCr: positiveInt(draft.fixedCr, 1),
    price: positiveInt(draft.price, 1),
    levelsWithParty: false,
  },
  shipDetails: {
    crewClass: draft.crewClass,
    spaceCapable: draft.spaceCapable,
    imagePrompt: draft.imagePrompt.trim() || null,
  },
});

export function ShipDetailsFields({
  idPrefix,
  value,
  disabled,
  onChange,
  onSpaceCapableChange,
}: {
  idPrefix: string;
  value: ShipDraft;
  disabled?: boolean;
  onChange: (patch: Partial<ShipDraft>) => void;
  /** Lets the parent swap Allowed Terrains to the matching flight set. */
  onSpaceCapableChange?: (spaceCapable: boolean) => void;
}) {
  return (
    <div className="space-y-3 border-t border-brand-border/40 pt-3">
      <div>
        <p className="section-title">Ship Details</p>
        <p className="help-text">
          Sold At Shipyards And Crewed As Enemy Hulls. Ships Always Fly And Never Roll As Random Encounters.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-genre`}>
            Genre
          </label>
          <select
            id={`${idPrefix}-genre`}
            className="input-field cursor-pointer"
            value={value.genre}
            disabled={disabled}
            onChange={(e) => onChange({ genre: e.target.value as MonsterGenre })}
          >
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-archetype`}>
            Archetype
          </label>
          <select
            id={`${idPrefix}-archetype`}
            className="input-field cursor-pointer"
            value={value.archetype}
            disabled={disabled}
            onChange={(e) => onChange({ archetype: e.target.value })}
          >
            {SHIP_SUBTYPE_ARCHETYPES.map((archetype) => (
              <option key={archetype} value={archetype}>
                {archetype}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-crew`}>
            Crew Class
          </label>
          <select
            id={`${idPrefix}-crew`}
            className="input-field cursor-pointer"
            value={value.crewClass}
            disabled={disabled}
            onChange={(e) => onChange({ crewClass: e.target.value as ShipCrewClass })}
          >
            {SHIP_CREW_CLASSES.map((crew) => (
              <option key={crew} value={crew}>
                {CREW_LABELS[crew]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-space`}>
            Travel Range
          </label>
          <select
            id={`${idPrefix}-space`}
            className="input-field cursor-pointer"
            value={value.spaceCapable ? 'space' : 'atmosphere'}
            disabled={disabled}
            onChange={(e) => {
              const spaceCapable = e.target.value === 'space';
              onChange({ spaceCapable });
              onSpaceCapableChange?.(spaceCapable);
            }}
          >
            <option value="atmosphere">Atmosphere Only</option>
            <option value="space">Space Capable</option>
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-template`}>
            Combat Template
          </label>
          <select
            id={`${idPrefix}-template`}
            className="input-field cursor-pointer"
            value={value.template}
            disabled={disabled}
            onChange={(e) => onChange({ template: e.target.value })}
          >
            {COMBAT_FLAVOR_TEMPLATE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-combat-mode`}>
            Combat Mode
          </label>
          <select
            id={`${idPrefix}-combat-mode`}
            className="input-field cursor-pointer"
            value={value.combatMode}
            disabled={disabled}
            onChange={(e) => onChange({ combatMode: e.target.value as ShipDraft['combatMode'] })}
          >
            <option value="automatic">Combat</option>
            <option value="noncombat">Non-Combat</option>
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-cr`}>
            Base CR
          </label>
          <input
            id={`${idPrefix}-cr`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="input-field"
            value={value.fixedCr}
            disabled={disabled}
            onChange={(e) => onChange({ fixedCr: positiveInt(e.target.value, 1) })}
          />
        </div>
        <div>
          <label className="input-label" htmlFor={`${idPrefix}-price`}>
            Base Price
          </label>
          <input
            id={`${idPrefix}-price`}
            type="number"
            min={1}
            step={50}
            inputMode="numeric"
            className="input-field"
            value={value.price}
            disabled={disabled}
            onChange={(e) => onChange({ price: positiveInt(e.target.value, 1) })}
          />
        </div>
      </div>
      <p className="help-text">
        Base CR And Base Price Apply At Party Level 1; The Shipyard Scales Both With Party Level.
      </p>
      <div>
        <label className="input-label" htmlFor={`${idPrefix}-image-prompt`}>
          Image Prompt
        </label>
        <textarea
          id={`${idPrefix}-image-prompt`}
          className="input-field !h-auto py-2 leading-relaxed"
          rows={2}
          placeholder="Looks like… (Ship Portrait art reference; never shown in game)."
          value={value.imagePrompt}
          disabled={disabled}
          onChange={(e) => onChange({ imagePrompt: e.target.value })}
        />
      </div>
    </div>
  );
}
