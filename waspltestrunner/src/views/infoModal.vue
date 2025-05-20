<template>
    <div class="modal fade" tabindex="-1" ref="infoModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Access expired</h5>
            <button type="button" class="btn-close" @click="hideModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>{{ dynamicMessage }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="hideModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, onMounted, defineExpose } from 'vue'

let bootstrapModal = null
const infoModal = ref(null)
const dynamicMessage = ref("Default info text"); // 🆕

// Expose la méthode show en passant un message
const show = (message = "Default info text") => {
  dynamicMessage.value = message;
  if (bootstrapModal) bootstrapModal.show();
}

const hideModal = () => {
  if (bootstrapModal) bootstrapModal.hide();
}

onMounted(() => {
  if (infoModal.value) {
    bootstrapModal = new bootstrap.Modal(infoModal.value, {
      backdrop: true,
      keyboard: true
    })
  }
})

defineExpose({ show }) // 👈 expose la fonction show
</script>

  