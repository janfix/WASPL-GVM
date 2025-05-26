<!--
  TestRenderer.vue
  -----------------
  Auteur       : Janfix - Jean-Philippe Rivière
  Projet       : WASPL – Plateforme d'évaluation numérique
  Description  : Composant principal de rendu d’un test pour les apprenants.
  Licence      : AGPL-3.0 pour la communauté des développeurs et usage non commercial
                Propriétaire pour les utilisations professionnelles et commerciales
  Version      : 1.0.0
  Date         : 2025

  📌 Composant Vue 3 utilisant Bootstrap, Tabulator, et un système de rendu dynamique d’interactions.
-->

<template>
  <div class="test-renderer">
    <!-- Barre de navigation supérieure -->
    <topnavbar :testData="props.testData" :answers="props.answers" :stop-timer="props.stopTimer"
      @time-up="$emit('time-up')" @toggle-test-map="$emit('toggle-test-map')" />

    <div class="row">
      <div class="col-12">
        <div class="container wrapper">
          <!-- Carte du test affichée si activée -->
          <transition name="slide-down">
            <TestMap v-if="props.showTestMap" :publication="publicationStore?.publicationData"
              :testData="props.testData" :answers="props.answers" :currentPageIndex="props.currentPageIndex"
              @navigate-to-page="props.handleNavigateToPage" />
          </transition>

          <!-- Titre et description -->
          <h1 v-if="props.testData">{{ props.testData.title }}</h1>
          <div class="row">
            <div class="col">
              <p>{{ props.testData.Description }}</p>
            </div>
            <div v-if="!props.lastPageReached" class="col text-end" style="margin-right:30px">
              <b>{{ $t('Page') }} {{ props.currentPageIndex + 1 }}</b>
            </div>
          </div>

          <!-- Contenu de la page actuelle -->
          <div class="pageContainer">
            <template v-if="!props.lastPageReached && currentPage">
              <div class="itemContainer" v-for="child in currentPage.children" :key="child.id"
                :class="{ 'highlight-unanswered': unansweredHighlights.includes(child.id) }">
                <component :is="prepareInteractionComponent(child).component"
                  v-bind="prepareInteractionComponent(child).props" @interaction-started="handleInteractionStarted" />
              </div>
            </template>

            <!-- Dernière page -->
            <div v-if="props.lastPageReached">
              <LastPage :testData="props.testData" />
            </div>

            <!-- Boutons de navigation -->
            <div class="container navigation-buttons mt-4 mb-4">
              <div class="row">
                <div class="col">
                  <button v-if="showPrevButton" class="btn btn-primary me-2" @click="props.onPrevPage">
                    {{ $t('Previous page') }}
                  </button>
                </div>
                <div class="col text-end">
                  <button
                    v-if="!props.lastPageReached && currentPage && props.currentPageIndex + 1 < props.testData.pages.length"
                    class="btn btn-primary" @click="handleNextPageWithValidation">
                    {{ $t('Next Page') }}
                  </button>

                  <button
                    v-if="!props.lastPageReached && currentPage && props.currentPageIndex + 1 === props.testData.pages.length"
                    class="btn btn-primary sendToServer" @click="handleSendResultsWithValidation">
                    {{ $t('Send Results') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pied de page -->
    <Footer />

    <!-- Notification Toast -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
      <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive"
        aria-atomic="true" ref="unansweredToast">
        <div class="d-flex">
          <div class="toast-body">
            {{ $t('You must answer all the questions before going on to the next page') }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
            aria-label="Close"></button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>


// 📦 Importation des dépendances
import { ref, computed, onMounted, watch } from 'vue';
import { Toast } from 'bootstrap';

import topnavbar from './topnavbar.vue';
import TestMap from './TestMap.vue';
import LastPage from './LastPage.vue';
import Footer from '../views/footer.vue';

import { createInteraction } from '../interactions/InteractionFactory';
import { usePublicationStore } from '@/stores/usePublicationStore';
import { useResponsesStore } from '@/stores/useResponsesStore';
const responsesStore = useResponsesStore();
const token = localStorage.getItem('token');
const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
const userId = decoded?._id || decoded?.sub;

function isInteractionReadOnly(questionId) {
  if (typeof publicationStore.publicationData === 'undefined') { alert("DATABASE EXTRACTION DE READ ONLY FAUSSE!") }
  if (!publicationStore.publicationData?.readOnlyAnswer) return false;
  if (!props.lockedQuestions) return false;

  return props.lockedQuestions.has(questionId);
}

function prepareInteractionComponent(child) {
  const interaction = getInteractionComponent(child);
  return {
    ...interaction,
    props: {
      ...interaction.props,
      questionIndexMap: props.questionIndexMap
    }
  };
}

function handleInteractionStarted(questionId) {
  console.log("[TestRenderer] ✏️ handleInteractionStarted pour", questionId);

  const question = getQuestionById(questionId);
  console.log(`[TestRenderer] 🧹 Question retrouvée`, question);
  console.log(`[TestRenderer] 🧹 Question TYPE`, question.el_Type);
  if (!question) {
    console.warn(`[TestRenderer] ❗ Question introuvable pour ID ${questionId}`);
    return;
  }
}

// Ajoute une petite fonction utilitaire pour retrouver la question :
function getQuestionById(id) {
  return props.testData.elements.find(q => q.el_ID === id);
}

function getInteractionComponentPrepared(child) {
  const interactionData = getInteractionComponent(child);
  return interactionData;
}


function getInteractionComponent(child) {
  const question = getQuestion(child);
  const interaction = createInteraction(question, props.testData);

  const savedResponse = responsesStore.getResponseForQuestion(userId, question.el_ID);

  if (savedResponse) {
    const answerToRestore = savedResponse.selectedOptions || savedResponse.answered;
    interaction.restoreAnswer(answerToRestore);
  }

  // 🧠 Déterminer readOnly au niveau de l'interaction
  const questionReadOnly = isInteractionReadOnly(child.id);

  const interactionData = interaction.render();

  return {
    component: interactionData.component,
    props: {
      ...interactionData.props,
      questionIndexMap: props.questionIndexMap,
      readOnly: questionReadOnly, // 🔥 Ici on injecte readOnly proprement !
    }
  };
}






// 🧠 État local
const publicationStore = usePublicationStore();
const unansweredHighlights = ref([]);

// 🎯 Props attendues
const props = defineProps({
  testData: Object,
  questionIndexMap: Object,
  readOnly: Boolean,
  lockedQuestions: Object,
  showTestMap: Boolean,
  currentPageIndex: Number,
  lastPageReached: Boolean,
  answers: Object,
  stopTimer: Boolean,
  onPrevPage: Function,
  onNextPage: Function,
  onSendResults: Function,
  handleNavigateToPage: Function
});

const emit = defineEmits(['time-up', 'toggle-test-map', 'lock-question']);

// 🧮 Page actuelle calculée
const currentPage = computed(() => {
  if (
    !props.testData ||
    !Array.isArray(props.testData.pages) ||
    props.testData.pages.length === 0 ||
    props.currentPageIndex === null ||
    props.currentPageIndex === undefined ||
    props.currentPageIndex >= props.testData.pages.length
  ) {
    return null;
  }
  return props.testData.pages[props.currentPageIndex];
});

const showPrevButton = computed(() => {
  const browsingMode = publicationStore.publicationData?.browsing || 'free';

  if (browsingMode === 'noBack') return false;
  if (props.currentPageIndex === 0) return false;
  if (props.lastPageReached) return false;

  return true;
})

// 🔎 Récupération des données de question et composant associé
function getQuestion(child) {
  return props.testData.elements.find(el => el.el_ID === child.id);
}

// ⚠️ Gestion des questions non répondues
function triggerHighlight(id) {
  const index = unansweredHighlights.value.indexOf(id);
  if (index !== -1) unansweredHighlights.value.splice(index, 1);

  setTimeout(() => {
    unansweredHighlights.value.push(id);
    setTimeout(() => {
      const idx = unansweredHighlights.value.indexOf(id);
      if (idx !== -1) unansweredHighlights.value.splice(idx, 1);
    }, 2500);
  }, 0);
}

function hasUnansweredQuestion() {
  console.log("NOSKIPPER")
  const skipAllowed = publicationStore?.publicationData?.skip;
  if (skipAllowed) return false;

  const page = currentPage.value;
  if (!page || !Array.isArray(page.children)) return false;

  let foundUnanswered = false;

  for (const child of page.children) {
    const question = getQuestionById(child.id);
    console.log(question)
    // ⛔ On ignore les interactions de type 'Message'

    if (question?.el_Type === 'message') continue;

    const answer = props.answers[child.id];
    const isUnanswered =
      answer === undefined ||
      answer === null ||
      (Array.isArray(answer) && answer.length === 0) ||
      (typeof answer === 'string' && answer.trim() === '');

    if (isUnanswered) {
      triggerHighlight(child.id);
      foundUnanswered = true;
    }
  }

  return foundUnanswered;
}


// ▶️ Navigation conditionnelle
function handleNextPageWithValidation() {
  if (hasUnansweredQuestion()) {
    if (toastInstance) toastInstance.show();
    return;
  }

  // 🚀 🔥 On émet 'lock-hotspot' pour chaque élément de la page avant de changer de page
  const page = currentPage.value;
  if (page && page.children) {
    for (const child of page.children) {
      const question = getQuestionById(child.id);
      if (question?.el_Type === 'hotSpot') {
        window.dispatchEvent(new CustomEvent('lock-hotspot', { detail: { questionId: child.id } }));
      }
      if (question?.el_Type === 'makingPairs') {
        window.dispatchEvent(new CustomEvent('lock-makingPairs', { detail: { questionId: child.id } }));
}




    }
  }

  props.onNextPage();
}


function handleSendResultsWithValidation() {
  if (hasUnansweredQuestion()) {
    if (toastInstance) toastInstance.show();
    return;
  }
  props.onSendResults();
}

// 📢 Toast Bootstrap
const unansweredToast = ref(null);
let toastInstance = null;

onMounted(() => {
  if (unansweredToast.value) {
    toastInstance = new Toast(unansweredToast.value);
  }
});
</script>

<style scoped>
.test-renderer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.wrapper {
  flex: 1;
  margin-top: 70px;
}

.sendToServer {
  margin-left: 10px;
}

/* Transitions pour l’affichage de la carte */
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

/* Boutons de navigation */
.navigation-buttons {
  padding: 0 50px 30px;
}

/* Mise en surbrillance des questions non répondues */
.highlight-unanswered {
  border: 6px solid red;
  border-radius: 8px;
  animation: pulse-border 2.5s ease-out forwards;
}

@keyframes pulse-border {
  0% {
    border-color: red;
  }

  100% {
    border-color: transparent;
  }
}
</style>