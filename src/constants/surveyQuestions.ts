/**
 * @deprecated Use src/constants/surveys/catalog.ts
 * Kept for transitional imports during multi-survey refactor.
 */
import { PRODUCT_COMPLETENESS_SURVEY } from './surveys/productCompleteness';
import { questionLabelMap, ratingQuestionIds, textQuestionIds } from './surveys/types';

export const SURVEY_QUESTION_LABELS = questionLabelMap(PRODUCT_COMPLETENESS_SURVEY);
export const RATING_QUESTION_IDS = ratingQuestionIds(PRODUCT_COMPLETENESS_SURVEY) as readonly string[];
export const TEXT_QUESTION_ID = textQuestionIds(PRODUCT_COMPLETENESS_SURVEY)[0] ?? 'biggest_missing_feature';
