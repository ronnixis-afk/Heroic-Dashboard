import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRaceKey,
  getRaceAliases,
  getRacePortraitCount,
} from '../src/lib/raceAliasUtils.js';

describe('raceAliasUtils', () => {
  it('normalizes race strings to singular lowercase keys', () => {
    assert.equal(normalizeRaceKey('Werewolves'), 'werewolf');
    assert.equal(normalizeRaceKey('Elves'), 'elf');
    assert.equal(normalizeRaceKey('Dwarves'), 'dwarf');
    assert.equal(normalizeRaceKey('Humans'), 'human');
    assert.equal(normalizeRaceKey('Dark-Elf'), 'dark-elf');
  });

  it('provides aliases for Werewolf <-> Lycanthrope', () => {
    const werewolfAliases = getRaceAliases('Werewolf');
    assert.ok(werewolfAliases.includes('lycanthrope'));

    const lycanthropeAliases = getRaceAliases('Lycanthrope');
    assert.ok(lycanthropeAliases.includes('werewolf'));
  });

  it('provides aliases for Halfling / Gnome to Halfling/Gnome', () => {
    const halflingAliases = getRaceAliases('Halfling');
    assert.ok(halflingAliases.includes('halfling/gnome'));

    const forestGnomeAliases = getRaceAliases('Forest Gnome');
    assert.ok(forestGnomeAliases.includes('halfling/gnome'));
  });

  it('provides parent race aliases for subraces', () => {
    const highElfAliases = getRaceAliases('High Elf');
    assert.ok(highElfAliases.includes('elf'));

    const mountainDwarfAliases = getRaceAliases('Mountain Dwarf');
    assert.ok(mountainDwarfAliases.includes('dwarf'));
  });

  it('resolves portrait count with case-insensitivity (Dark-Elf vs Dark-elf)', () => {
    const counts = { 'Dark-elf': 64, 'Half-orc': 44 };
    assert.equal(getRacePortraitCount(counts, 'Dark-Elf'), 64);
    assert.equal(getRacePortraitCount(counts, 'Half-Orc'), 44);
  });

  it('resolves portrait count via alias (Werewolf -> Lycanthrope)', () => {
    const counts = { Lycanthrope: 96, Human: 272 };
    assert.equal(getRacePortraitCount(counts, 'Werewolf'), 96);
    assert.equal(getRacePortraitCount(counts, 'Human'), 272);
  });

  it('returns 0 for truly uncovered races', () => {
    const counts = { Lycanthrope: 96, Human: 272 };
    assert.equal(getRacePortraitCount(counts, 'Dhampir'), 0);
    assert.equal(getRacePortraitCount(counts, 'Djinn Scion'), 0);
    assert.equal(getRacePortraitCount(counts, 'Ghost'), 0);
    assert.equal(getRacePortraitCount(counts, 'Homunculus'), 0);
  });

  it('aggregates counts across fragmented casing variants', () => {
    const counts = { 'Dark-elf': 60, 'Dark-Elf': 4 };
    assert.equal(getRacePortraitCount(counts, 'Dark-Elf'), 64);
  });

  it('resolves hyphen vs space variants', () => {
    const counts = { 'Half-elf': 64 };
    assert.equal(getRacePortraitCount(counts, 'Half Elf'), 64);
    assert.equal(getRacePortraitCount(counts, 'Half-Elf'), 64);
  });

  it('handles empty, None, and Any Race inputs gracefully', () => {
    const counts = { Human: 100 };
    assert.equal(getRacePortraitCount(counts, ''), 0);
    assert.equal(getRacePortraitCount(counts, 'None'), 0);
    assert.equal(getRacePortraitCount(counts, 'Any Race'), 0);
    assert.equal(getRacePortraitCount(counts, null), 0);
    assert.equal(getRacePortraitCount(counts, undefined), 0);
  });
});
