<template>
  <TestRenderer
  :testData="testData"
  :questionIndexMap="questionIndexMap"
  :readOnly="publicationStore.publicationData?.readOnlyAnswer || false"
  :visitedPages="visitedPages"
  :lockedQuestions="lockedQuestions"
  :showTestMap="showTestMap"
  :currentPageIndex="currentPageIndex"
  :lastPageReached="lastPageReached"
  :answers="answers"
  :stopTimer="stopTimer"
  :onPrevPage="prevPage"
  :onNextPage="wrappedNextPage"
  :onSendResults="afterTest"
  :handleNavigateToPage="wrappedGoToPage"
  @time-up="onTimeUp"
  @toggle-test-map="toggleTestMap"
  @lock-question="handleLockQuestion"
/>

</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';
import { useResponsesStore } from '@/stores/useResponsesStore';
import { usePublicationStore } from '@/stores/usePublicationStore';
import TestRenderer from './TestRenderer.vue';
import { useTestNavigation } from '@/testRenderUtil/useTestNavigation';
import { useTestDataLoader } from '@/testRenderUtil/useTestDataLoader';
import { useSessionManager } from '@/testRenderUtil/useSessionManager';
import { useResultSender } from '@/testRenderUtil/useResultSender';

const lockedQuestions = ref(new Set());
const route = useRoute();
const publicationStore = usePublicationStore();
const responsesStore = useResponsesStore();

const testId = ref(route.query.testId);
const publicationId = route.query.publicationId;
const groupId = route.query.groupId;
const stopTimer = ref(false);
const showTestMap = ref(false);
const lastPageReached = ref(false);
const toggleTestMap = () => showTestMap.value = !showTestMap.value;
const lastPageChanger = () => lastPageReached.value = !lastPageReached.value;
const questionIndexMap = ref({});
const visitedPages = ref(new Set()); // 🆕 Ajout ici !

const { testData, fetchTestData } = useTestDataLoader(testId);
const { currentPageIndex, prevPage, nextPage, goToPage, getQuestionIndexMap } = useTestNavigation(testData);

const token = localStorage.getItem('token');
let userId = null;
if (token) {
  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    userId = decodedToken?._id || decodedToken?.sub;
  } catch (e) {
    console.error("Token decoding failed:", e);
  }
}
 // J'ai besoin de récupérer la valeur access de la publication



let sessionManager = null;

//const publicationOwnerId = publicationStore.publicationData?.owner;

const { sendResultsToDatabase } = useResultSender(responsesStore);

const answers = computed(() => {
  return responsesStore.responses.reduce((acc, r) => {
    acc[r.questionId] = r.answered;
    return acc;
  }, {});
});

function handleLockQuestion(questionId) {
  lockedQuestions.value.add(questionId);
}

function lockCurrentPageQuestions() {
  const currentPage = testData.value.pages[currentPageIndex.value];
  if (!currentPage) return;

  for (const child of currentPage.children) {
    const answer = answers.value[child.id];

    const isAnswered =
      answer !== undefined &&
      answer !== null &&
      (!Array.isArray(answer) || answer.length > 0) &&
      (typeof answer !== 'string' || answer.trim() !== '');

    if (isAnswered) {
      lockedQuestions.value.add(child.id);
    }
  }
}



// 🚀 Wrappers pour enregistrer la page visitée au bon moment
function wrappedNextPage() {
  lockCurrentPageQuestions(); // 🆕 Avant de changer de page
  visitedPages.value.add(currentPageIndex.value);
  nextPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wrappedGoToPage(index) {
  if (index > currentPageIndex.value) {
    lockCurrentPageQuestions(); // 🆕 Avant de sauter à une page suivante
    visitedPages.value.add(currentPageIndex.value);
  }
  goToPage(index);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


async function afterTest() {
  stopTimer.value = true;
  lastPageChanger();
  await sendResultsToDatabase({ userId, testId: testId.value, publicationId, groupId,owner: publicationStore.publicationData?.owner });
  await sessionManager?.endSession(false);

  try {
    await api.patch(`/publications/${publicationId}/increment-attempts`);
    console.log("🚀 owner transmis :", publicationStore.publicationData?.owner);
  } catch (e) {
    console.error("Erreur incrément publication:", e);
  }
}

const onTimeUp = async() => {
  stopTimer.value = true;
  sendResultsToDatabase({ userId, testId: testId.value, publicationId, groupId, owner: publicationStore.publicationData?.owner });
  await sessionManager?.endSession(false);
};



onMounted(async () => {
  await fetchTestData();

  if (publicationId) {
    await publicationStore.fetchPublication(publicationId);
  }

  const publicationAccess = publicationStore.publicationData?.access;

  sessionManager = useSessionManager(
    testId,
    publicationId,
    groupId,
    userId,
    publicationAccess
  );

  if (token && userId) {
    await sessionManager.startSession();
  }

  window.addEventListener('beforeunload', onBeforeUnload);
});

watch(() => publicationStore.publicationData, (val) => {
  if (val) console.log("📘 Publication data maintenant disponible :", val);
});


onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});

const onBeforeUnload = async (event) => {
  if (sessionId.value && !lastPageReached.value) {
    try {
      await sessionManager?.endSession(true); // abandon
    } catch (e) {
      console.warn('Abandon non enregistré à temps');
    }
  }
};

watch(testData, () => {
  if (testData.value.pages) {
    questionIndexMap.value = getQuestionIndexMap();
  }
});
</script>

<style scoped>
.sendToServer {
  margin-left: 10px;
}
</style>
