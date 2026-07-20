import type { SurveyDefinition } from './types';

/** Mirror of heroic-ai-rpg/src/lib/surveys/productCompleteness.ts */
export const PRODUCT_COMPLETENESS_SURVEY: SurveyDefinition = {
  id: 'product-completeness',
  slug: 'product-completeness',
  title: 'Product Survey',
  description:
    'Help Us Understand How Complete The Game Feels So We Can Prioritize What To Build Next.',
  status: 'open',
  maxQuestions: 5,
  questions: [
    {
      id: 'overall_completeness',
      label: 'Overall Completeness',
      type: 'rating',
      max: 5,
      required: true,
    },
    {
      id: 'combat_systems_depth',
      label: 'Combat & Systems Depth',
      type: 'rating',
      max: 5,
      required: true,
    },
    {
      id: 'world_lore_depth',
      label: 'World & Lore Depth',
      type: 'rating',
      max: 5,
      required: true,
    },
    {
      id: 'character_progression_depth',
      label: 'Character & Progression Depth',
      type: 'rating',
      max: 5,
      required: true,
    },
    {
      id: 'biggest_missing_feature',
      label: 'Biggest Missing Feature',
      type: 'text',
      maxLength: 500,
      required: true,
    },
  ],
};
