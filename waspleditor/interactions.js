export const interactions = {

  noEditor: {
    model: () => import('./src/components/interactions/noEditor/model.json'),
    editor: () => import('./src/components/interactions/noEditor/Editor.vue'),
    preview: () => import('./src/components/interactions/noEditor/Preview.vue'),
  },

  hotSpot: {
    model: () => import('./src/components/interactions/hotSpot/model.json'),
    editor: () => import('./src/components/interactions/hotSpot/Editor.vue'),
    preview: () => import('./src/components/interactions/hotSpot/Preview.vue'),
  },


  match: {
    model: () => import('./src/components/interactions/match/model.json'),
    editor: () => import('./src/components/interactions/match/Editor.vue'),
    preview: () => import('./src/components/interactions/match/Preview.vue'),
  },

  makingPairs: {
    model: () => import('./src/components/interactions/makingPairs/model.json'),
    editor: () => import('./src/components/interactions/makingPairs/Editor.vue'),
    preview: () => import('./src/components/interactions/makingPairs/Preview.vue'),
  },
    choice: {
      model: () => import('./src/components/interactions/choice/model.json'),
      editor: () => import('./src/components/interactions/choice/Editor.vue'),
      preview: () => import('./src/components/interactions/choice/Preview.vue'),
    },
    message: {
      model: () => import('./src/components/interactions/message/model.json'),
      editor: () => import('./src/components/interactions/message/Editor.vue'),
      preview: () => import('./src/components/interactions/message/Preview.vue'),
    },
    order: {
      model: () => import('./src/components/interactions/order/model.json'),
      editor: () => import('./src/components/interactions/order/Editor.vue'),
      preview: () => import('./src/components/interactions/order/Preview.vue'),
    },
    shortAnswer: {
      model: () => import('./src/components/interactions/shortAnswer/model.json'),
      editor: () => import('./src/components/interactions/shortAnswer/Editor.vue'),
      preview: () => import('./src/components/interactions/shortAnswer/Preview.vue'),
    },
    textGaps: {
      model: () => import('./src/components/interactions/textGaps/model.json'),
      editor: () => import('./src/components/interactions/textGaps/Editor.vue'),
      preview: () => import('./src/components/interactions/textGaps/Preview.vue'),
    },
    choiceBlock: {
      model: () => import('./src/components/interactions/choiceBlock/model.json'),
      editor: () => import('./src/components/interactions/choiceBlock/Editor.vue'),
      preview: () => import('./src/components/interactions/choiceBlock/Preview.vue'),
    },
  };
  