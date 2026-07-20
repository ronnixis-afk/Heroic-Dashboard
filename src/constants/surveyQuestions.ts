/**
 * @deprecated Use src/constants/surveys/catalog.ts
 * Kept for transitional imports during multi-survey refactor.
 */
import { NEW_PLAYER_UI_SURVEY } from './surveys/newPlayerUi';
import { questionLabelMap, ratingQuestionIds, textQuestionIds } from './surveys/types';

export const SURVEY_QUESTION_LABELS = questionLabelMap(NEW_PLAYER_UI_SURVEY);
export const RATING_QUESTION_IDS = ratingQuestionIds(NEW_PLAYER_UI_SURVEY) as readonly string[];
export const TEXT_QUESTION_ID = textQuestionIds(NEW_PLAYER_UI_SURVEY)[0] ?? 'biggest_ui_friction';
