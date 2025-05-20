<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Preview'" />

      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>

        <div class="quill-editor" ref="quillEditor"></div>

        <div class="making-pairs-container">
          <div class="columns-wrapper">
            <svg ref="svgElement" class="svg-lines">
              <line
                v-for="(pair, index) in pairs"
                :key="index"
                :x1="pair.from.x"
                :y1="pair.from.y"
                :x2="pair.to.x"
                :y2="pair.to.y"
                :stroke="pair.color"
                stroke-width="2"
              />
            </svg>

            <div class="column column-left">
              <div
                v-for="(item, index) in shuffledLeftItems"
                :key="`left-${item.id}`"
                class="item-box"
                :class="{ selected: selected && selected.side === 'left' && selected.id === item.id, paired: isPaired('left', item.id) }"
                :style="getItemStyle('left', item.id)"
                @click="handleClick('left', item.id)"
                ref="leftRefs"
              >
                {{ item.text }}
                <div
                  class="handle left-handle"
                  :class="{ 'paired-handle': isPaired('left', item.id) }"
                  :ref="el => { if (el) leftHandles[item.id] = el }"
                  @click.stop="handleDeleteConnection('left', item.id)"
                ></div>
              </div>
            </div>

            <div class="column column-right">
              <div
                v-for="(item, index) in shuffledRightItems"
                :key="`right-${item.id}`"
                class="item-box"
                :class="{ selected: selected && selected.side === 'right' && selected.id === item.id, paired: isPaired('right', item.id) }"
                :style="getItemStyle('right', item.id)"
                @click="handleClick('right', item.id)"
                ref="rightRefs"
              >
                <div
                  class="handle right-handle"
                  :class="{ 'paired-handle': isPaired('right', item.id) }"
                  :ref="el => { if (el) rightHandles[item.id] = el }"
                  @click.stop="handleDeleteConnection('right', item.id)"
                ></div>
                {{ item.text }}
              </div>
            </div>
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

      <div class="card-footer text-end">
        <button class="btn btn-primary btn-sm" @click="submit">Submit</button>
        
        <button class="btn btn-console btn-sm ml-2" @click="closeReport" v-if="showReport">Close Report</button>
        <button class="btn btn-secondary btn-sm ms-2" @click="reset">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore'
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import Quill from 'quill'

const store = useTestStore()
const selectedElement = computed(() => store.selectedElement)
const elementLabel = computed(() => store.selectedElementLabel)
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
  shuffledLeftItems.value = shuffle(allLeftItems.value)
  shuffledRightItems.value = shuffle(allRightItems.value)
}

watch(interactionData, () => {
  applyShuffle()
})

watch(
  () => selectedElement.value?.el_InteractionData,
  (newVal) => {
    if (newVal) {
      applyShuffle()
      reset() // optionnel si tu veux aussi réinitialiser les paires
    }
  },
  { deep: true }
)


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

const score = computed(() => correctUserPairs.value.length * interactionData.value.pointsPerPair)
const maxScore = computed(() => interactionData.value.expectedPairs.length * interactionData.value.pointsPerPair)

function submit() {
  showReport.value = true
}

function reset() {
  showReport.value = false
  pairs.value = []
  pairsMap.clear()
  selected.value = null
  colorIndex.value = 0
  applyShuffle()
  updateConnections()
}

function handleClick(side, id) {
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
    })
    selected.value = null
  } else {
    selected.value = { side, id }
  }
}

function handleDeleteConnection(side, id) {
  const key = `${side}-${id}`
  if (!pairsMap.has(key)) return
  const other = getConnectedItem(side, id)
  const color = pairsMap.get(key)
  const index = pairs.value.findIndex(p => p.color === color)
  if (index !== -1) pairs.value.splice(index, 1)
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
  const key = `${side}-${id}`
  if (pairsMap.has(key)) {
    return { backgroundColor: pairsMap.get(key) }
  }
  if (selected.value && selected.value.side === side && selected.value.id === id) {
    return { backgroundColor: getColor() }
  }
  return {}
}

function getColor() {
  const colors = ['#A0C4FF', '#B9FBC0', '#FFC6FF', '#D0BFFF', '#FFD6A5', '#FFADAD', '#D3D3D3']
  return colors[colorIndex.value % colors.length]
}

function getHandlePosition(handle, element) {
  if (!handle || !element || !svgElement.value) return { x: 0, y: 0 }
  const rect = handle.getBoundingClientRect()
  const svgRect = svgElement.value.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top
  }
}

function updateConnections() {
  pairs.value = pairs.value.map(pair => {
    const leftIndex = shuffledLeftItems.value.findIndex(item => item.id === pair.leftId)
    const rightIndex = shuffledRightItems.value.findIndex(item => item.id === pair.rightId)
    return {
      ...pair,
      from: getHandlePosition(leftHandles[pair.leftId], leftRefs.value[leftIndex]),
      to: getHandlePosition(rightHandles[pair.rightId], rightRefs.value[rightIndex])
    }
  })
}

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
  applyShuffle()
  window.addEventListener('resize', updateConnections)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateConnections)
})
</script>


<style scoped>
.making-pairs-container {
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
  border: 1px solid #ccc;
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
</style>