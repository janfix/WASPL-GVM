<template>
  <div class="match-editor card p-3">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form @submit.prevent="saveElement">
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text" />
            </h3>
          </div>
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>
        </form>

        <div class="row">
          <table class="table table-bordered align-middle text-center small">
            <thead>
              <tr>
                <th style="width: 25%"></th>
                <th v-for="(col, cIndex) in columns" :key="'col-' + cIndex">
                  <div class="input-group input-group-sm">
                    <input type="text" class="form-control text-center" v-model="col.label" placeholder="Colonne" />
                    <button class="btn btn-outline-secondary" type="button" @click="removeColumn(cIndex)" title="Supprimer colonne">🗑️</button>
                  </div>
                </th>
                <th>
                  <button class="btn btn-sm btn-outline-primary" @click="addColumn">+Col.</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIndex) in rows" :key="'row-' + rIndex">
                <td>
                  <div class="input-group input-group-sm">
                    <input type="text" class="form-control" v-model="row.label" placeholder="Row" />
                    <button class="btn btn-outline-secondary" type="button" @click="removeRow(rIndex)" title="Supprimer ligne">🗑️</button>
                  </div>
                </td>
                <td v-for="(col, cIndex) in columns" :key="'cell-' + rIndex + '-' + cIndex">
                  <input type="checkbox" v-model="solutionMatrix[rIndex][cIndex]" />
                </td>
                <td></td>
              </tr>
              <tr>
                <td colspan="100%">
                  <button class="btn btn-sm btn-outline-primary" @click="addRow">+Row</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h5 class="mt-3">Scoring</h5>
          <i style="font-size: small; color: grey">Only positive values are accepted</i>
          <div class="row">
            <div class="col-6">
              <div class="input-group mb-3">
                <div class="input-group-prepend">
                  <span class="input-group-text">Right Match weight:</span>
                </div>
                <input type="number" min="0" class="form-control" v-model.number="scoring.right" />
              </div>
            </div>
            <div class="col-6">
              <div class="input-group mb-3">
                <div class="input-group-prepend">
                  <span class="input-group-text">Wrong Match penalty:</span>
                </div>
                <input type="number" min="0" class="form-control" v-model.number="scoring.wrong" />
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4">
  <h5>Feedbacks</h5>
  <div class="form-group mb-3">
    <label>Positive feedback (100%)</label>
    <input
      type="text"
      class="form-control"
      v-model="positiveFeedback"
      placeholder="e.g. Bravo, c'est exact !"
    />
  </div>
  <div class="form-group mb-3">
    <label>Negative feedback (&lt;100%)</label>
    <input
      type="text"
      class="form-control"
      v-model="negativeFeedback"
      placeholder="e.g. Une ou plusieurs réponses sont incorrectes."
    />
  </div>
</div>

      </div>
      <dimension />
      <div class="card-footer">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" @save-element="saveElement" :isItemBank="isItemBank" />
      </div>
    </div>
    <div v-else class="alert alert-info">
      Select an element to edit
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import EditorActionBar from '../default/EditorActionBar.vue';
import { useTestStore } from '../../../stores/testStore';
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue';
import Quill from 'quill';
import dimension from '../default/dimension.vue';

const props = defineProps({
  element: Object,
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);
const elementLabel = ref('');
const quillEditor = ref(null);
let quillInstance = null;

const positiveFeedback = ref('')
const negativeFeedback = ref('')


const rows = ref([{ label: 'Choix #1' }, { label: 'Choix #2' }]);
const columns = ref([{ label: 'Option #1' }, { label: 'Option #2' }]);
const solutionMatrix = ref([
  [false, false],
  [false, false]
]);

const scoring = ref({
  right: 1,
  wrong: 0
});

function updateElementData() {
  if (!selectedElement.value) return;

  selectedElement.value.el_Data = {
    rows: rows.value.map(r => r.label),
    columns: columns.value.map(c => c.label),
    solutionMatrix: solutionMatrix.value,
    scoring: {
      right: scoring.value.right,
      wrong: scoring.value.wrong
    }
  };

  selectedElement.value.feedback = {
    correct: positiveFeedback.value,
    incorrect: negativeFeedback.value
  };

  if (!props.isItemBank) {
    store.updateElement({ ...selectedElement.value });
  }
}


watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || '';
}, { immediate: true });

watch(() => selectedElement.value?.el_Text, () => updateElementData());
watch(() => scoring.value.right, () => updateElementData());
watch(() => scoring.value.wrong, () => updateElementData());

// Watch rows/columns/solutionMatrix deeply
watch(rows, updateElementData, { deep: true });
watch(columns, updateElementData, { deep: true });
watch(solutionMatrix, updateElementData, { deep: true });

onMounted(async () => {
  await nextTick();
  if (quillEditor.value && selectedElement.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ['image', 'link'],
          ['clean']
        ]
      }
    });

    if (selectedElement.value.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    quillInstance.on('text-change', () => {
      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML;
        updateElementData();
      }
    });
  }
});

function addRow() {
  rows.value.push({ label: `Choix #${rows.value.length + 1}` });
  solutionMatrix.value.push(Array(columns.value.length).fill(false));
  updateElementData();
}

function removeRow(index) {
  rows.value.splice(index, 1);
  solutionMatrix.value.splice(index, 1);
  updateElementData();
}

function addColumn() {
  columns.value.push({ label: `Option #${columns.value.length + 1}` });
  solutionMatrix.value.forEach(row => row.push(false));
  updateElementData();
}

function removeColumn(index) {
  columns.value.splice(index, 1);
  solutionMatrix.value.forEach(row => row.splice(index, 1));
  updateElementData();
}
watch(positiveFeedback, updateElementData)
watch(negativeFeedback, updateElementData)
watch(selectedElement, (newElement) => {
  if (!newElement || !newElement.el_Data) return;

  const data = newElement.el_Data;

  rows.value = data.rows?.map(label => ({ label })) || [{ label: 'Choix #1' }];
  columns.value = data.columns?.map(label => ({ label })) || [{ label: 'Option #1' }];
  solutionMatrix.value = data.solutionMatrix || rows.value.map(() => columns.value.map(() => false));
  scoring.value = data.scoring || { right: 1, wrong: 0 };
  positiveFeedback.value = newElement.feedback?.correct || ''
negativeFeedback.value = newElement.feedback?.incorrect || ''

  // initialise le RichText
  if (quillInstance && newElement.el_RichText) {
    quillInstance.root.innerHTML = newElement.el_RichText;
  }
}, { immediate: true });
</script>


<style scoped>
.match-editor input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.btn-outline-secondary {
  border-color: gainsboro;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.inputMainPrompt {
  width: 100%;
  padding: 8px;
  font-size: 16px;
}

.quill-editor {
  min-height: 150px;
  border: 1px solid #ccc;
  padding: 10px;
}
</style>
