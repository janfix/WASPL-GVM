<template>
  <div class="modal-backdrop">
    <div class="modal-content-prep">
      <div class="modal-header">
        <h5 class="modal-title">{{ $t('Prepare for your test') }}</h5>
        <button type="button" class="btn-close" @click="$emit('cancel')"></button>
      </div>

      <div class="modal-body">
        <div class="modal-visual">
          <img :src="mode === 'exam' ? examImage : trainingImage" :alt="mode === 'exam' ? $t('exam mode') : $t('formative mode')" />
        </div>

        <p style="text-align: center;">
          {{ $t('Hello') }} {{ studentName }}, {{ $t('you are about to start your') }}
          <strong>{{ $t(mode === 'exam' ? 'exam mode' : 'formative mode') }}</strong> {{ $t('session') }}.
        </p>

        <p><strong>{{ $t('Please ensure') }}:</strong></p>
        <ul>
          <li>{{ $t('You have enough time to complete the test without interruption.') }}</li>
          <li>{{ $t('Your phone is on silent mode.') }}</li>
          <li>{{ $t('Your environment is calm and quiet.') }}</li>
          <li>{{ $t("You've read the instructions carefully.") }}</li>
        </ul>

        <InstructionList :publication="publication" :collapsible="false" />

        <p hidden class="text-muted mt-2">
          {{ $t('You can access the instructions again during the test using the top toolbar.') }}
        </p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">{{ $t('Back') }}</button>
        <button class="btn btn-success" @click="$emit('confirm')">
          {{ $t(mode === 'exam' ? 'Start Exam' : 'Start Training') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { jwtDecode } from 'jwt-decode'
import InstructionList from './instructionList.vue'
import examImage from '@/assets/exam-mode.png'
import trainingImage from '@/assets/learning-mode.png'

const props = defineProps({
  publication: { type: Object, required: true }
})

defineEmits(['confirm', 'cancel'])

const studentName = ref('Student')

const fetchStudentName = () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const decoded = jwtDecode(token)
    studentName.value = decoded.firstname || 'Student'
  } catch (error) {
    console.error('Erreur lors du décodage du token dans la modale:', error)
    studentName.value = 'Student'
  }
}

onMounted(() => {
  fetchStudentName()
})

const mode = props.publication.mode || 'exam'
</script>

<style scoped>
.modal-header {
  position: relative;
  padding: 0.5rem 1rem;
}

.modal-title {
  margin: 0 auto;
  font-size: 1.25rem;
  font-weight: bold;
  text-align: center;
}

.btn-close {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-content-prep {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-visual {
  text-align: center;
  margin-bottom: 1rem;
}

.modal-visual img {
  max-width: 400px;
}
</style>
