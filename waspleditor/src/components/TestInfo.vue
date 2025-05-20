<template>
  <div class="test-info row">


    <!-- Zone de titre : Affichage ou Édition -->
    <div class="col">

      <div v-if="!editTitleZone">
        <span @click="EditTitleArea(true)" v-if="!editTitleZone" class="editBTContainer">
          <font-awesome-icon :icon="['fa', 'edit']" />
        </span>

        <h2>{{ testInfo.title || "Please select a test in the Test list" }}</h2>
      </div>
      <div v-else>
        <span @click="EditTitleArea(false)" v-if="editTitleZone" class="ValidBTContainer">
          <i class="fa fa-check" aria-hidden="true"></i>
        </span>
        <h2>
          <input type="text" v-model="testInfo.title" class="edit-input" placeholder="Enter title"
            @blur="updateTestData({ title: testInfo.title })" />
        </h2>
      </div>

    </div>
    <div class="col" style="text-align: right;">
      <button @click="exportTest" type="button" class="btn btn-warning btn-sm">Export Test</button>

    </div>




    <!-- Zone de description : Affichage ou Édition -->
    <div>
      <p v-if="!editTitleZone">
        {{ testInfo.Description || "No description available" }}
      </p>
      <textarea v-else v-model="testInfo.Description" class="edit-textarea" placeholder="Enter description"
        @blur="updateTestData({ Description: testInfo.Description })"></textarea>
    </div>

    <div class="accordion" id="accordionParameters">
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingOne">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
            aria-expanded="true" aria-controls="collapseOne">
            <h4>Test informations</h4>
          </button>
        </h2>
        <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne"
          data-bs-parent="#accordionParameters">
          <div class="accordion-body">
            <div class="row">
              <div class="col">
                <div hidden class="form-floating mb-3">
                  <i class="fas fa-lock locker"></i>
                  <input readonly type="text" class="form-control locked" id="testVersion"
                    :value="testInfo.version || ''">
                  <label for="testVersion">Version</label>
                </div>
                
                <div class="form-floating mb-3">
                  <i class="fas fa-lock locker"></i>
                  <input readonly type="text" class="form-control locked" id="testCreated"
                    :value="testInfo.metadata?.Created || ''">
                  <label for="testCreated">Created</label>
                </div>

                <div class="form-floating mb-3">
                  <input type="text" class="form-control" id="testAuthor" v-model="testInfo.metadata.Author"
                    @change="updateTestData({ metadata: testInfo.metadata })">
                  <label for="testAuthor">Author</label>
                </div>

                <div hidden class="form-floating mb-3">
                  <select id="testLanguage" class="form-select" v-model="testInfo.language">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="it">Italian</option>
                    <option value="sp">Spanish</option>
                    <option value="po">Portuguese</option>
                  </select>
                  <label for="testLanguage">Language</label>
                </div>

                <div class="form-floating mb-3">
                  <i class="fas fa-lock locker"></i>
                  <input readonly type="text" class="form-control locked" id="testPages"
                    :value="testInfo.pages?.length || 0">
                  <label for="testPages">Pages </label>
                </div>
                <div class="form-floating mb-3">
                  <select id="Tpath" class="form-select" v-model="testInfo.progression"
                    @change="updateTestData({ progression: testInfo.progression })" title="Test Path"
                    aria-label="progression">
                    <option value="linear">Linear</option>
                    <option value="conditional">Conditional</option>
                    <option value="chosen">Chosen</option>
                    <option value="adaptive">Adaptive</option>
                  </select>
                  <label for="Tpath">Test Progression</label>
                </div>
              </div>
              <div class="col">
                <div class="mb-3">
                  <IscedSelector v-model="testInfo.ISCED" @change="updateTestData({ ISCED: testInfo.ISCED })" />
                </div>

                <div hidden class="form-floating mb-3">
                  <select class="form-select" id="stagesOfEducation" v-model="testInfo.level"
                    @change="updateTestData({ level: testInfo.level })" aria-label="Floating label select example">
                    <option value="KS2">KS2</option>
                    <option value="KS3">KS3</option>
                    <option value="KS4">KS4</option>
                    <option value="A-Levels">A-Levels</option>
                    <option value="BTECs">BTECs</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                  <label for="stagesOfEducation">Education Key level</label>
                </div>
                <div class="form-floating mb-3">
                  <select class="form-select" v-model="testInfo.Subject"
                    @change="updateTestData({ Subject: testInfo.Subject })" name="subject" id="subject"
                    aria-label="Floating label select example">
                    <optgroup label="Core Subjects">
                      <option value="english">English</option>
                      <option value="mathematics">Mathematics</option>
                      <option value="science">Science</option>
                    </optgroup>
                    <optgroup label="Humanities and Social Sciences">
                      <option value="history">History</option>
                      <option value="geography">Geography</option>
                      <option value="religious-education">Religious Education (RE)</option>
                      <option value="civics">Civics</option>
                    </optgroup>
                    <optgroup label="Languages">
                      <option value="french">French</option>
                      <option value="spanish">Spanish</option>
                      <option value="german">German</option>
                      <option value="italian">Italian</option>
                      <option value="latin">Latin</option>
                      <option value="mandarin-chinese">Mandarin Chinese</option>
                    </optgroup>
                    <optgroup label="Arts">
                      <option value="art-design">Art and Design</option>
                      <option value="music">Music</option>
                      <option value="drama">Drama</option>
                      <option value="dance">Dance</option>
                    </optgroup>
                    <optgroup label="Technology and Practical Subjects">
                      <option value="design-technology">Design and Technology (D&T)</option>
                      <option value="food-technology">Food Technology</option>
                      <option value="computer-science">Computer Science</option>
                    </optgroup>
                    <optgroup label="Physical Education and Health">
                      <option value="physical-education">Physical Education (PE)</option>
                      <option value="health-social-care">Health and Social Care</option>
                      <option value="pshe">Personal, Social, Health and Economic Education (PSHE)</option>
                    </optgroup>
                    <optgroup label="Optional or Specialized Subjects">
                      <option value="business-studies">Business Studies</option>
                      <option value="economics">Economics</option>
                      <option value="psychology">Psychology</option>
                      <option value="philosophy">Philosophy</option>
                      <option value="sociology">Sociology</option>
                      <option value="media-studies">Media Studies</option>
                      <option value="law">Law</option>
                    </optgroup>
                    <optgroup label="Vocational Subjects">
                      <option value="engineering">Engineering</option>
                    </optgroup>
                  </select>
                  <label for="floatingSelect">Subjects</label>
                </div>

                <div class="form-floating mb-3">
                  <input type="text" class="form-control" id="testDomain" v-model="testInfo.domain"
                    @change="updateTestData({ domain: testInfo.domain })">
                  <label for="testDomain">Domain</label>
                </div>

                <div class="form-floating mb-3">
                  <input type="text" class="form-control" id="testKeywords" v-model="testInfo.Keywords"
                    @change="updateTestData({ Keywords: testInfo.Keywords })">
                  <label for="testKeywords">Keywords</label>
                </div>
              </div>
              <div class="col">

                <div class="form-floating mb-3">
                  <input type="text" class="form-control" id="testDuration" v-model="testInfo.duration"
                    @change="updateTestData({ duration: testInfo.duration })">
                  <label for="testDuration">Duration</label>
                </div>
              </div>
              <div class="dimension">
                <DimensionManager v-model:dimensions="store.testData.dimensions" />
              </div>
              <div class="TestReport">
                <button disabled type="button" class="btn btn-info btn-sm">Statistical analysis</button>
                <p style="color:grey; font-size:small;  font-style: italic;">The statistical analysis takes all the data available on this test to account for its operation and
                  its qualities</p>

                <pre hidden>
                  Total students who took the test : {{ testInfo.submission?.length || 0 }} 
                  Last time the test was taken : {{ testInfo.submission?.length > 0 ? new Date(testInfo.submission[0].date).toLocaleString() : "No submission" }}
                  Overall success rate : 57%
                  Average score : 75%
                  Average time : 45 minutes
                  Most discriminating :
                    - titre de l'item 1
                    - titre de l'item 2 
                  Most failed items : 
                    - titre de l'item 1
                    - titre de l'item 2
                  Average time per item : 2 minutes
                  Average score per item : 3.5/5
                  Estimated test level (deduced from aggregate performance)
                  Recommendations: "Use for introduction"</pre>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useTestStore } from "../stores/testStore";
import IscedSelector from "./common/IscedSelector.vue";
import DimensionManager from "./DimensionManager.vue";

const DEFAULT_SETTINGS = {
  timeLimit: false,
  shuffleQuestions: true,
  shufflePages: true,
  NavigationPanel: false,
  progressBar: true,
  feedbackAllowed: true,
  directScore_FB: true,
  countDown: true,
  skip: true
};

const DEFAULT_TEST_INFO = {
  title: "",
  Description: "",
  version: "",
  language: "en",
  navigation: "Browing back is possible",
  progression: "Linear",
  metadata: {
    Created: "",
    Author: "",
  },
  pages: [],
  Keywords: [],
  settings: DEFAULT_SETTINGS
};

const store = useTestStore();
const testData = store.testData;

const testInfo = computed(() => {
  const storeData = store.testData || {};
  // Créer une copie profonde des données par défaut
  const mergedData = {
    ...DEFAULT_TEST_INFO,
    ...storeData,
    // Fusionner explicitement les objets imbriqués
    metadata: {
      ...DEFAULT_TEST_INFO.metadata,
      ...(storeData.metadata || {}),
      Author: storeData.metadata?.Author || DEFAULT_TEST_INFO.metadata.Author
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...(storeData.settings || {})
    }
  };
  return mergedData;
});


var editTitleZone = ref(false);
const EditTitleArea = (state) => {
  editTitleZone.value = state;
};

const updateTestData = (data) => {
  data = {
    ...data,
    metadata: {
      ...data.metadata,
      LastModif: new Date().toISOString() // Ajout sécurisé
    }
  }
  store.updateTestData(data); // Met à jour le store et déclenche la sauvegarde
};

let isUpdating = false;

watch(
  () => ({ ...testInfo.value }), // Clone pour éviter de modifier directement l'objet
  (newVal, oldVal) => {
    if (isUpdating) return;
    isUpdating = true;

    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      store.updateTestData({ ...newVal }); // Mise à jour du store
    }

    setTimeout(() => { isUpdating = false; }, 100); // Petit délai pour éviter les boucles rapides
  },
  { deep: true, immediate: true }
);


// Fonction pour exporter le test
const exportTest = () => {
  try {
    // On accède directement aux données via testInfo.value
    const test = {
      ID: testInfo.value.ID,
      title: testInfo.value.title,
      type: testInfo.value.type,
      version: testInfo.value.version,
      language: testInfo.value.language,
      navigation: testInfo.value.navigation,
      progression: testInfo.value.progression,
      Description: testInfo.value.Description,
      submission: testInfo.value.submission,
      preset: testInfo.value.preset,
      Subject: testInfo.value.Subject,
      location: testInfo.value.location,
      level: testInfo.value.level,
      ISCED: testInfo.value.ISCED,
      domain: testInfo.value.domain,
      duration: testInfo.value.duration,
      Keywords: testInfo.value.Keywords,
      metadata: testInfo.value.metadata,
      pages: testInfo.value.pages || [], // Ajout d'une valeur par défaut
      elements: testInfo.value.elements || [], // Ajout d'une valeur par défaut
      settings: testInfo.value.settings
    };

    // Générer le JSON avec une indentation de 2 espaces
    const jsonContent = JSON.stringify(test, null, 2);

    // Créer un fichier téléchargeable
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // Créer un nom de fichier valide en remplaçant les espaces par des underscores
    // et en ajoutant un timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = test.title ? test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'test';
    link.download = `${safeName}_${timestamp}.json`;

    // Déclencher le téléchargement
    link.click();

    // Nettoyer l'URL temporaire
    URL.revokeObjectURL(link.href);

    console.log('Export réussi !');
  } catch (error) {
    console.error("Erreur lors de l'exportation :", error);
  }
};


</script>

<style scoped>
.edit-icon {
  font-size: 1.6em;
  cursor: pointer;
  color: #007bff;
  transition: color 0.3s;
}

.edit-icon:hover {
  color: #0056b3;
}

.editBTContainer {
  color: #007bff;
  cursor: pointer;
  float: left;
  font-size: 1em;
}

.ValidBTContainer {
  background-color: lightgreen;
  margin-top: 5px;
  border: 3px solid green;
  border-radius: 5px;
  padding-left: 3px;
  padding-right: 3px;
  margin-right: 12px;
  color: green;
  cursor: pointer;
  float: left;
  font-size: 0.5em;
}

.accordion-button {
  background-color: rgb(233, 243, 248);
}

.testEditorBTContainer {
  text-align: right;
}

.edit-textarea {
  width: 100%;
}

.locked {
  background-color: #f8f9fa;
}

.locker {
  color: lightgrey;
  position: absolute;
  width: 100%;
  text-align: right;
  margin-left: -10px;
  margin-top: 5px;
}

.TestReport {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  margin-top: 20px;
  border: 1px solid #ccc;
}
</style>