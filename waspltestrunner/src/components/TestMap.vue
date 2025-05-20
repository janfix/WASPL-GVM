<template>
  <div class="test-map">
    <div 
      class="page" 
      v-for="(page, pageIndex) in testData.pages" 
      :key="page.id"
      :class="{ active: pageIndex === currentPageIndex }"
      @click="navigateToPage(pageIndex)"
      >
      
      <h3>Page {{pageIndex+1}}</h3>

      <div class="elements">
        <div 
          class="element" 
          v-for="element in page.children" 
          :key="element.id"
          :class="{ answered: isAnswered(element.id), message: getElementType(element.id) === 'message' }"
          :title="getElementType(element.id) === 'message' ? 'Message' : element.label + ' - ' + getElementType(element.id)">
          {{ getElementType(element.id) === 'message' ? 'M' : getElementOrder(element.id) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed } from "vue";

// Définition des props
const props = defineProps({
  testData: {
    type: Object,
    required: true,
  },
  answers: {
    type: Object,
    required: true,
  },
  currentPageIndex: {
    type: Number,
  },
  publication: {
    type: Object,
    required: true,
  },
});

// Définition des événements émis
const emit = defineEmits(["navigate-to-page"]);

// Méthode pour la navigation
const navigateToPage = (index) => {
  if(!props.publication.skip
    || props.publication.browsing==='noBack'
  ){return} // NO WAY to use this method to navigate throught the test !
  console.log("Émission de l'événement navigate-to-page avec index:", index);
  emit("navigate-to-page", index);
  
};

// Vérifie si une question est répondue
const isAnswered = (elementId) => {
  return props.answers[elementId] === true;
};

// Récupère le type d'un élément
const getElementType = (elementId) => {
  const element = props.testData.elements.find(el => el.el_ID === elementId);
  return element ? element.el_Type : "";
};

// Récupère la liste des messages
const getMessageElID = computed(() => {
  return props.testData.elements
    .filter(el => el.el_Type === "message")
    .map(el => el.el_ID);
});

// Détermine l'ordre d'affichage des éléments
const getElementOrder = (elementId) => {
  let order = 0;
  const elementToAvoid = getMessageElID.value; // Liste des messages
  for (const page of props.testData.pages) {
    const filteredChildren = page.children.filter(
      (el) => !elementToAvoid.includes(el.id)
    );
    const index = filteredChildren.findIndex((el) => el.id === elementId);
    if (index !== -1) {
      order += index + 1;
      break;
    }
    order += filteredChildren.length;
  }
  return order;
};
</script>

<style scoped>


.test-map {
 
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: fit-content;
 /*  border: 1px gainsboro solid; 
  border-radius: 5px;*/
}

.page {
  margin: 5px;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 8px;
  width: auto;
}

.page.active {
  border-color: #007bff;
  background-color: #e9f7ff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}

.page h3 {
  color: rgb(76, 76, 76);
  font-size: 0.5em;
  text-align: center;
}

.elements {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.element {
  width: 20px;
  height: 20px;
  background-color: #e5fc1a;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.element.answered {
  background-color: #4caf50;
  color: white;
}

/* Style spécifique pour les messages */
.element.message {
  background-color: #4caf50;
  color: white;
  font-weight: bold;
  width: 20px;
  height: 20px;
  text-align: center;
}


.testMapLabel {
  display: none;
  position: absolute;
  margin-top: -10px;
  margin-left: 20px;
  font-size: 0.8rem;
  font-variant: small-caps;
  background-color: tomato;
  padding: 0px 3px 0px 3px;
  color: antiquewhite;
  border: 1px whitesmoke solid;
  border-radius: 5px;
}



</style>
