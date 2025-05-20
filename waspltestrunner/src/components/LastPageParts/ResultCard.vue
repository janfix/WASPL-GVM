<template>
    <div class="cardReport row">
        <!-- Colonne score / état -->
        <div :class="scoreClass" class="col-2 scoreContainer">
            <template v-if="answer.score !== 'AI'">
                {{ answer.score }}
            </template>

            <template v-else-if="element?.AIisActivated">
                <div v-if="!showCorrection" style="padding:5px">
                    <button type="button" class="GetAIBT" @click="$emit('launch-ai-correction', answer)">
                        Get AI Correction
                    </button>
                </div>
                <div v-else class="totalQScore" :class="getTotalQScoreClass">
                    {{ totalQScoreRef }}
                </div>
            </template>

            <template v-else>
                <div class="p-2 text-center" style="font-size: 0.8rem;">
                    Human correction is required.
                </div>
            </template>
        </div>

        <!-- Contenu -->
        <div class="col-9">
            <i>{{ answer.questionLabel }}</i>
            <div v-if="answer.score === 'AI' && isLoading">
                <img src="../assets/loading.gif" alt="Loading..." class="loading-gif" />
                <p>Processing your answer, please wait...</p>
            </div>

            <!-- Accordéon contenant tous les items -->
            <div v-if="answer.score === 'AI' && showCorrection && results.correction.length > 0" class="accordion"
                :id="'accordion-' + answer.questionId">

                
                <!-- Bloc détails correction -->
                <div class="accordion-item">
                    <h2 class="accordion-header" :id="'headingCorrection-' + answer.questionId">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            :data-bs-target="'#collapseCorrection-' + answer.questionId"
                            :aria-controls="'collapseCorrection-' + answer.questionId">
                            <h5>AI Correction details :</h5>
                        </button>
                    </h2>

                    <div :id="'collapseCorrection-' + answer.questionId" class="accordion-collapse collapse"
                        :aria-labelledby="'headingCorrection-' + answer.questionId">
                        <div class="accordion-body">
                            <div v-for="(correction, index) in results.correction" :key="index" class="card mb-3">
                                <div class="card-body">
                                    <h6><strong>Axis:</strong> {{ correction.axis }}</h6>
                                    <p><strong>Answer:</strong> {{ correction.response.answer }}</p>
                                    <p><strong>Response:</strong> {{ correction.response.comment }}</p>
                                    <p><strong>Score axis {{ index }}:</strong> {{ correction.score }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bloc paramètres -->
                <div class="accordion-item">
                    <h2 class="accordion-header" :id="'headingParams-' + answer.questionId">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            :data-bs-target="'#collapseParams-' + answer.questionId"
                            :aria-controls="'collapseParams-' + answer.questionId">
                            <h5>AI parameters :</h5> 
                        </button>
                    </h2>
                    
                    <div :id="'collapseParams-' + answer.questionId" class="accordion-collapse collapse"
                        :aria-labelledby="'headingParams-' + answer.questionId">
                        <div class="accordion-body" style="background-color: black; color: orange">
                            <h5>Final Prompt</h5>
                            <p>{{ correctionPrompt }}</p>
                            <h5>AI Model: {{ results.AImodel }}</h5>
                            <p>AI response duration: ...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    </div>
</template>

<script setup>
import { computed, onMounted, onUpdated, nextTick } from 'vue';
import { totalQScoreRef } from '@/utils/evaluationContext';

const props = defineProps({
    answer: Object,
    results: Object,
    isLoading: Boolean,
    showCorrection: Boolean,
    correctionPrompt: String,
    testData: Object,
});

const emit = defineEmits(['launch-ai-correction']);

const element = computed(() =>
    props.testData?.elements?.find(el => el.el_ID === props.answer.questionId)
);

const scoreClass = computed(() => {
    if (props.answer.score === 'AI') return 'AIProcess';
    const score = parseFloat(props.answer.score);
    return score > 0 ? 'bg-green' : 'bg-red';
});

const getTotalQScoreClass = computed(() => {
    if (totalQScoreRef.value > 0) return 'bg-green scoreContainerLarge';
    if (totalQScoreRef.value < 0) return 'bg-red scoreContainerLarge';
    return '';
});

// Bootstrap est accessible globalement si tu as importé le JS dans main.js
function initBootstrapAccordions() {
  if (typeof bootstrap !== 'undefined') {
    // Stocker les références aux instances de collapse pour les gérer plus tard
    const collapseInstances = [];
    
    document.querySelectorAll('.accordion-collapse').forEach(collapseElement => {
      // Créer une instance pour chaque élément
      const bsCollapse = new bootstrap.Collapse(collapseElement, {
        toggle: false // Démarrer fermé
      });
      
      // Stocker l'instance avec son ID
      collapseInstances.push({
        id: collapseElement.id,
        instance: bsCollapse
      });
      
      // Configurer les écouteurs d'événements pour le bouton correspondant
      const headerId = collapseElement.getAttribute('aria-labelledby');
      const button = document.querySelector(`#${headerId} button`);
      
      if (button) {
        // Supprimer les écouteurs existants pour éviter les doublons
        button.removeEventListener('click', handleButtonClick);
        button.addEventListener('click', handleButtonClick);
      }
    });
    
    // Fonction pour gérer le clic sur les boutons
    function handleButtonClick(event) {
      const button = event.currentTarget;
      const targetId = button.getAttribute('data-bs-target').substring(1); // Enlever le #
      
      // Trouver l'instance correspondante
      const collapseInstance = collapseInstances.find(item => item.id === targetId);
      
      if (collapseInstance) {
        // Vérifier si l'élément est ouvert
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          collapseInstance.instance.hide();
        } else {
          collapseInstance.instance.show();
        }
      }
    }
  }
}



onMounted(() => {
  nextTick(() => {
    // Vérifier si Bootstrap est chargé correctement
    if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
      console.log('Bootstrap Collapse is available');
      initBootstrapAccordions();
    } else {
      console.error('Bootstrap JS is not loaded or accessible');
    }
  });
});


onUpdated(() => {
    nextTick(() => {
    initBootstrapAccordions();
  });
});


</script>

<style scoped>
.cardReport {
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid gainsboro;
    border-radius: 5px;
}

.loading-gif {
    width: 50px;
    height: 50px;
    margin-bottom: 10px;
}

.scoreContainer {
    text-align: center;
    padding: 5px;
    margin: -10px 0px -10px -10px;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.AIProcess {
    background-color: gainsboro;
    text-align: center;
    padding: 5px 5px 0px 5px;
    margin: -10px 10px -10px -10px;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.GetAIBT {
    font-size: 0.8em;
    margin-top: -5px;
    border: 1px grey solid;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}
</style>