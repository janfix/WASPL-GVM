<template>
  <div class="creatorForm row">
    <h2>Create a new test</h2>
    <div class="TestFormInfo ">
      <input type="text" id="Identifier" hidden />
      <div class="row">
        <div class="col-6 ">
          <div class="form-floating mb-3">
            <input type="text" class="form-control" id="floatingInput" v-model="newTest.title">
            <label for="floatingInput">Test Title</label>
          </div>
          <input hidden class="textInput small form-control" type="text" v-model="newTest.version"
            placeholder="Version 1.0.0" title="Version" />
        </div>
        <div class="col-6">
            <IscedSelector v-model="newTest.ISCED" />
          </div>
        <div hidden class="col-3">
          <div class="form-floating">
            <select id="langue" class="form-select" v-model="newTest.language" title="Language">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="it">Italian</option>
              <option value="sp">Spanish</option>
              <option value="po">Portuguese</option>
            </select>
            <label for="langue">Language</label>
          </div>
          <div hidden class="form-floating">
            <select class="form-select" id="stagesOfEducation" v-model="newTest.educationStage"
              aria-label="Floating label select example">
              <option value="1">Primary</option>
              <option value="2">Secondary</option>
              <option value="3">Post-16 Education </option>
              <option value="4">Higher Education </option>
            </select>
            <label for="stagesOfEducation">Stages of Education</label>
          </div>
        </div>
        <!-- <div hidden class="col-3">
          <div class="form-floating">
            <select class="form-select" id="stagesOfEducation" v-model="newTest.level"
              aria-label="Floating label select example">
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
        </div> -->

      </div>
      <div class="row">
        <div class="col">
          <div class="form-floating">
            <select class="form-select" v-model="newTest.Subject" name="subjects" id="subjects"
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

        </div>
        <div class="col">
          <div class="form-floating mb-3">
            <input class="form-control" id="domain" type="text" v-model="newTest.domain" title="Domain" />
            <label for="domain">Domain /sub-domain</label>
          </div>

        </div>
      </div>
      <div class="row">
        <div class="col">
          <textarea class="descript form-control" v-model="newTest.Description" placeholder="Description"
            title="Description"></textarea>

          <div class="form-floating mb-3">

            <input id="keywords" class="textInput form-control" type="text" v-model="newTest.Keywords"
              title="Key Words" />
            <label for="keywords">Key words</label>
          </div>

        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <div class="form-floating">
            <select id="Tpath" class="form-select" v-model="newTest.progression" title="Test Path"
              aria-label="progression">
              <option value="linear">Linear</option>
              <option disabled value="conditional">Conditional</option>
              <option disabled value="chosen">Chosen</option>
              <option disabled value="adaptive">Adaptive</option>
            </select>
            <label for="Tpath">Test Progression</label>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <div class="form-floating mb-3">
            <input id="duration" class="textInput small form-control" type="time" v-model="newTest.duration"
              title="duration (mn)" />
            <label for="duration">Duration</label>
          </div>
        </div>
      </div>

      <div class="submitBar">
        <button @click="submitTest" class="createTest-btn" type="button">
          Create
        </button>
        <button @click="cancel" class="cancelTest-btn" type="button">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { reactive } from "vue";
import { v4 as uuidv4 } from 'uuid';
import { useTestStore } from '../stores/testStore'
import IscedSelector from "@/components/common/IscedSelector.vue";

// Déclaration des émetteurs
const emit = defineEmits(["close", "add-test"]);
const store = useTestStore()

// Méthode pour annuler la création
const cancel = () => {
  emit("close"); // Émet l'événement 'close' pour informer le parent
};

let newTest = {
  ID: uuidv4(),
  title: "",
  type: "WASPL",
  isNewElement: true,
  metadata: {
    Author: "JANFIX",
    Created: new Date().toISOString().split("T")[0],
    Description: "",
    Difficulty: "",
    Subject: "",
    Keywords: []
  },
  pages: [{
    "id": uuidv4(),
    "label": "Page 1",
    "children": [],
    "Randomized": true
  }],
  elements: [],
  settings: {
    timeLimit: "",
    shuffleQuestions: true,
    shuffleoptions: true,
    NavigationPanel: false,
    progressBar: false,
    feedbackAllowed: true,
    directScore: true,
    countDown: false
  }
};

// Méthode pour soumettre le test
const submitTest = () => {
  if (!newTest.title || !newTest.type) {
    console.error("Le test doit contenir un titre et un type.");
    return;
  }

  // Émet un événement pour informer le parent
  emit("add-test", { ...newTest });

  // Réinitialise le formulaire
  console.log(newTest)
  store.setTestData(newTest);
  // Ferme le formulaire
  emit("close");
};
</script>


<style scoped>
.createTest-btn {
  background-color: #40a777;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer;
}

.createTest-btn:hover {
  background-color: #157347;
}

.cancelTest-btn {
  background-color: rgb(144, 168, 96);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer;
}

.cancelTest-btn:hover {
  background-color: yellow;
  color: darkgray;
}

.textInput {
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid gainsboro;
}

.small {
  margin-right: 5px;
  width: 48%;
  display: inline;
}

select {
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid gainsboro;
}

.descript {
  margin-top: 2px;
  border-radius: 5px;
  border: 1px solid gainsboro;
  margin-bottom: 10px;
}

.creatorForm {
  border-radius: 5px;
  padding: 10px;
  border: 1px solid gainsboro;
}

.submitBar {
  margin-top: 20px;
}

.promptExample {
  margin: 5px;
}
</style>