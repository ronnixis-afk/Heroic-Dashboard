import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  PRESET_LOOK_ALIKE_TAGS,
  formatLookAlikeTagLabel,
  normalizeLookAlikeTag,
} from '../../lib/raceAliasUtils';

interface LookAlikeTagsFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Shown under the label; defaults to the backend-only reminder. */
  helpText?: string;
  disabled?: boolean;
}

/**
 * Preset chips + custom input for race look-alike tags (`cat-like`).
 * Tags are backend-only: world creation uses them to match a player's species to genre portraits.
 */
export default function LookAlikeTagsField({
  value,
  onChange,
  helpText = 'Backend Only. Matches A Player’s Species To These Portraits During World Creation; Never Shown In Game.',
  disabled = false,
}: LookAlikeTagsFieldProps) {
  const [customTag, setCustomTag] = useState('');
  const selected = new Set(value);
  const customSelected = value.filter(
    (tag) => !(PRESET_LOOK_ALIKE_TAGS as readonly string[]).includes(tag)
  );

  const toggle = (tag: string) => {
    if (disabled) return;
    onChange(selected.has(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const addCustom = () => {
    const tag = normalizeLookAlikeTag(customTag);
    if (!tag || disabled) return;
    if (!selected.has(tag)) onChange([...value, tag]);
    setCustomTag('');
  };

  const chipClass = (active: boolean) =>
    `min-h-[32px] rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? 'border-brand-accent/60 bg-brand-accent/20 text-brand-accent'
        : 'border-brand-primary bg-brand-primary/30 text-brand-text-muted hover:text-brand-text'
    }`;

  return (
    <div>
      <label className="input-label mb-0">Look-Alike Tags</label>
      <p className="help-text mb-2">{helpText}</p>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_LOOK_ALIKE_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag)}
            className={chipClass(selected.has(tag))}
            aria-pressed={selected.has(tag)}
          >
            {formatLookAlikeTagLabel(tag)}
          </button>
        ))}
        {customSelected.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag)}
            className={`${chipClass(true)} inline-flex items-center gap-1`}
            title="Remove Custom Tag"
          >
            {formatLookAlikeTagLabel(tag)}
            <X size={11} />
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={customTag}
          disabled={disabled}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom Tag, e.g. Owl-Like"
          className="input-field text-xs"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={disabled || !normalizeLookAlikeTag(customTag)}
          className="btn-secondary flex min-h-[36px] items-center gap-1 text-xs"
        >
          <Plus size={13} />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}
