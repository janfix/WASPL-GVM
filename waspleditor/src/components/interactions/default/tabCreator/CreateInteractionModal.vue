<template>
  <div class="modal-overlay">
    <div class="modal-content p-4 rounded shadow bg-white">
      <h4>Create a New Interaction</h4>
      This tool will create the necessary basic files on the editor side And on the Test Runner side.
      <hr>
      <form @submit.prevent="submit">
        <div class="mb-2">
          <label>Interaction Name (camelCase)</label>
          <input v-model="interactionName" class="form-control" required />
        </div>
        <div class="mb-2">
          <label>Author</label>
          <input v-model="authorName" class="form-control" disabled />
        </div>
        <div class="mb-2">
          <label>Description (max 200 characters)</label>
          <textarea v-model="description" class="form-control" maxlength="200" rows="3" />
        </div>
        <div class="mb-2">
          <label>Upload Icon (60x60px)</label>
          <input type="file" @change="handleFileUpload" accept="image/*" class="form-control" />
        </div>
        <div class="mt-3 d-flex justify-content-between">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">Create</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from "@/services/axios";
import { useUserStore } from '@/stores/userStore';

const emit = defineEmits(['close', 'created']);

const interactionName = ref('');
const description = ref('');
const authorName = ref('');
const imageFile = ref(null);
const createdAt = Date.now();

const userStore = useUserStore(); // récupération du user loggé

onMounted(() => {
  authorName.value = userStore.user?.username || 'unknown';
});

const handleFileUpload = (event) => {
  imageFile.value = event.target.files[0];
};

const submit = async () => {
  if (!interactionName.value.match(/^[a-z][a-zA-Z0-9]*$/)) {
    alert('Interaction name must be en camelCase.');
    return;
  }

  if (!imageFile.value) {
    alert('Please select an image file (60x60).');
    return;
  }

  try {
    const apiBase = import.meta.env.VITE_TESTRUNNER_API;
    const systemToken = import.meta.env.VITE_SYSTEM_TOKEN_FOR_TESTRUNNER;

    const res = await fetch(`${apiBase}/api/addNewInteraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemToken}`
      },
      body: JSON.stringify({
        newName: interactionName.value,
      }),
    });

    let result = {};
    try {
      result = await res.json(); // essaie de parser, même si erreur
    } catch (e) {
      console.warn("⚠️ Impossible de parser la réponse JSON :", e.message);
    }

    if (!res.ok) {
      throw new Error(result?.error || 'Erreur inconnue côté serveur.');
    }

    console.log('✅ Interaction créée dans TestRunner :', result.message);

    emit('created', {
      interactionName: interactionName.value,
      description: description.value,
      authorName: authorName.value,
      createdAt,
      imageFile: imageFile.value,
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'interaction :', error.message);
    alert('Erreur API : ' + error.message);
  }
};



</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  max-width: 500px;
  width: 100%;
}
</style>