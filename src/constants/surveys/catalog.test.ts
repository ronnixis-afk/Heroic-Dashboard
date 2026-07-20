import { describe, expect, it } from 'vitest';
import {
  PRODUCT_COMPLETENESS_SURVEY,
} from './productCompleteness';
import {
  getSurveyById,
  listAllSurveys,
  questionLabelMap,
  ratingQuestionIds,
  textQuestionIds,
} from './catalog';

describe('Dashboard survey catalog', () => {
  it('includes product-completeness', () => {
    expect(getSurveyById('product-completeness')?.slug).toBe('product-completeness');
    expect(listAllSurveys().length).toBeGreaterThanOrEqual(1);
  });

  it('derives rating and text ids per survey', () => {
    const ratings = ratingQuestionIds(PRODUCT_COMPLETENESS_SURVEY);
    const texts = textQuestionIds(PRODUCT_COMPLETENESS_SURVEY);
    const labels = questionLabelMap(PRODUCT_COMPLETENESS_SURVEY);
    expect(ratings).toHaveLength(4);
    expect(texts).toEqual(['biggest_missing_feature']);
    expect(labels.overall_completeness).toBe('Overall Completeness');
  });
});
