import type { SurveyDefinition } from './types';

/** Mirror of heroic-ai-rpg/src/lib/surveys/newPlayerUi.ts */
export const NEW_PLAYER_UI_SURVEY: SurveyDefinition = {
  id: 'new-player-ui',
  slug: 'new-player-ui',
  title: 'Getting Started',
  description:
    'For New Players — Help Us See If The UI And World Setup Feel Clear. About A Minute.',
  status: 'open',
  maxQuestions: 5,
  questions: [
    {
      id: 'realm_selection_clarity',
      label:
        'How did you find the Realm Selection page — did it clearly show what you can do?',
      type: 'rating',
      max: 5,
      required: true,
      lowLabel: "I wasn't sure what to do",
      highLabel: 'Everything was easy to find',
    },
    {
      id: 'world_creation_clarity',
      label: 'How straightforward was forging a new realm?',
      type: 'rating',
      max: 5,
      required: true,
      lowLabel: 'Confusing or overwhelming',
      highLabel: 'Clear and straightforward',
    },
    {
      id: 'party_and_journey_clarity',
      label: 'How clear was creating your party and beginning the journey?',
      type: 'rating',
      max: 5,
      required: true,
      lowLabel: 'I got stuck or unsure',
      highLabel: 'I knew exactly what to do',
    },
    {
      id: 'menu_and_map_findability',
      label:
        'How easy was it to find menu items and the Map once you were in a realm?',
      type: 'rating',
      max: 5,
      required: true,
      lowLabel: 'Hard to find what I needed',
      highLabel: 'Menus and Map were easy to find',
    },
    {
      id: 'biggest_ui_friction',
      label: 'Where did you get stuck or feel unsure, if anywhere?',
      type: 'text',
      maxLength: 500,
      required: true,
    },
  ],
};
