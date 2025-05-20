<template>
  <div class="TexGaps-editor">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form @submit.prevent="saveElement">
          <!-- Hidden fields -->
          <div hidden class="mb-3">
            <label class="form-label">Element Label</label>
            <input type="text" class="form-control" v-model="elementLabel" @input="handleLabelChange" />
          </div>
          <div hidden class="mb-3">
            <label class="form-label">Element ID</label>
            <input type="text" class="form-control" v-model="selectedElement.el_ID" readonly />
          </div>
          <div hidden class="mb-3" v-show="selectedElement.isNewElement">
            <label class="form-label">Type</label>
            <input type="text" class="form-control" v-model="selectedElement.el_Type" />
          </div>

          <!-- Main prompt -->
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text" />
            </h3>
          </div>

          <!-- Quill editor -->
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>

          <!-- GAP editor -->
          <p>
            <i>
              In the editor below, write or paste the text, then select a word or more and click on the GAP button to
              prepare the gaps. To cancel, reselect and click GAP or use "cancel format (Tx)". Please encode the gaps in the reading strict order and check in the render if the answer correspond to the correction !
            </i>
          </p>
          <div class="GAPquill-container mt-3" style="margin-bottom: 5px;">
            <div ref="GAPquillEditor"></div>
          </div>
          <!-- List of Gaps -->
          <table class="table">
            <thead>
              <tr>
                <th>Gap Label</th>
                <th>Score - Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(gap, index) in gaps" :key="index">
                <td>{{ gap.label }}</td>
                <td>
                  <input type="number" v-model.number="gap.weight" @input="updateGapScore(index, gap.weight)"
                    class="form-control" />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
      <dimension />
      <!-- Footer -->
      <div class="card-footer">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" @save-element="saveElement"
          :isItemBank />
      </div>
    </div>
    <div v-else class="alert alert-info">Select an element to edit</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Quill from 'quill';
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore';
import EditorActionBar from '../default/EditorActionBar.vue';
import dimension from '../default/dimension.vue';

// Définir les props Pour l'adaptation de l'action bar footer au contexte : TEST or ITEM BANK
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const store = useTestStore();

const saveTest = () => {
  store.saveTestData();
};

// References
const quillEditor = ref(null);
const GAPquillEditor = ref(null);
let quillInstance = null;
let GAPquillInstance = null;

// Local state
const selectedElement = computed(() => store.selectedElement);
const elementLabel = ref('');
const gaps = ref([]); // Local array to store gaps

// Define GapBlot
const Inline = Quill.import('blots/inline');

class GapBlot extends Inline {
  static blotName = 'gap';
  static tagName = 'span';
  static className = 'gap';

  static create(value) {
    const node = super.create();
    node.classList.add('gap');
    if (value) {
      node.setAttribute('data-gap', value);
    }
    return node;
  }

  static formats(node) {
    return node.getAttribute('data-gap') || true;
  }
}

Quill.register('formats/gap', GapBlot);

// Load gaps from store when the component is mounted
watch(
  () => selectedElement.value?.gaps,
  (newGaps) => {
    gaps.value = newGaps || [];
  },
  { immediate: true }
);

watch(
  () => ({
    selectedElement: selectedElement.value, // Pour surveiller tout changement dans selectedElement
    selectedElementLabel: store.selectedElementLabel, // Pour surveiller les changements de label
  }),
  ({ selectedElement, selectedElementLabel }) => {
    // Gérer les changements dans selectedElement
    if (selectedElement) {
      if (quillInstance && selectedElement.el_RichText) {
        quillInstance.root.innerHTML = selectedElement.el_RichText;
      }
    }

    // Gérer les changements dans selectedElementLabel
    elementLabel.value = selectedElementLabel || '';
  },
  { immediate: true }
);

// Add a gap to the gaps array
const addGapToStore = (label) => {

  if (gaps.value.find((gap) => gap.label === label)) {
    console.error('Gap already exists:', label);
    return;
  }
  gaps.value.push({ label, weight: 1 });
  selectedElement.value.gaps = [...gaps.value]; // Update the store
  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  store.updateElement({ ...selectedElement.value });
};

// Update gap score in the store
const updateGapScore = (index, weight) => {
  gaps.value[index].weight = weight;

  // Cloner proprement gaps
  const newGaps = gaps.value.map(gap => ({ ...gap }));

  selectedElement.value.gaps = newGaps;
  selectedElement.value.maxScore = newGaps.reduce((acc, gap) => acc + (Number(gap.weight) || 0), 0);

  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }

  store.updateElement({ ...selectedElement.value });
};


if (!Quill.imports['formats/gap']) {
  console.error('GapBlot is not registered!');
} else {
  console.log('GapBlot successfully registered!');
}

// Convert yellow background to class="gap"
const convertToGap = (html) =>
  html.replace(/style="[^"]*background-color:\s*yellow[^"]*"/gi, 'class="gap"');


// Watchers
watch(
  () => store.selectedElementLabel,
  (newLabel) => {
    elementLabel.value = newLabel || '';
  },
  { immediate: true }
);

// Handlers
const handleLabelChange = (newLabel) => {
  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  selectedElement.value.label = newLabel;
  store.updateElementLabel(newLabel);
};

const saveElement = () => {

  selectedElement.value = selectedElement.value;
  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  if (selectedElement.value) {
    store.updateElement(selectedElement.value);
  }
};

// Initialize Quill instances
onMounted(() => {
  // Main Quill instance
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [['bold', 'italic', 'underline', 'strike'], [{ header: 1 }, { header: 2 }], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
      },
    });

    // Load content into the main Quill editor
    if (selectedElement.value?.el_RichText) {
      quillInstance.clipboard.dangerouslyPasteHTML(selectedElement.value.el_RichText);
    }

    quillInstance.on('text-change', () => {
      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML;
        if (props.isItemBank) {
          console.log("isItemBank is true. Skipping store.updateElement.");
          return;
        }
        store.updateElement({ ...selectedElement.value });
      }
    });
  }

  // GAP Quill instance
  if (GAPquillEditor.value) {
    const icons = Quill.import('ui/icons');
    const GapsIcon = `<svg width="16" height="16" viewBox="0 0 4.2333333 4.2333333" version="1.1" id="svg1" xmlns="http://www.w3.org/2000/svg"><rect style="fill:#ffffff;stroke:#6572d8;stroke-width:0.265;" width="3.994267" height="3.9942667" x="0.13852954" y="0.13852951" /><text style="font-size:1.83424px;fill:#6565ff;" x="0.16339113" y="2.7934139">GAP</text></svg>`;
    icons['insertGap'] = GapsIcon;

    GAPquillInstance = new Quill(GAPquillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            ['bold', 'italic', 'underline'],
            [{ header: [1, 2, 3, false] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean'],
            ['insertGap'],
          ],
          handlers: {
            insertGap() {
              const range = GAPquillInstance.getSelection();
              if (range && range.length > 0) {
                const selectedText = GAPquillInstance.getText(range.index, range.length).trim();
                const format = GAPquillInstance.getFormat(range.index, range.length);
                const isGap = format.gap;

                if (isGap) {
                  GAPquillInstance.formatText(range.index, range.length, 'gap', false); // Supprime le gap
                  //console.log('Removed GAP:', selectedText);
                  const index = gaps.value.findIndex((gap) => gap.label === selectedText);



                  if (index !== -1) {
                    gaps.value.splice(index, 1); // Remove from the gaps array
                    selectedElement.value.gaps = [...gaps.value]; // Update the store
                    if (props.isItemBank) {
                      console.log("isItemBank is true. Skipping store.updateElement.");
                      return;
                    }
                    store.updateElement({ ...selectedElement.value });
                  }
                } else {
                  GAPquillInstance.formatText(range.index, range.length, 'gap', true); // Applique le gap
                  //console.log('Added GAP:', selectedText);
                  addGapToStore(selectedText);
                }
              }
            },
          },
        },
      },
    });

    // Load content into the GAP editor
    //console.log('Content being imported:', selectedElement.value?.el_GapsedText);
    if (selectedElement.value?.el_GapsedText) {
      GAPquillInstance.clipboard.dangerouslyPasteHTML(selectedElement.value.el_GapsedText);
      // Inspecter le DOM après l'import
      const spans = GAPquillInstance.root.querySelectorAll('span.gap');
      if (spans.length === 0) {
        console.error('No spans with class "gap" found after import.');
      } else {
        // console.log('Spans with class "gap":', spans);
      }
    }

    GAPquillInstance.on('text-change', () => {

      //console.log('Content being imported:', selectedElement.value.el_GapsedText);
      if (selectedElement.value) {
        const rawHtml = GAPquillInstance.root.innerHTML;
        selectedElement.value.el_GapsedText = convertToGap(rawHtml);
        if (props.isItemBank) {
          console.log("isItemBank is true. Skipping store.updateElement.");
          return;
        }
        store.updateElement({ ...selectedElement.value });
      }
    });
  }
});
</script>

<style scoped>
.card-header {
  background-color: #426C9C;
  color: white;
}

.sendToItemLibBT {
  margin-left: 10px;
}

.ql-insertGap {
  background: none;
  border: none;
  cursor: pointer;
}

.GAPquill-container {
  background-color: #f9f9f9;
  padding: 10px;
  border: 1px solid #ddd;
}

.quill-editor {
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px;
}

td input {
  width: 100px;
}
</style>
