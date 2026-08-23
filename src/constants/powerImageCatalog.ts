/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Slim Power Image catalog for Media Library uploads.
 * Source of truth: heroic-ai-rpg/src/constants/powerImageCatalog.ts (categories)
 * and heroic-ai-rpg/src/types/Core.ts (DAMAGE_TYPES, POWER_DEBUFF_STATUS_EFFECTS via DEBUFF minus Unconscious/Surprised).
 *
 * Regenerate:
 *   npm run sync:power-catalog
 *
 * Last synced: 2026-08-23
 */

export const POWER_IMAGE_CATEGORIES = [
  "Single Damage",
  "Multi Damage",
  "Single Status",
  "Multi Status"
] as const;

export type PowerImageCategory = (typeof POWER_IMAGE_CATEGORIES)[number];

export const POWER_IMAGE_DAMAGE_SUBTYPES = [
  "Piercing",
  "Slashing",
  "Bludgeoning",
  "Fire",
  "Cold",
  "Electric",
  "Acid",
  "Necrotic",
  "Radiant",
  "Force",
  "Poison",
  "Psychic",
  "Thunder"
] as const;

export const POWER_IMAGE_STATUS_SUBTYPES = [
  "Stunned",
  "Paralyzed",
  "Poisoned",
  "Prone",
  "Blinded",
  "Deafened",
  "Charmed",
  "Dominated",
  "Petrified"
] as const;

const DAMAGE_CATEGORIES = new Set(["Single Damage","Multi Damage"]);

export const getPowerImageCategoryNames = (): PowerImageCategory[] => [...POWER_IMAGE_CATEGORIES];

export const getPowerImageSubtypes = (category: string): readonly string[] => {
  const match = POWER_IMAGE_CATEGORIES.find(
    (entry) => entry.toLowerCase() === category.trim().toLowerCase()
  );
  if (!match) return [];
  return DAMAGE_CATEGORIES.has(match) ? POWER_IMAGE_DAMAGE_SUBTYPES : POWER_IMAGE_STATUS_SUBTYPES;
};
