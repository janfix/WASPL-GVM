<template>
    <div class="creatorForm row">


        <div class="TestFormInfo col">
            <!-- Titre -->
            <div class="form-floating mb-3">
                <input type="text" class="form-control" id="floatingInput" v-model="testData.title">
                <label for="floatingInput">Test Title</label>
            </div>


            <!-- Langue -->
            <div class="form-floating mb-3">
                <select id="langue" class="form-select" v-model="testData.language">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="it">Italian</option>
                    <option value="es">Spanish</option>
                </select>
                <label for="langue">Language</label>
            </div>

            <!-- Navigation -->
            <div class="form-floating mb-3">
                <select id="Tnav" class="form-select" v-model="testData.navigation">
                    <option value="linear">Linear</option>
                    <option value="conditional">Conditional</option>
                    <option value="chosen">Chosen</option>
                </select>
                <label for="Tnav">Test Navigation</label>
            </div>

            <!-- Education Key Level -->
            <div class="form-floating mb-3">
                <select id="educationLevel" class="form-select" v-model="testData.level">
                    <option value="KS2">KS2</option>
                    <option value="KS3">KS3</option>
                    <option value="KS4">KS4</option>
                    <option value="A-Levels">A-Levels</option>
                    <option value="BTECs">BTECs</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                </select>
                <label for="educationLevel">Education Key Level</label>
            </div>           
            <!-- Test Progression -->
            <div class="form-floating mb-3">
                <select id="progression" class="form-select" v-model="testData.progression">
                    <option value="linear">Linear</option>
                    <option value="adaptive">Adaptive</option>
                    <option value="chosen">Chosen</option>
                </select>
                <label for="progression">Test Progression</label>
            </div>

            <!-- Time Limit -->
            <div class="form-floating mb-3">
                <input type="time" class="form-control" id="timeLimit" v-model="testData.timeLimit">
                <label for="timeLimit">Time Limit</label>
            </div>

            <!-- Boutons -->
            <div class="submitBar">
                <button @click="submitTest" class="createTest-btn" type="button">
                    Create
                </button>
                <button @click="cancel" class="cancelTest-btn" type="button">
                    Cancel
                </button>
            </div>
        </div>
        <div class="col">
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useTestStore } from "../stores/testStore";


const store = useTestStore();
const testData = store.getTestData();

</script>



<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    padding: 20px;
    display: flex;
    justify-content: center;
}

.bento-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    max-width: 1000px;
}

.bento-item {
    background-color: #ffffff;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.bento-item h2 {
    font-size: 16px;
    margin-bottom: 10px;
    color: #333;
}

.bento-item p {
    font-size: 14px;
    color: #666;
}
</style>
