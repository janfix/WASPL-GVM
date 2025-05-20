<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :numOrder="getQuestionNumber() === 'N/A' ? numOrder : getQuestionNumber()"
        :elementType="selectedElement.el_Type" :mode="'Preview'" />

      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>

        <div class="quill-editor" ref="quillEditor"></div>

        <div class="making-pairs-container">
          
            <div class="columns-wrapper">
              <svg ref="svgElement" class="svg-lines">
                <line v-for="(pair, index) in pairs" :key="index" :x1="pair.from.x" :y1="pair.from.y" :x2="pair.to.x"
                  :y2="pair.to.y" :stroke="pair.color" stroke-width="2" />
              </svg>

              <div class="column column-left">
                <div v-for="(item, index) in shuffledLeftItems" :key="`left-${item.id}`" class="item-box"
                  :class="{ selected: selected && selected.side === 'left' && selected.id === item.id, paired: isPaired('left', item.id) }"
                  :style="getItemStyle('left', item.id)" @click="handleClick('left', item.id)" ref="leftRefs">
                  {{ item.text }}
                  <div class="handle left-handle" :class="{ 'paired-handle': isPaired('left', item.id) }"
                    :ref="el => { if (el) leftHandles[item.id] = el }"
                    @click.stop="handleDeleteConnection('left', item.id)"></div>
                </div>
              </div>

              <div class="column column-right">
                <div v-for="(item, index) in shuffledRightItems" :key="`right-${item.id}`" class="item-box"
                  :class="{ selected: selected && selected.side === 'right' && selected.id === item.id, paired: isPaired('right', item.id) }"
                  :style="getItemStyle('right', item.id)" @click="handleClick('right', item.id)" ref="rightRefs">
                  <div class="handle right-handle" :class="{ 'paired-handle': isPaired('right', item.id) }"
                    :ref="el => { if (el) rightHandles[item.id] = el }"
                    @click.stop="handleDeleteConnection('right', item.id)"></div>
                  {{ item.text }}
                </div>
              </div>

              <div v-show="localReadonly" class="canvas-overlay"></div>


            </div>
          
        </div>

        <div v-if="showReport" class="ReportContainer mt-4">
          <h5>Résultats :</h5>
          <ul class="mb-2">
            <li v-for="(pair, i) in pairs" :key="'report-' + i">
              {{ getLabel('left', pair.leftId) }} ⇨ {{ getLabel('right', pair.rightId) }}
              <span v-if="isCorrect(pair.leftId, pair.rightId)">✅</span>
              <span v-else>❌</span>
            </li>
          </ul>
          <div class="mt-2">
            <strong>Score :</strong>
            {{ score }} / {{ maxScore }} points
            ({{ ((score / maxScore) * 100).toFixed(0) }}%)
          </div>
        </div>
      </div>

      <cardFooterLearningMode v-if="publicationStore.publicationData?.mode !== 'exam'" :showReport="showReport"
        :submitAnswers="showReportOnSubmit" :closeReport="closeReport" :resetSelections="resetSelections" />
    </div>
  </div>
</template>

<script setup>
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore'
import cardHeader from './cardHeader.vue';
import cardFooterLearningMode from './cardFooterLearningMode.vue';
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import Quill from 'quill'


const publicationStore = usePublicationStore()
const restoredPairs = ref(null);
const responsesStore = useResponsesStore();
defineEmits(['interaction-started'])
const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  testData: {
    type: Object,
    required: true,
  },
  numOrder: [Number, null],

  questionIndexMap: {
    type: Object, // ✅ correction ici
    required: false
  },
  restoredAnswer: {
    type: [String, Array, null],
    default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  },

});

const localReadonly = ref(props.readOnly);

const savedResponse = ref(null);

// TEST RENDER ADAPATIATION 
const selectedElement = computed(() => props.question);
//SUPPRESSION DE 


const showReport = ref(false)
const quillEditor = ref(null)
let quillInstance = null

const pairs = ref([])
const selected = ref(null)
const colorIndex = ref(0)
const pairsMap = reactive(new Map())
const leftHandles = reactive({})
const rightHandles = reactive({})
const leftRefs = ref([])
const rightRefs = ref([])
const svgElement = ref(null)

const interactionData = computed(() => selectedElement.value?.el_InteractionData || { expectedPairs: [], pointsPerPair: 1 })

const allLeftItems = computed(() => interactionData.value.expectedPairs.map((pair, i) => ({ id: i, text: pair.left })))
const allRightItems = computed(() => interactionData.value.expectedPairs.map((pair, i) => ({ id: i, text: pair.right })))

const shuffledLeftItems = ref([])
const shuffledRightItems = ref([])

const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;

const results = ref({
  score: 0,
  error: 0,
  mark: 0,
  chosenPairs: [],
});

const closeReport = () => {
  showReport.value = false;
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function applyShuffle() {
  //console.log("🧪 applyShuffle: restoredPairs =", restoredPairs.value);

  try {
    const orderLeft = savedResponse.value?.orderLeft;
    const orderRight = savedResponse.value?.orderRight;

    if (Array.isArray(orderLeft) && Array.isArray(orderRight) && orderLeft.length && orderRight.length) {
      //console.log("🔁 Restauration des ordres initiaux");

      shuffledLeftItems.value = orderLeft
        .map(text => allLeftItems.value.find(i => i.text === text))
        .filter(Boolean);

      shuffledRightItems.value = orderRight
        .map(text => allRightItems.value.find(i => i.text === text))
        .filter(Boolean);

    } else if (restoredPairs.value && restoredPairs.value.length > 0) {
      //console.log("🔁 Restauration active : pas de shuffle");

      shuffledLeftItems.value = [...allLeftItems.value];
      shuffledRightItems.value = [...allRightItems.value];

    } else {
      //console.log("🔀 Mélange des items (pas de restauration)");

      shuffledLeftItems.value = shuffle(allLeftItems.value);
      shuffledRightItems.value = shuffle(allRightItems.value);
    }

  } catch (err) {
    console.error("❌ Erreur dans applyShuffle:", err);
    shuffledLeftItems.value = shuffle(allLeftItems.value);
    shuffledRightItems.value = shuffle(allRightItems.value);
  }
}




watch(interactionData, () => {
  // 🧠 Si une restauration est en cours, ne mélange pas
  if (restoredPairs.value && restoredPairs.value.length > 0) {
    console.log("🛑 Pas de shuffle dans le watch (restauration active)");
    return;
  }
  console.log("🔁 Shuffle via watch (pas de restauration)");
  applyShuffle();
});

const userPairs = computed(() =>
  pairs.value.map(p => ({
    left: getLabel('left', p.leftId),
    right: getLabel('right', p.rightId)
  }))
)

function getLabel(side, id) {
  const items = side === 'left' ? shuffledLeftItems.value : shuffledRightItems.value
  const found = items.find(i => i.id === id)
  return found ? found.text : '???'
}

function isCorrect(leftId, rightId) {
  const left = getLabel('left', leftId)
  const right = getLabel('right', rightId)
  return interactionData.value.expectedPairs.some(p => p.left === left && p.right === right)
}

const correctUserPairs = computed(() =>
  userPairs.value.filter(pair =>
    interactionData.value.expectedPairs.some(expected =>
      expected.left === pair.left && expected.right === pair.right
    )
  )
)

// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
};

const score = computed(() => correctUserPairs.value.length * interactionData.value.pointsPerPair)
const maxScore = computed(() => {
  const score = selectedElement.value?.maxScore;
  return !isNaN(score) ? Number(score) : 0;
});

function submit() {
  showReport.value = true
  submitAnswers()
}

function reset() {
  showReport.value = false
  pairs.value = []
  pairsMap.clear()
  selected.value = null
  colorIndex.value = 0
  results.value.chosenPairs = [];
  applyShuffle()
  updateConnections()
}


function showReportOnSubmit() {
  submit(); // ⬅️ c’est bien `submit` qui gère l’ouverture du report
}

function resetSelections() {
  reset(); // ⬅️ c’est bien `reset` qui remet tout à zéro
}

function handleClick(side, id) {
  if (localReadonly.value) return;
  const key = `${side}-${id}`
  if (pairsMap.has(key)) return
  if (!selected.value) {
    selected.value = { side, id }
  } else if (selected.value.side !== side) {
    const color = getColor()
    const leftId = side === 'left' ? id : selected.value.id
    const rightId = side === 'right' ? id : selected.value.id
    pairsMap.set(`left-${leftId}`, color)
    pairsMap.set(`right-${rightId}`, color)
    const leftIndex = shuffledLeftItems.value.findIndex(item => item.id === leftId)
    const rightIndex = shuffledRightItems.value.findIndex(item => item.id === rightId)
    nextTick(() => {
      const from = getHandlePosition(leftHandles[leftId], leftRefs.value[leftIndex])
      const to = getHandlePosition(rightHandles[rightId], rightRefs.value[rightIndex])
      pairs.value.push({ from, to, color, leftId, rightId })
      colorIndex.value++
      submitAnswers()
    })
    selected.value = null
  } else {
    selected.value = { side, id }
  }
}

function lockPairs(event) {
  console.log("[makingPairsRender] 🔒 Reçu lock-makingPairs pour", event.detail?.questionId);

  if (event.detail && event.detail.questionId !== props.question.el_ID) {
    console.warn("[makingPairsRender] ❌ Ce lock n'est pas pour moi !");
    return;
  }
  
  console.log(`[makingPairsRender] 🔒 Lock accepté pour ${props.question.el_ID}`);
  localReadonly.value = true;
}



function handleDeleteConnection(side, id) {
  if (localReadonly.value) return;
  const key = `${side}-${id}`
  if (!pairsMap.has(key)) return
  const other = getConnectedItem(side, id)
  const color = pairsMap.get(key)
  const index = pairs.value.findIndex(p => p.color === color)
  if (index !== -1) pairs.value.splice(index, 1)
  submitAnswers();
  pairsMap.delete(key)
  if (other) pairsMap.delete(`${other.side}-${other.id}`)
}

function isPaired(side, id) {
  return pairsMap.has(`${side}-${id}`)
}

function getConnectedItem(side, id) {
  const color = pairsMap.get(`${side}-${id}`)
  if (!color) return null
  const otherSide = side === 'left' ? 'right' : 'left'
  const list = otherSide === 'left' ? shuffledLeftItems.value : shuffledRightItems.value
  for (const item of list) {
    if (pairsMap.get(`${otherSide}-${item.id}`) === color) {
      return { side: otherSide, id: item.id }
    }
  }
  return null
}

function getItemStyle(side, id) {
  const key = `${side}-${id}`;
  if (pairsMap.has(key)) {
    const bgColor = pairsMap.get(key);
    return { backgroundColor: bgColor };
  }
  if (selected.value && selected.value.side === side && selected.value.id === id) {
    return { backgroundColor: getColor() };
  }
  return {};
}

function getColor() {
  const colors = ['#A0C4FF', '#B9FBC0', '#FFC6FF', '#D0BFFF', '#FFD6A5', '#FFADAD', '#D3D3D3']
  return colors[colorIndex.value % colors.length]
}

function getHandlePosition(handle, element) {
  if (!handle || !element || !svgElement.value) {
    console.warn("Éléments manquants pour calculer la position du handle", { handle, element, svg: svgElement.value });
    return { x: 0, y: 0 };
  }

  try {
    const rect = handle.getBoundingClientRect();
    const svgRect = svgElement.value.getBoundingClientRect();

    // Vérifier que les rectangles sont valides
    if (rect.width === 0 || rect.height === 0 || svgRect.width === 0 || svgRect.height === 0) {
      console.warn("Dimensions invalides des rectangles", { rect, svgRect });
      return { x: 0, y: 0 };
    }

    return {
      x: rect.left + rect.width / 2 - svgRect.left,
      y: rect.top + rect.height / 2 - svgRect.top
    };
  } catch (error) {
    console.error("Erreur lors du calcul de la position du handle:", error);
    return { x: 0, y: 0 };
  }
}

function updateConnections() {
  // Attendre que les éléments soient bien rendus
  nextTick(() => {
    // Créer un nouveau tableau pour éviter des problèmes de réactivité
    const updatedPairs = [];

    for (const pair of pairs.value) {
      const leftIndex = shuffledLeftItems.value.findIndex(item => item.id === pair.leftId);
      const rightIndex = shuffledRightItems.value.findIndex(item => item.id === pair.rightId);

      if (leftIndex >= 0 && rightIndex >= 0) {
        const leftHandle = leftHandles[pair.leftId];
        const rightHandle = rightHandles[pair.rightId];

        if (leftHandle && rightHandle) {
          const from = getHandlePosition(leftHandle, leftRefs.value[leftIndex]);
          const to = getHandlePosition(rightHandle, rightRefs.value[rightIndex]);

          updatedPairs.push({
            ...pair,
            from,
            to
          });
        } else {
          console.warn("Handles manquants pour la paire:", pair);
          updatedPairs.push(pair); // Conserver la paire même sans mise à jour
        }
      } else {
        console.warn("Index introuvables pour la paire:", pair);
        updatedPairs.push(pair); // Conserver la paire même sans mise à jour
      }
    }

    // Remplacer le tableau original
    pairs.value = updatedPairs;
  });
}


// Ajouter cette fonction pour restaurer les connexions de façon plus robuste
function restoreConnectionsFromSavedData() {
  // Vider toutes les connexions existantes
  pairs.value = [];
  pairsMap.clear();
  colorIndex.value = 0;

  if (!restoredPairs.value || !Array.isArray(restoredPairs.value) || restoredPairs.value.length === 0) {
    console.log("Aucune paire à restaurer");
    return;
  }

  //console.log("🔁 Tentative de restauration de", restoredPairs.value.length, "paires");

  // Intervalle de vérification pour s'assurer que les DOM éléments sont prêts
  const checkInterval = setInterval(() => {
    // Vérifier si les handles sont disponibles
    const leftHandlesReady = shuffledLeftItems.value.every(item => leftHandles[item.id]);
    const rightHandlesReady = shuffledRightItems.value.every(item => rightHandles[item.id]);

    if (leftHandlesReady && rightHandlesReady && svgElement.value) {
      //  console.log("✅ Tous les éléments sont prêts pour la restauration");
      clearInterval(checkInterval);

      // Restaurer chaque paire
      restoredPairs.value.forEach((pair) => {
        const leftItem = shuffledLeftItems.value.find(item => item.text === pair.left);
        const rightItem = shuffledRightItems.value.find(item => item.text === pair.right);

        if (leftItem && rightItem) {
          const color = getColor();

          // Enregistrer la connexion dans la map
          pairsMap.set(`left-${leftItem.id}`, color);
          pairsMap.set(`right-${rightItem.id}`, color);

          // Ajouter la paire au tableau
          const leftIndex = shuffledLeftItems.value.findIndex(item => item.id === leftItem.id);
          const rightIndex = shuffledRightItems.value.findIndex(item => item.id === rightItem.id);

          // Force recalcul des positions
          const from = calculateHandlePosition('left', leftItem.id, leftIndex);
          const to = calculateHandlePosition('right', rightItem.id, rightIndex);

          pairs.value.push({
            leftId: leftItem.id,
            rightId: rightItem.id,
            color,
            from,
            to
          });

          colorIndex.value++;
          submitAnswers();

        } else {
          console.warn("❌ Impossible de trouver les éléments correspondants pour la paire:", pair);
        }
      });

      // Forcer une mise à jour supplémentaire après un court délai
      setTimeout(() => {
        forceSVGUpdate();
      }, 200);
    }
  }, 100);

  // Arrêter l'intervalle après 5 secondes pour éviter qu'il tourne indéfiniment
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 5000);
}

// Fonction pour calculer la position d'un handle de façon plus robuste
function calculateHandlePosition(side, id, index) {
  try {
    const handle = side === 'left' ? leftHandles[id] : rightHandles[id];
    const refElement = side === 'left' ? leftRefs.value[index] : rightRefs.value[index];

    if (!handle || !refElement || !svgElement.value) {
      console.warn(`Éléments manquants pour ${side}-${id}`, { handle, refElement, svg: !!svgElement.value });
      return { x: side === 'left' ? 100 : 300, y: 100 + (index * 50) }; // Position par défaut
    }

    const handleRect = handle.getBoundingClientRect();
    const svgRect = svgElement.value.getBoundingClientRect();

    return {
      x: handleRect.left + handleRect.width / 2 - svgRect.left,
      y: handleRect.top + handleRect.height / 2 - svgRect.top
    };
  } catch (error) {
    console.error(`Erreur de calcul pour ${side}-${id}:`, error);
    return { x: side === 'left' ? 100 : 300, y: 100 + (index * 50) }; // Position par défaut
  }
}

// Fonction pour forcer une mise à jour du SVG
function forceSVGUpdate() {
  const tempPairs = [...pairs.value];
  pairs.value = [];

  // Force redraw by clearing and re-adding pairs
  nextTick(() => {
    const updatedPairs = tempPairs.map(pair => {
      const leftIndex = shuffledLeftItems.value.findIndex(item => item.id === pair.leftId);
      const rightIndex = shuffledRightItems.value.findIndex(item => item.id === pair.rightId);

      const from = calculateHandlePosition('left', pair.leftId, leftIndex);
      const to = calculateHandlePosition('right', pair.rightId, rightIndex);

      return { ...pair, from, to };
    });

    pairs.value = updatedPairs;
    //console.log("🔄 SVG mis à jour avec", pairs.value.length, "lignes");
  });
}


const submitAnswers = () => {
  //console.log("💾 Tentative de sauvegarde...")
  if (userPairs.value.length === 0) {
    alert("Veuillez créer au moins une paire !");
    return;
  }

  results.value.score = score.value;
  results.value.mark = ((score.value / maxScore.value) * 100).toFixed(2);
  results.value.chosenPairs = userPairs.value;

  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    selectedPairs: userPairs.value,
    orderLeft: shuffledLeftItems.value.map(i => i.text),
    orderRight: shuffledRightItems.value.map(i => i.text),
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore.value,
    score: results.value.score,
    mark: results.value.mark,
    hint: null
  };

  //console.log("🧾 Données à enregistrer", response);
  responsesStore.saveResponse(response);
  //console.log("💾 Donnée enregistrée :", response);

  if (props.testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', userId);
  }

  //console.log('✅ Pairing Answer submitted:', response);
  return response;
};



function decodeToken(token) {
  if (!token) {
    //console.error('Le token est null ou non défini');
    return null;
  }
  try {
    const payload = token.split('.')[1]; // Extraire la partie payload
    return JSON.parse(atob(payload)); // Décoder le payload (Base64)
  } catch (error) {
    console.error('Erreur lors du décodage du token :', error);
    return null;
  }
}

watch(() => props.readOnly, (newVal) => {
  console.log("[makingPairs] props.readOnly a changé :", newVal);
  localReadonly.value = newVal;
});


onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false }
    });
    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }
  }

  const response = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);

  if (response?.selectedPairs) {
    restoredPairs.value = response.selectedPairs;
    savedResponse.value = response; // ✅ assignation ici
    //console.log("📥 Données chargées:", restoredPairs.value);
  } else {
    restoredPairs.value = null;
    savedResponse.value = null;
  }


  // Étape 2 : On applique le shuffle en fonction de restoredPairs
  applyShuffle();

  // Étape 3 : On restaure si possible
  nextTick(() => {
    if (restoredPairs.value && restoredPairs.value.length > 0) {
      restoreConnectionsFromSavedData();
    } else {
      console.log("⚠️ Aucune donnée à restaurer");
    }
  });

  window.addEventListener('resize', forceSVGUpdate);
  window.addEventListener('lock-makingPairs', lockPairs);
});







onBeforeUnmount(() => {
  window.removeEventListener('lock-makingPairs', lockPairs);
  window.removeEventListener('resize', updateConnections)
})
</script>


<style scoped>
.making-pairs-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.columns-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 2rem;
}

.svg-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 1;
  min-width: 150px;
}

.column-left {
  align-items: flex-end;
  margin-right: 4rem;
}

.column-right {
  align-items: flex-start;
  margin-left: 4rem;
}

.item-box {
  background-color: white;
  border: 2px solid #aaa;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.item-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-box.selected {
  border-color: #666;
}

.item-box.paired {
  color: rgb(51, 50, 50);
  border-color: transparent;
}

.handle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #A0C4FF;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  border: 2px solid white;
  cursor: pointer;
  transition: transform 0.2s;
}

.paired-handle {
  cursor: pointer;
}

.paired-handle:hover {
  transform: translateY(-50%) scale(1.2);
}

.left-handle {
  right: -8px;
}

.right-handle {
  left: -8px;
}

.actions {
  margin-top: 1rem;
}

.shuffle-button {
  background-color: #A0C4FF;
  color: #333;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.shuffle-button:hover {
  background-color: #8BB0FF;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.quill-editor {
  min-height: max-content !important;
  height: auto !important;

  overflow: hidden !important;
  transition: height 0.3s ease;
}

.btn-console {
  background-color: rgb(78 54 54);
  color: white;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
}

.item-box.paired {
  transition: box-shadow 0.5s ease;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  z-index: 1000;
  pointer-events: all;
  cursor: not-allowed;
}
</style>