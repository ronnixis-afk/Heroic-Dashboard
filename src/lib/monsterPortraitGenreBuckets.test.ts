import { describe, expect, it } from 'vitest';
import {
  getEffectiveSubtypeGenres,
  isMonsterSubtypeInImageGenre,
  isSharedMonsterSubtype,
} from './monsterPortraitGenreBuckets';

describe('monster portrait genre buckets', () => {
  it('inherits type genres when the subtype has none', () => {
    expect(getEffectiveSubtypeGenres([], ['Fantasy', 'Modern'])).toEqual(['Fantasy', 'Modern']);
    expect(getEffectiveSubtypeGenres(['Sci-Fi'], ['Fantasy'])).toEqual(['Sci-Fi']);
  });

  it('shares non-humanoids that spawn in two, three, or all genres', () => {
    expect(isSharedMonsterSubtype('Undead', ['Fantasy', 'Modern'], ['Fantasy'])).toBe(true);
    expect(isSharedMonsterSubtype('Beast', [], ['Fantasy', 'Modern', 'Sci-Fi'])).toBe(true);
    expect(isSharedMonsterSubtype('Beast', [], [])).toBe(true);
    expect(isSharedMonsterSubtype('Undead', ['Sci-Fi'], ['Fantasy'])).toBe(false);
    expect(isSharedMonsterSubtype('Humanoid', [], ['Fantasy', 'Modern', 'Sci-Fi'])).toBe(false);
  });

  it('lists shared non-humanoids only under Mixed', () => {
    const shared = ['Undead', ['Fantasy', 'Modern'], ['Fantasy']] as const;
    expect(isMonsterSubtypeInImageGenre(...shared, 'Mixed')).toBe(true);
    expect(isMonsterSubtypeInImageGenre(...shared, 'Fantasy')).toBe(false);
    expect(isMonsterSubtypeInImageGenre(...shared, 'Modern')).toBe(false);
  });

  it('lists single-genre non-humanoids only under their genre', () => {
    expect(isMonsterSubtypeInImageGenre('Undead', ['Sci-Fi'], ['Fantasy'], 'Sci-Fi')).toBe(true);
    expect(isMonsterSubtypeInImageGenre('Undead', ['Sci-Fi'], ['Fantasy'], 'Fantasy')).toBe(false);
    expect(isMonsterSubtypeInImageGenre('Undead', ['Sci-Fi'], ['Fantasy'], 'Mixed')).toBe(false);
  });

  it('lists humanoids under each of their spawn genres, never Mixed', () => {
    const typeGenres = ['Fantasy', 'Modern', 'Sci-Fi'];
    expect(isMonsterSubtypeInImageGenre('Humanoid', [], typeGenres, 'Fantasy')).toBe(true);
    expect(isMonsterSubtypeInImageGenre('Humanoid', [], typeGenres, 'Sci-Fi')).toBe(true);
    expect(isMonsterSubtypeInImageGenre('Humanoid', [], typeGenres, 'Mixed')).toBe(false);
    expect(isMonsterSubtypeInImageGenre('Humanoid', ['Modern'], typeGenres, 'Fantasy')).toBe(false);
  });

  it('lists everything under Any Genre', () => {
    expect(isMonsterSubtypeInImageGenre('Undead', ['Fantasy', 'Modern'], [], 'Any Genre')).toBe(true);
    expect(isMonsterSubtypeInImageGenre('Humanoid', ['Modern'], [], 'Any Genre')).toBe(true);
  });
});
