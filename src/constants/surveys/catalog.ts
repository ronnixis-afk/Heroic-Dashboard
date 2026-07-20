import { PRODUCT_COMPLETENESS_SURVEY } from './productCompleteness';
import type { SurveyDefinition } from './types';

/** Mirror of heroic-ai-rpg/src/lib/surveys/catalog.ts */
export const SURVEY_CATALOG: SurveyDefinition[] = [PRODUCT_COMPLETENESS_SURVEY];

const byId = new Map(SURVEY_CATALOG.map((s) => [s.id, s]));

export function getSurveyById(id: string): SurveyDefinition | undefined {
  return byId.get(id);
}

export function listAllSurveys(): SurveyDefinition[] {
  return [...SURVEY_CATALOG];
}

export {
  ratingQuestionIds,
  textQuestionIds,
  questionLabelMap,
  type SurveyDefinition,
  type SurveyQuestionDef,
} from './types';
