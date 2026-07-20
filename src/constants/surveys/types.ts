/**
 * Keep in sync with heroic-ai-rpg/src/lib/surveys/
 */

export type SurveyQuestionType = 'rating' | 'text';
export type SurveyStatus = 'open' | 'closed';

export interface SurveyQuestionDef {
  id: string;
  label: string;
  type: SurveyQuestionType;
  max?: number;
  /** Label for rating 1 (shown under the scale). */
  lowLabel?: string;
  /** Label for the highest rating (shown under the scale). */
  highLabel?: string;
  maxLength?: number;
  required?: boolean;
}

export interface SurveyDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: SurveyStatus;
  maxQuestions: number;
  questions: SurveyQuestionDef[];
}

export function ratingQuestionIds(survey: SurveyDefinition): string[] {
  return survey.questions.filter((q) => q.type === 'rating').map((q) => q.id);
}

export function textQuestionIds(survey: SurveyDefinition): string[] {
  return survey.questions.filter((q) => q.type === 'text').map((q) => q.id);
}

export function questionLabelMap(survey: SurveyDefinition): Record<string, string> {
  return Object.fromEntries(survey.questions.map((q) => [q.id, q.label]));
}
