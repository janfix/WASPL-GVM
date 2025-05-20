<template>
  <div class="test-renderer">
    <div v-if="testData">
      <TestMap :testData="testData" :answers="answers" :currentPageIndex="currentPageIndex"
        @navigate-to-page="handleNavigateToPage" />
      <div class="row">
        <div class="col-12">
          <div class="container wrapper">

            <transition name="slide-down">
              <TestMap v-if="showTestMap" :testData="testData" :answers="answers" :currentPageIndex="currentPageIndex"
                @navigate-to-page="handleNavigateToPage" />
            </transition>

            <h1>{{ testData.title }}</h1>
            <div class="row">
              <div class="col">
                <p>{{ testData.Description }}</p>
              </div>
              <div class="col text-end me-4">
                <b>PAGE {{ currentPageIndex + 1 }}</b>
              </div>
            </div>

            <div class="pageContainer">
              <template v-if="renderedChildren.length > 0">
                <div class="itemContainer" v-for="child in renderedChildren" :key="child.id">
                  <component :is="child.component" v-bind="{
                    ...child.props,
                    questionIndexMap
                  }" />
                </div>
              </template>

              <div v-else class="alert alert-warning mt-4">
                Aucun contenu à afficher pour cette page.
              </div>

              <div class="Endpage" v-if="lastPageReached">
                <LastPage :testData="testData" />
              </div>

              <div class="container navigation-buttons mt-4 mb-4">
                <div class="row">
                  <div class="col">
                    <button v-if="currentPageIndex > 0" class="btn btn-primary me-2" :disabled="readOnly"
                      @click="onPrevPage">Previous
                      page</button>
                  </div>
                  <div class="col text-end">
                    <button v-if="currentPage && currentPageIndex + 1 < testData.pages.length" class="btn btn-primary"
                      :disabled="readOnly" @click="onNextPage">Next page</button>

                    <button v-if="currentPage && currentPageIndex + 1 === testData.pages.length && !readOnly"
                      class="btn btn-primary sendToServer" @click="onSendResults">Send results</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center mt-5">
      <p><i>Loading test preview…</i></p>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import TestMap from './TestMap.vue'
import LastPage from './LastPage.vue'
import Footer from '../views/footer.vue'
import { useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { createInteraction } from '../interactions/InteractionFactory'

const props = defineProps({
  questionIndexMap: Array,
  readOnly: Boolean,
  currentPageIndex: Number,
  lastPageReached: Boolean,
  answers: Object,
  stopTimer: Boolean,
  onPrevPage: Function,
  onNextPage: Function,
  onSendResults: Function,
  handleNavigateToPage: Function
})

const route = useRoute()
const testData = ref(null)

// fallback locaux pour preview autonome
const readOnly = props.readOnly ?? true
const lastPageReached = props.lastPageReached ?? false
const answers = props.answers ?? {}
/* const questionIndexMap = props.questionIndexMap ?? [] */
const onSendResults = props.onSendResults ?? (() => { })
const stopTimer = props.stopTimer ?? false

const showTestMap = ref(false);

const isAutonomous = props.onNextPage === undefined;
const currentPageIndex = isAutonomous
  ? ref(0)
  : props.currentPageIndex;

const onNextPage = isAutonomous
  ? () => {
    if (currentPageIndex.value + 1 < testData.value.pages.length) {
      currentPageIndex.value++;
    }
  }
  : props.onNextPage;

const onPrevPage = isAutonomous
  ? () => {
    if (currentPageIndex.value > 0) {
      currentPageIndex.value--;
    }
  }
  : props.onPrevPage;


defineEmits(['time-up', 'toggle-test-map'])

const testId = route.query.testId


const handleNavigateToPage = isAutonomous
  ? (pageIndex) => {
    console.log("📌 handleNavigateToPage appelé avec :", pageIndex);
    currentPageIndex.value = pageIndex;
  }
  : props.handleNavigateToPage;


  const questionIndexMap = computed(() => {
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
});



const currentPage = computed(() => {
  const index = isAutonomous
    ? currentPageIndex.value
    : props.currentPageIndex;

  if (
    !testData.value ||
    !Array.isArray(testData.value.pages) ||
    testData.value.pages.length === 0 ||
    index >= testData.value.pages.length
  ) {
    return null;
  }
  return testData.value.pages[index];
});



function getQuestion(child) {
  const question = testData.value.elements.find(el => el.el_ID === child.id)
  if (!question) {
    console.warn("❗️ Question non trouvée pour child.id =", child.id)
  }
  return question
}

const renderedChildren = computed(() => {
  if (!currentPage.value || !Array.isArray(currentPage.value.children)) return [];

  return currentPage.value.children.map(child => {
    const question = getQuestion(child);
    if (!question) return null;

    const interaction = createInteraction(question, testData.value);
    const rendered = interaction.render();

    return {
      id: child.id,
      component: rendered.component,
      props: {
        ...rendered.props,
        numOrder: questionIndexMap.value?.[question.el_ID] ?? null,
        questionIndexMap: questionIndexMap.value
      }
    };
  }).filter(Boolean);
});



onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_TESTRUNNER_API || 'http://localhost:5174';
    const res = await fetch(`${apiBase}/tests/${testId}`);
    testData.value = await res.json()
    console.log("✅ testData reçu :", testData.value)
    console.log("📄 page 1 :", testData.value.pages?.[0])
  } catch (err) {
    console.error('❌ Erreur de chargement du test :', err)
  }
})
</script>

<style scoped>
.wrapper {
  margin-top: 70px;
}

.sendToServer {
  margin-left: 10px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.4s ease-in-out, opacity 0.4s ease-in-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.navigation-buttons {
  padding-left: 50px;
  padding-right: 50px;
  padding-bottom: 30px;
}
</style>
