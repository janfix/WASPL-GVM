<template>
  <div class="app-wrapper">
    <div class="mainContainer">    
      <div class="row mt-4 mb-4">
        <div class="col-1">
          <img src="../../assets/TManager.png" alt="Tmanager" class="Tmanager" />
        </div>
       <div class="col-4 mt-1">
        <h1 style="margin-left:20px">Test Manager</h1>
       </div>
        <div class="col-7" style="margin-top: 15px; text-align: right;">
          <button title="Create a new Test" class="ActionTest-btn" @click="toggleTestForm">
            New Test
          </button>
          <FileUploader 
            title="Import a new file - Respect the WASPL JSON format!" 
            @import-test="importTestToTable"
            @close="closeImportForm" />
        </div>
      </div>
      
      <!-- Section modifiée avec la logique de mode d'édition vs création -->
      <div class="row">
        <div id="EditorAnchor" style="height: 1px;"></div>
        <div v-if="showTestForm" >
          <!-- Conditionnellement afficher le formulaire de création ou d'édition -->
          <TestCreatorForm v-if="!isEditMode" @close="handleCloseTestCreator" @add-test="handleAddTest" />
          
        </div>
      </div>
      
      <div class="row allContainer">
        <div class="d-flex">
          <TestList @edit-test="editTest" ref="testList" />
        </div>
      </div>
      
      <div class="row allContainer" id="EditorMain" ref="editorMain">
        <TestInfo v-if="checkTest()" />
        <div class="noTestMessage" v-else><i>Please select a test in the list to edit it.</i></div>
      </div>

      <div class="row">
        <TabSystem v-if="checkTest()" :test-id="currentTestID" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref,computed,watch,nextTick  } from 'vue';
import { useTestStore } from '../../stores/testStore';
import FileUploader from '../../components/FileUploader.vue'

import TestList from '../../components/TestList.vue';
import TestInfo from '../../components/TestInfo.vue';
import TestCreatorForm from '../../components/TestCreatorForm.vue';
import TabSystem from '../../components/TestTabSystem.vue';   


// State variables
const showTestForm = ref(false);
const showImportTest = ref(false);
const testList = ref(null);
const currentPreviewElement = ref(null); // L'élément affiché dans PreviewSection
const currentEditorElement = ref(null); // L'élément affiché dans ElementEditor
 // Afficher les outils de test

// Store
const store = useTestStore(); // Utilisation du store Pinia
const editorMain = ref(null);

// Ajouter des données JSON au tableau
const importTestToTable = (importedData) => {
  console.log("IMPORT TEST TO TABLE ")
  if (testList.value) {
    if (Array.isArray(importedData)) {
      importedData.forEach((test) => testList.value.addTest(test));
    } else {
      testList.value.addTest(importedData);
    }
  }
};

const isEditMode = ref(false);
// Methods to toggle components
const toggleTestForm = () => {
   isEditMode.value = false; // Mode création
  showTestForm.value = true;
  showImportTest.value = false;
   
};

const checkTest = () => {
  return !!store.testData?.ID; 
};

/* const toggleImportTest = () => {
  showImportTest.value = true;
  showTestForm.value = false;
};

const closeForm = () => {
  showTestForm.value = false;
}; */

const closeImportForm = () => {
  showImportTest.value = false;
};

const currentTestID = computed(() => store.testData?.ID || null);

const scrollToEditor = () => {
  // Utiliser setTimeout pour s'assurer que le DOM est complètement mis à jour
  setTimeout(() => {
    const editorElement = document.getElementById("EditorMain");
    if (editorElement) {
      // Calculer la position exacte
      const headerOffset = 20; // Ajustez si nécessaire (marge au-dessus)
      const elementPosition = editorElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      // Forcer le scroll
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      console.log("Scroll forcé à position:", offsetPosition);
    } else {
      console.error("Élément EditorMain introuvable dans le DOM");
    }
  }, 100); // Petit délai pour s'assurer que le DOM est mis à jour
};


// Handle editing a test
const editTest = (testData) => {
  store.setCurrentTest(testData);
  clearPreviewAndEditor();
  showImportTest.value = false;
  isEditMode.value = true; // Mode édition
  showTestForm.value = true;
  
  nextTick(() => {
    scrollToEditor();
  });
};

const handleCloseTestCreator = () => {
  // Désactive le mode création
  showTestForm.value = false;
  //newTestData = {}; // Réinitialise les données du nouveau test
};

// Fonction pour ajouter un test dans TestList
const handleAddTest = (newTest) => {
  console.log("Test ajouté :", newTest);

  // Vérifiez si testList est défini et appelez addTest
  if (testList.value?.addTest) {
    testList.value.addTest(newTest);
  } else {
    console.error("testList n'est pas défini ou addTest n'est pas disponible.");
  }
};

const clearPreviewAndEditor = () => {
  currentPreviewElement.value = null;
  currentEditorElement.value = null;
  console.log("Preview et éditeur réinitialisés");
};


const handleUpdateTest = (updatedTest) => {
  console.log("Test mis à jour :", updatedTest);
  
  // Mettre à jour dans le store et la table
  store.updateCurrentTest(updatedTest);
  
  // Mettre à jour dans la liste
  if (testList.value?.updateTest) {
    testList.value.updateTest(updatedTest);
  } else {
    console.error("testList n'est pas défini ou updateTest n'est pas disponible.");
  }
  
  // Fermer le formulaire d'édition
  showTestForm.value = false;
};
</script>



<style>
/* Override some Bootstrap styles */

.EditorContainer {
  margin-top: 10px;
}

.form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(66, 184, 131, 0.25);
  border-color: #42b883;
}

.btn-primary {
  background-color: #42b883;
  border-color: #42b883;
}

.btn-primary:hover {
  background-color: #3aa876;
  border-color: #3aa876;
}

/* Custom styles */
.app-wrapper {
    background-color: #f8f9fa;
    border-left:1px solid #e9ecef;
}

main {
  background-color: white;
}

.ActionTest-btn {
  background-color: #426c9c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer !important;
  width: 100px !important;
}

.ActionTest-btn:hover {
  background-color: #2e4c6d;
}

.allContainer {
  margin-top: 5px!important;
  ;
  border: 1px gainsboro solid;
  border-radius: 5px;
  padding: 10px;

}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.Importer {
  padding-top: 4px;
  height: 38px;
  text-align: left;
  border: 3px solid #2e4c6d;
  border-radius: 5px;

}

.previewContainer {
  margin-bottom: 10px;
}

.inputMainPrompt {
  border: gainsboro 1px solid;
  border-radius: 5px;
  width: 100%;
  padding: 10px;
}

.ml-2 {
  margin-left: 10px;
  ;
}

span.gap {
  background-color: yellow;
}

.gap-input{
  margin: 5px!important;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
}

.PositiveFeebackContainer {
  background-color: rgb(222, 246, 224);
  margin: 10px;
  padding: 10px;
  border: 1px green dotted;
  border-radius: 5px;
}

.NegativeFeebackContainer {
  background-color: rgb(246, 234, 235);
  margin: 10px;
  padding: 10px;
  border: 1px rgb(253, 97, 206) dotted;
  border-radius: 5px;
}

.btn-console {
  margin-left: 10px;
  color: white;
  background-color: #363F43;
}

.btn-console:hover {
  color: white;
  background-color: rgb(143, 74, 74)!important;
}

.ExportBT{
  
  margin-left: 3px;
  height : 35px;
  width: 200px;
}

.noTestMessage{
  padding : 30px;
 margin:0px 0px 0px  0px;
  background-color: #d5f5f6;
  border-radius: 5px;
}

.mainContainer{
  padding-left: 20px;
  padding-right: 20px;
}

h1{
  font-size: 2em;
}

.Tmanager{
  margin-left: 00px;
  margin-top: -10px;
  width: 100px!important;
  
}
</style>