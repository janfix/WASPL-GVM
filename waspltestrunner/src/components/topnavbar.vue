<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">WASPL</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false"
        aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link" href="#">
            🏛️ {{ publicationStore.publicationData?.institution}}</a>
          </li>
          <li class="nav-item">
            <a class="nav-link active testMode" aria-current="page" href="#">
              {{ publicationStore.publicationData?.mode }} {{ $t('mode') }}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="#top">
              {{ $t('Test') }}: {{ testData?.title }}
            </a>
          </li>
          <li v-if="publicationStore.publicationData?.testMap" class="nav-item">
            <a class="nav-link" href="#" @click.prevent="$emit('toggle-test-map')">{{ $t('Test Map') }}<i class="fa-solid fa-caret-down"></i></a>
          </li>
          <li hidden class="nav-item dropdown" @click="isInfosOpen = !isInfosOpen">
            <a class="nav-link dropdown-toggle" href="#">{{ $t('Infos') }}</a>
            <ul v-if="isInfosOpen" class="dropdown-menu show" style="font-size: 0.8em; display: block;">
              <li>Test_id:{{ testData?._id }}</li>
              <li>Modif: {{ testData?.metadata }}</li>
              <li>duration: {{ testData?.duration }}</li>
              <li>Mode: {{ publicationStore.publicationData?.mode }}</li>
              <li>Navigation: {{ testData?.navigation }}</li>
            </ul>
          </li>
          <li v-if="publicationStore.publicationData?.ctools" class="nav-item dropdown" @click="isToolsOpen = !isToolsOpen">
            <a class="nav-link dropdown-toggle" href="#">{{ $t('Tools') }}</a>
            <ul v-if="isToolsOpen" class="dropdown-menu show" style="display: block;">
              <li><a class="dropdown-item" href="#">{{ $t('Calculator') }}</a></li>
              <li><a class="dropdown-item disabled" href="#">GeoGebra</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item disabled" href="#">Dictionnary</a></li>
            </ul>
          </li>
          
        

        <a v-if="publicationStore.publicationData?.timeLimit" class="candidate" href="#">
          {{ $t('Remaining Time') }}: {{ formattedTime }}
          <div class="spinner">⏳</div>
        </a>

        <div class="dropdown text-end" @click="isUserOpen = !isUserOpen">
          <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle">
            <img src="../../src/assets/student.png" alt="mdo" width="42" height="42" class="rounded-circle">
            {{ studentName }}
          </a>
          <ul v-if="isUserOpen" class="dropdown-menu text-small show" style="display: block;">
            <li><a class="dropdown-item" href="#" @click="handleLogout">{{ $t('Sign out') }}</a></li>
            <li><a class="dropdown-item" href="#" @click="callSuperViser">{{ $t('Call Supervisor') }}</a></li>
            <li><a class="dropdown-item" href="#" @click="goToPublicationList">{{ $t('Tests List') }}</a></li>
            <li hidden><a class="dropdown-item" href="#" @click="resetTimerForDebug">{{ $t('Reset Timer') }}</a></li>
          </ul>
        </div>
</ul>
      </div>
    </div>
  </nav>

  <div aria-live="polite" aria-atomic="true" class="position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
    <div id="toast-superviser" class="toast align-items-center text-bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          {{ $t('The Supervior was called !') }}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { jwtDecode } from 'jwt-decode';
import { usePublicationStore } from '@/stores/usePublicationStore';
import { useRouter } from 'vue-router';
import * as bootstrap from 'bootstrap';

const publicationStore = usePublicationStore();
const router = useRouter();

const emit = defineEmits(['toggle-test-map', 'timeUp']);

const props = defineProps({
  testData: { type: Object, required: true, default: null },
  stopTimer: { type: Boolean, required: false, default: false },
  publicationData: { type: Object, required: false, default: () => ({}) },
  answers: Object
});

const studentName = ref("Student");
const isInfosOpen = ref(false);
const isToolsOpen = ref(false);
const isUserOpen = ref(false);

// Timer variables
const storageKey = ref("");
const remainingTime = ref(0);
const isTimeUp = ref(false);
let timerInterval = null;

// Parse duration from format "MM:SS" or number of seconds
const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  
  const parts = durationStr.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return parseInt(durationStr, 10) || 0;
};

// Format seconds to "MM:SS"
const formattedTime = computed(() => {
  const minutes = Math.floor(remainingTime.value / 60);
  const seconds = remainingTime.value % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
});

// Initialize the timer from localStorage or from test duration
const initializeTimer = () => {
  if (!props.testData || !props.testData._id || !props.testData.duration) {
    console.log("Timer initialization skipped: missing required data");
    return;
  }
  
  console.log("Initializing timer with duration:", props.testData.duration);
  storageKey.value = `remainingTime_${props.testData._id}`;
  
  const storedTime = localStorage.getItem(storageKey.value);
  const durationInSeconds = parseDuration(props.testData.duration);
  
  // If we have a stored time and it's valid, use it
  if (storedTime && !isNaN(parseInt(storedTime, 10)) && parseInt(storedTime, 10) > 0) {
    remainingTime.value = parseInt(storedTime, 10);
    console.log("Timer restored from storage:", remainingTime.value, "seconds");
  } else {
    // Otherwise use the duration from testData
    remainingTime.value = durationInSeconds;
    localStorage.setItem(storageKey.value, durationInSeconds.toString());
    console.log("Timer initialized with duration:", durationInSeconds, "seconds");
  }
  
  // Only start the timer if there's time remaining and timeLimit is enabled
  if (remainingTime.value > 0 && publicationStore.publicationData?.timeLimit) {
    startCountdown();
  }
};

// Start the countdown timer
const startCountdown = () => {
  if (!publicationStore.publicationData?.timeLimit) {
    console.log("Timer not started: timeLimit not enabled");
    return;
  }
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  console.log("Starting countdown with", remainingTime.value, "seconds");
  
  if (remainingTime.value > 0) {
    timerInterval = setInterval(() => {
      if (props.stopTimer) {
        return; // Don't update if stopTimer prop is true
      }
      
      if (remainingTime.value > 0) {
        remainingTime.value -= 1;
        localStorage.setItem(storageKey.value, remainingTime.value.toString());
      } else if (!isTimeUp.value) {
        timeUp();
      }
    }, 1000);
  } else if (!isTimeUp.value) {
    timeUp();
  }
};

// Handle when time is up
const timeUp = () => {
  isTimeUp.value = true;
  clearInterval(timerInterval);
  localStorage.removeItem(storageKey.value);
  
  
  // Émettre l'événement timeUp avant de rediriger
  emit('timeUp');
  alert("Your time is up! You will be redirected to the list of tests.");
  router.push('/publications');
};

// Fetch student name from JWT token
const fetchStudentName = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const decoded = jwtDecode(token);
    studentName.value = `${decoded.firstname} ${decoded.lastname}`;
  } catch (error) {
    console.error("Erreur lors du décodage du token :", error);
    studentName.value = "Student";
  }
};

// Reset timer (debug function)
const resetTimerForDebug = () => {
  if (storageKey.value) {
    localStorage.removeItem(storageKey.value);
    alert("Timer réinitialisé (Debug). Rechargez la page pour repartir du début.");
  }
};

// Logout handler
const handleLogout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

// Call supervisor
const callSuperViser = () => {
  const toastElement = document.getElementById("toast-superviser");
  if (toastElement) {
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 2000 });
    toast.show();
  }
};

// Navigation to publication list
const goToPublicationList = () => {
  router.push('/publications');
};

// Watch for stopTimer prop changes
watch(() => props.stopTimer, (newValue) => {
  if (newValue) {
    clearInterval(timerInterval);
  } else if (remainingTime.value > 0 && publicationStore.publicationData?.timeLimit) {
    startCountdown();
  }
});

// Watch for testData changes to initialize timer
watch(() => props.testData, (newData) => {
  if (newData && newData._id && newData.duration) {
    console.log("testData changed, reinitializing timer");
    initializeTimer();
  }
}, { deep: true });

// Component lifecycle hooks
onMounted(() => {
  console.log("onMounted called");
  fetchStudentName();
  // Small delay to ensure publicationStore data is loaded
  setTimeout(() => {
    initializeTimer();
  }, 100);
});

onUnmounted(() => {
  if (timerInterval) {
    console.log("Clearing timer interval on unmount");
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.candidate {
  color: rgb(6, 75, 101);
  font-weight: bold;
  margin-right: 20px;
  margin-top: 8px;
}
.testMode {
  font-weight: bold;
  color: darkred !important;
  font-variant: small-caps;
}

#navbarSupportedContent>ul>li.nav-item.dropdown>ul>li:nth-child(1)>a {
  margin: 0 0px;
}

.spinner {
  display: inline-block;
  font-size: 1rem;
  animation: rotatePause 14s linear infinite;
}

.dropdown{
  margin-left:50px;
}

@keyframes rotatePause {
  0% { transform: rotate(0deg); }
  35.7% { transform: rotate(180deg); }
  50% { transform: rotate(180deg); }
  85.7% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
}

.navbar-nav .dropdown{
background-color:#F8F9FA ; 
}

.nav a{
  margin-top:10px!important;
  margin-right :0px!important;
  margin-left :0px!important;
}



</style>