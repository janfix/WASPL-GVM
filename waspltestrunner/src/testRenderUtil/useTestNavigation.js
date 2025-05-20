// src/testRenderUtil/useTestNavigation.js
import { ref } from 'vue';

export function useTestNavigation(testData) {
  const currentPageIndex = ref(0);

  const prevPage = () => {
    if (currentPageIndex.value > 0) currentPageIndex.value--;
  };

  const nextPage = () => {
    if (currentPageIndex.value + 1 < testData.value.pages.length) {
      currentPageIndex.value++;
    }
  };

  const goToPage = (index) => {
    if (index >= 0 && index < testData.value.pages.length) {
      currentPageIndex.value = index;
    }
  };

  const getQuestionIndexMap = () => {
    if (!testData.value || !Array.isArray(testData.value.pages)) return {};

    let index = 1;
    const map = {};

    for (const page of testData.value.pages) {
      for (const child of page.children || []) {
        const el = testData.value.elements.find(e => e.el_ID === child.id);
        if (el && el.el_Type !== 'message') {
          map[el.el_ID] = index++;
        }
      }
    }

    return map;
  };

  return {
    currentPageIndex,
    prevPage,
    nextPage,
    goToPage,
    getQuestionIndexMap
  };
}
