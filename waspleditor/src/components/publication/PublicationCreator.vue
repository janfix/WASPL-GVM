<template>
  <div>
    <div class="row">
      <div v-if="groups.length === 0 && !loading" class="alert alert-warning">
        No groups found. Please check your configuration or add groups.
      </div>
      <div class="col">
        <div class="form-floating mb-3">
          <input type="text" class="form-control" id="publicationName" placeholder="Publication Name"
            v-model="publicationName" />
          <label for="publicationName" style="margin-left:10px">Publication Name</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating mb-3">
          <input type="text" class="form-control" id="publicationInstitution" placeholder="Institution"
            v-model="Pub_institution" />
          <label for="publicationInstitution" style="margin-left:10px">Institution</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <select class="form-select" v-model="selectedTest" id="TestSelect">
            <option value="" disabled>Select a test in the list</option>
            <option v-for="test in tests" :key="test._id" :value="test._id">
              {{ test.title }}
            </option>
          </select>
          <label for="TestSelect">Select a test</label>
        </div>
      </div>
    </div>

    <div class="row">
      
      <div class="col">
        <div class="form-floating">
          <select class="form-select" v-model="selectedGroup" id="GroupSelect">
            <option value="" disabled>Open this select menu</option>
            <option v-for="group in groups" :key="group._id" :value="group._id">
              {{ group.groupName }}
            </option>
          </select>
          <label for="GroupSelect">Select a Group</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <textarea class="form-control" placeholder="Add some important details" id="PubDescription"
            v-model="description"></textarea>
          <label style="margin-left:10px" for="PubDescription">Description</label>
        </div>
      </div>

    </div>


    
    <div class="row mt-3">
      <div class="col">
        <div class="form-floating mb-3">
          <input type="date" class="form-control" id="startingDate" v-model="startingDate" />
          <label for="startingDate" class="form-label">Starting Date</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating mb-3">
          <input type="date" class="form-control" id="endDate" v-model="endDate" />
          <label for="endDate" class="form-label">End Date</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <select class="form-select" id="access" v-model="access">
            <option value="unique">Unique</option>
            <option value="multiple">Multiple</option>
          </select>
          <label for="access" class="form-label">Access</label>
        </div>
      </div>
     <!--  <div class="col">
        <div class="form-floating">
          <input
          type="number"
          :min="access === 'multiple' ? 2 : 1"
          class="form-control"
          id="AttemptLimit"
          v-model="attemptLimit"
          :disabled="access !== 'multiple'"
        >
        <label for="AttemptLimit">Attempts limit (only for multiple access)</label>
        </div>
      </div> -->
    </div>

    <div class="row mb-4">
      <div class="col">
        <div class="form-floating">
          <select id="mode" class="form-select" v-model="mode" title="Test Mode">
            <option value="exam">Exam</option>
            <option value="learning">Formative mode</option>
            <option disabled value="live">Live</option>
            <option disabled value="custom">Custom</option>
          </select>
          <label for="mode">Test Mode</label>
        </div>
      </div>
      <div class="col">
        <div class="form-floating">
          <select id="Tnav" class="form-select" v-model="browsing" title="Browsing">
            <option value="backPossible">Browsing back is possible</option>
            <option value="noBack">Browsing back is not allowed</option>
          </select>
          <label for="Tnav">Browsing</label>
        </div>
      </div>
     <!--  <div class="col">
        <div class="form-floating">
          <select id="TSub" class="form-select" v-model="submission" title="Submission Mode">
            <option value="eachQuestion">Each question</option>
            <option value="eachPage">Each page</option>
            <option value="endTest">End of test</option>
          </select>
          <label for="TSub">Answers submission mode</label>
        </div>
      </div> -->

    </div>
    <div class="row mb-4">
      <div class="col ml-2">
        <div class="form-check form-switch">
          <input disabled class="form-check-input" type="checkbox" id="settingShuffleQuestions"
            v-model="shuffleQuestions">
          <label class="form-check-label" for="settingShuffleQuestions">Shuffle Questions in page</label>
        </div>
        <div class="form-check form-switch">
          <input disabled class="form-check-input" type="checkbox" id="settingShufflePages"
            v-model="shufflePages">
          <label class="form-check-label" for="settingShufflePages">Shuffle pages</label>
        </div>
        
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="settingTimeLimit" 
            v-model="timeLimit">
          <label class="form-check-label" for="settingTimeLimit">Time limit</label>
        </div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="settingSkip" 
            v-model="skip">
          <label class="form-check-label" for="settingSkip">Skip is allowed</label>
        </div>
        
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="testMap" 
            v-model="testMap">
          <label class="form-check-label" for="testMap">Test Map</label>
        </div>
        <div class="form-check form-switch">
          <input disabled class="form-check-input" type="checkbox" id="complementarytools" 
              v-model="ctools">
          <label class="form-check-label" for="complementarytools">Complementary tools</label>
        </div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="ReadOnlyAnsw" 
              v-model="readOnlyAnswer">
          <label class="form-check-label" for="ReadOnlyAnsw">Read-only once answered</label>
        </div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="revealQuestionNB" 
              v-model="revealQuestionNB">
          <label class="form-check-label" for="revealQuestionNB">Reveal Question number</label>
        </div>
      </div>
      <div class="col">
        <div class="mb-2"><b>Last page elements</b></div>
        <div class="form-floating mb-2">
          <textarea class="form-control" placeholder="Thank you for your participation" id="PubLeaveMessage"
            v-model="leaveMessage"></textarea>
          <label style="margin-left:10px" for="PubLeaveMessage">Leave Message</label>
        </div>
        <div class="notice">
          The open-ended question are excluded of the score calculation in that version.
        </div>
        <div class="form-check form-switch mb-2">
          <input class="form-check-input" type="checkbox" id="settingDirectScore"
            v-model="directScore_FB">
          <label class="form-check-label" for="settingDirectScore">Final score report</label>
        </div>
        <div class="form-check form-switch mb-2">
          <input disabled class="form-check-input" type="checkbox" id="AICorrection" 
            v-model="AICorr">
          <label class="form-check-label" for="AICorrection">AI Correction</label>
        </div>
      </div>
    </div>

    <div hidden class="row mb-4 mt-4">
      <div class="col-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="StudentReport" v-model="studentReport">
          <label class="form-check-label" for="StudentReport">Student Report</label>
        </div>
      </div>
      <div class="col-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="GroupReport" v-model="groupReport">
          <label class="form-check-label" for="GroupReport">Group Report</label>
        </div>
      </div>
      <div class="col-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="StatisticReport" v-model="statisticReport">
          <label class="form-check-label" for="StatisticReport">Statistic Report</label>
        </div>
      </div>
    </div>

    <button class="btn btn-primary mb-4" @click="submitForm">Add a new Publication</button>
  </div>
</template>

<script setup>
import { useEventBus } from '@vueuse/core'
import { ref, onMounted, watch } from 'vue'
import api from "@/services/axios";

// Créez un bus d'événements
const eventBus = useEventBus('publication-updated')


// Refs
const loading = ref(true)
const tests = ref([])
const groups = ref([])
const selectedTest = ref('')
const selectedGroup = ref('')
const publicationName = ref('')
const Pub_institution = ref('')
const startingDate = ref('')
const endDate = ref('')
const attemptLimit = ref(1)
const access = ref('unique')
const description = ref('')
const leaveMessage = ref('')
const mode = ref('')
const submission = ref('')
const browsing = ref('')
const shuffleQuestions = ref(false)
const shufflePages = ref(false)
const directScore_FB= ref(false)
const timeLimit = ref(false)
const skip = ref(false)
const AICorr = ref(false)
const testMap = ref(true)
const ctools = ref(false)
const readOnlyAnswer = ref(false)
const revealQuestionNB = ref(false)
const studentReport = ref(false)
const groupReport = ref(false)
const statisticReport = ref(true)

const fetchData = async () => {
  try {
    const [testRes, groupRes] = await Promise.all([
      api.get(`/tests/getTests`),
      api.get(`/groups`)
    ])
    
    tests.value = testRes.data.tests
    groups.value = groupRes.data.groups
  } catch (error) {
    console.error('Failed to fetch tests or groups', error)
  } finally {
    loading.value = false
  }
}

// Modifiez la fonction submitForm
const submitForm = async () => {
  const publicationData = {
  publicationName: publicationName.value,
  institution: Pub_institution.value,
  testId: selectedTest.value,
  groupId: selectedGroup.value,
  startingDate: startingDate.value,
  endDate: endDate.value,
  access: access.value,
  attemptLimit: attemptLimit.value,
  description: description.value,
  leaveMessage: leaveMessage.value,
  mode: mode.value,
  submission: submission.value,
  browsing: browsing.value,
  shuffleQuestions: shuffleQuestions.value,
  shufflePages: shufflePages.value,
  directScore_FB: directScore_FB.value,
  timeLimit: timeLimit.value,
  skip: skip.value, 
  AICorr: AICorr.value,
  testMap: testMap.value,
  ctools: ctools.value,
  readOnlyAnswer: readOnlyAnswer.value,
  revealQuestionNB: revealQuestionNB.value,
  attempts: 0,
  reports: {
    studentReport: studentReport.value,
    groupReport: groupReport.value,
    statisticReport: statisticReport.value,
  },
};

  try {
    console.log("publicationData envoyé :", publicationData);
    const response = await api.post(`/publications`, publicationData)
    alert('Publication added successfully')

    // Émettez l'événement après création réussie
    eventBus.emit('refresh-publications')

    // Réinitialisez le formulaire si besoin
    publicationName.value = ''
    Pub_institution.value = ''
    selectedTest.value = ''
    selectedGroup.value = ''
    // ... autres réinitialisations
  } catch (error) {
    console.error('Failed to add publication', error.response?.data || error.message)
  }
}

watch(access, (newVal) => {
  if (newVal === 'unique') {
    attemptLimit.value = 1
  }
})

onMounted(fetchData)
</script>

<style scoped>
.notice{
  font-style: italic;
  color: gray;  
  font-size: small;
}
</style>