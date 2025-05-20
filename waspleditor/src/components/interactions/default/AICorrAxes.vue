<template>
    <div class="AIConfig">
        <button @click="addCorrectionAxis" type="button" class="btn btn-secondary btn-sm mb-4 ml-2">
            <font-awesome-icon :icon="['fas', 'plus-circle']" /> Add a new correction axis
        </button>

        <!-- Liste des axes de correction -->
        <div v-for="(axis, index) in localCorrectionAxes" :key="index" class="input-group mb-3">
            <span class="input-group-text">Axis</span>
            <textarea title="Create a closed question" class="form-control axis" placeholder="Your correction axis"
                aria-label="correctionAxis" v-model="localCorrectionAxes[index].axis" @input="emitUpdate" />
            <span class="input-group-text">If true</span>
            <input type="number" class="form-control points" placeholder="points" aria-label="points"
                v-model.number="localCorrectionAxes[index].point" @input="emitUpdate" />
            <span class="input-group-text">If false</span>
            <input type="number" class="form-control points" placeholder="points" aria-label="points"
                v-model.number="localCorrectionAxes[index].penalty" @input="emitUpdate" />
            <button @click="removeCorrectionAxis(index)" title="remove" type="button" class="btn btn-danger btn-sm">
                <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
        </div>

        <AIExplain />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import AIExplain from './AIExplain.vue';

const emit = defineEmits(['update:correctionAxes']);


// Prop pour recevoir les données initiales
const props = defineProps({
    correctionAxes: {
        type: Array,
        required: true,
    },
});

// État local pour les axes de correction
const localCorrectionAxes = ref([...props.correctionAxes]);
console.log(localCorrectionAxes.value)

// Mettre à jour l'état local lorsque les props changent
watch(() => props.correctionAxes, (newAxes) => {
    localCorrectionAxes.value = [...newAxes];
}, { immediate: true });

// Émettre un événement pour mettre à jour les données
const emitUpdate = () => {
    emit('update:correctionAxes', localCorrectionAxes.value);
};

// Ajouter un nouvel axe de correction
const addCorrectionAxis = () => {
    localCorrectionAxes.value.push({
        axis: '',
        point: null,
        penalty: null,
    });
    emitUpdate();
};

// Supprimer un axe de correction
const removeCorrectionAxis = (index) => {
    localCorrectionAxes.value.splice(index, 1);
    emitUpdate();
};
</script>

<style scoped>
.basicInput {
    border: 1px gainsboro solid;
    border-radius: 5px;
    padding: 5px;
    height: auto;
    min-height: 100px;
}

.points {
    width: 20px !important;
}

.axis {
    min-width: 500px !important;
}
</style>
