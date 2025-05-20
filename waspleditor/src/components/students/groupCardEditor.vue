<template>
    <div class="card">
        <div class="card-header">
            <div class="row">
                <div class="col">
                    <h3> Group info-editor </h3>
                </div>
                <div class="col" style="text-align: right;">
                    <button class="btn btn-secondary btn-sm" @click="$emit('close')">Close</button>

                </div>
            </div>

        </div>
        <div class="card-body">
            <form @submit.prevent="updateGroup">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" v-model="groupData.groupName"
                                placeholder="Group Name" />
                            <label>Group Name</label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-floating mb-3">
                            <textarea class="form-control" v-model="groupData.description"
                                placeholder="Description"></textarea>
                            <label>Description</label>
                        </div>
                    </div>


                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" v-model="groupData.institution"
                                placeholder="Institution" />
                            <label>Institution</label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-floating">
                            <input type="text" id="groupLocation" v-model="groupData.location" class="form-control"
                                placeholder="Location" />
                            <label for="groupLocation">Group Location</label>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="form-floating">
                            <input type="text" id="groupZipcode" v-model="groupData.zipCode" class="form-control"
                                placeholder="Zipcode" />
                            <label for="groupZipcode">Zipcode</label>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-floating">
                            <input type="text" id="groupGrade" v-model="groupData.grade" class="form-control"
                                placeholder="Grade" />
                            <label for="groupGrade">Grade</label>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-floating">
                            <input type="text" id="groupSector" v-model="groupData.sector" class="form-control"
                                placeholder="Sector" />
                            <label for="groupSector">Sector</label>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary mt-4">Update Group</button>
            </form>

        </div>


    </div>

</template>
<script setup>
import { reactive, watch } from "vue";
import api from "@/services/axios";



const props = defineProps({
    group: {
        type: Object,
        required: true,
    },
});

// Définir un événement pour émettre l'ID du groupe sélectionné
const emit = defineEmits(['close','updated']);

// Données locales pour édition
const groupData = reactive({ ...props.group });

// Synchronisez les données si `props.group` change
watch(
    () => props.group,
    (newGroup) => {
        Object.assign(groupData, newGroup); // Mettez à jour les données locales
    }
);

// Méthode pour mettre à jour le groupe
async function updateGroup() {
    try {
        await api.put(`/groups/${groupData._id}`, groupData);
        alert("Group updated successfully!");
        emit('updated', groupData);
    } catch (error) {
        console.error("Error updating group:", error);
        alert("Failed to update group.");
    }
}


</script>

<style scoped>
.card-header {
    background-color: #f7eda8;
}

.mr-2 {
    margin-right: 20px !important;
}

.card-body {
    background-color: #f9f8f2;
}

h3 {
    margin-top: 10px;
    font-size: 1.2rem;
}

.container {
    border: 1px solid gainsboro;
    border-radius: 5px;
    padding: 20px;
    margin-bottom: 20px;
    background-color: #f6f4e2;
}

.alert {
    padding: 10px;
    margin-top: 20px;
    font-weight: bold;
}
</style>
