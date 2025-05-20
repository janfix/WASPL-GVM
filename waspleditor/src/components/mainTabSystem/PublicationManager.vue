<template>

  <div class="Accordion-container">
    <div class="row mb-4">
      <div class="col-1"><img width="100px" src="../../assets/PublicationManager.png" alt="Publication manager"
          class="Pmanager" /></div>
      <div class="col pubTitle">
        <h1>Publication Manager</h1>
      </div>

    </div>
    <div class="row">
      <div class="col-6">
        <PublicationAgenda/>
      </div>
    </div>
    
    <br>
    <div class="accordion" id="PublicationCreator">

      <div hidden class="accordion-item">
        <h2 class="accordion-header" id="PublicationPresentation">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#PubPres"
            aria-expanded="true" aria-controls="PubPres">
            <h3> Discover the Publication Manager</h3>
          </button>
        </h2>
        <div id="PubPres" class="accordion-collapse collapse hide" aria-labelledby="PublicationPresentation"
          data-bs-parent="#accordionExample">
          <div class="accordion-body">

            <PublicationPresentation />

          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingOne">
          <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#PubCreator"
            aria-expanded="true" aria-controls="PubCreator">
            <h3>Create a Publication</h3>
          </button>
        </h2>
        <div id="PubCreator" class="accordion-collapse collapse " aria-labelledby="headingOne"
          data-bs-parent="#PublicationCreator">

          <div class="accordion-body">
            <publicationCreator />
          </div>
        </div>
      </div>
      <div class="mainContainer Publist">
        <h3>Publication List</h3>
        <div id="upcoming" class="" aria-labelledby="headingOne">
          <div class="">
            <div class="row mb-4">
              <PublicationTable @publication-selected="fetchPublicationDetails" />

            </div>
            <div class="row">
              <PublicationCard v-if="selectedPublication" :publication="selectedPublication" />
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import publicationCreator from '../publication/PublicationCreator.vue';
import PublicationCard from '../publication/PublicationCard.vue';
import PublicationPresentation from '../publication/PublicationPresentation.vue';
import PublicationTable from '../publication/PublicationTable.vue';
import api from "@/services/axios";
import PublicationAgenda from "../PublicationAgenda.vue";


const selectedPublication = ref(null); // Publication actuellement sélectionnée

async function fetchPublicationDetails(publicationId) {

  try {
    const response = await api.get(`/publications/${publicationId}`);
    selectedPublication.value = response.data; // Charger les détails de la publication
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la publication :", error);
  }
}

</script>

<style scoped>
.presentation {
  margin-left: 20px;
}

.presentation h1 {
  font-size: 1.6rem;
}

button h3 {
  font-size: 1.3rem;
}

.targetDefinition {
  border: 2px solid gainsboro;
  border-radius: 5px;
  padding: 10px;
  background-color: #f4ebfa;
}

.accordion-button {
  background-color: #eeeacc !important;
  /* Couleur de fond personnalisée */
  color: rgb(82, 82, 85) !important;
  /* Couleur du texte */
  border: none;
}

.accordion-button:hover {
  background-color: #e7e1a9 !important;
}

.accordion-button:not(.collapsed) {
  background-color: #fdf4b0 !important;
  color: rgb(85, 82, 82) !important;
}

.accordion-button:focus {
  box-shadow: none !important;
}

.Accordion-container {
  border-left: 1px gainsboro solid;
  border-radius: 5px;
  padding: 20px;
  background-color: #F8F9FA !important;
}

.pubTitle {
  padding: 20px
}

.Publist {
  padding: 20px;
  border-radius: 5px;
  background-color: #F8F9FA !important;
  border-left: 1px gainsboro solid;
  border-right: 1px gainsboro solid;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}
</style>