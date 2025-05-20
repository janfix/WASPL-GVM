<template>
    <div class="row" v-if="!isItemBank">
        <div class="col-10" >
            
            <button type="submit" class="btn btn-info sendToItemLibBT" @click="sendToItemLib">Send to Item Collection</button>
        </div>
        <div class="col-2">
            <button  @click="deleteElement" class="btn btn-danger btn">Delete</button>
        </div>
    </div>
    <div class="row" v-if="isItemBank">
        <div class="col-10" >
          <button type="button" class="btn btn-primary mr-2" @click="updateItem">Update</button>
          <button hidden type="button" class="btn btn-info mr-2" @click="DuplicateItem">Duplicate</button>
        </div>
        <!-- <div class="col-2">
            <button  @click="deleteItem" class="btn btn-danger btn">Delete</button>
        </div> -->
    </div>

</template>

<script setup>
import { useTestStore } from '../../../stores/testStore';
import { useItemStore } from '../../../stores/itemStore';
import { useUserStore } from '../../../stores/userStore';

const store = useTestStore();
const itemStore = useItemStore();
const testData = store.testData;
const UserStore = useUserStore();

const User = UserStore.user

// Définir les props
const props = defineProps({
  selectedElement: {
    type: Object,
    required: true,
    default: null,
  },
  elementLabel: {
    type: String,
    required: true,
    default: null,
  },
  isItemBank : {
    type:Boolean,
    default:false
  }
});

// Définir les événements émis
defineEmits(['save-element', 'delete-element']);

const saveTest = () => {
    console.log("SAving test");
  store.saveTestData();
};


const ELmetadata= {
    author :testData.metadata.Author,
    institution : User.institution,
    created: new Date().toISOString(),
    lastModif: new Date().toISOString(),
     subject: testData.Subject,    
    domain : testData.domain,
    description:testData.Description,
    keywords: testData.Keywords,
    grade : testData.level,
    ISCED : User.ISCED,
    language : testData.language 
  }


const sendToItemLib = async () => {
  props.selectedElement.el_Label = props.elementLabel;
  console.log("Selected Element before export:", props.selectedElement);
  try {
    console.log('TESTDATA !:',store.testData)
    await itemStore.saveItem(props.selectedElement, ELmetadata);
    alert("Element successfully saved to the library!");
  } catch {
    alert("Failed to save element. Please try again.");
  }
};

const deleteElement = () =>{store.deleteElement(props.selectedElement.el_ID);
    store.resetState();
} 
const deleteItem = () =>{itemStore.deleteItem(props.selectedElement._id);
  itemStore.resetState();
} 

const updateItem = async () => {
  try {
    // Vérifiez si l'élément sélectionné est valide
    if (!props.selectedElement || !props.selectedElement._id) {
      alert("No item selected for update.");
      return;
    }

    // Met à jour l'élément avec le store
    await itemStore.updateItem(props.selectedElement._id, props.selectedElement);
    alert("Element successfully updated!");
  } catch (error) {
    console.error("Failed to update item:", error);
    alert("Failed to update the item. Please try again.");
  }
};


const DuplicateItem = () =>{itemStore.saveItem(props.selectedElement);
  // TODO : Change le ID pour un unique ID, Renome le label + Titre avec COPY+
  itemStore.resetState();
} 

</script>

<style scoped>

</style>

<style>
.mr-2 {
    margin-right: 0.5rem;
}
</style> 