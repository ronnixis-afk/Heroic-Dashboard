import { describe, expect, it } from 'vitest';
import { NEW_PLAYER_UI_SURVEY } from './newPlayerUi';
import {
  getSurveyById,
  listAllSurveys,
  questionLabelMap,
  ratingQuestionIds,
  textQuestionIds,
} from './catalog';

describe('Dashboard survey catalog', () => {
  it('includes new-player-ui', () => {
    expect(getSurveyById('new-player-ui')?.slug).toBe('new-player-ui');
    expect(listAllSurveys().length).toBeGreaterThanOrEqual(1);
  });

  it('derives rating and text ids per survey', () => {
    const ratings = ratingQuestionIds(NEW_PLAYER_UI_SURVEY);
    const texts = textQuestionIds(NEW_PLAYER_UI_SURVEY);
    const labels = questionLabelMap(NEW_PLAYER_UI_SURVEY);
    expect(ratings).toHaveLength(4);
    expect(texts).toEqual(['biggest_ui_friction']);
    expect(labels.realm_selection_clarity).toContain('Realm Selection');
    expect(NEW_PLAYER_UI_SURVEY.questions[0].highLabel).toBe('Everything was easy to find');
  });
});
