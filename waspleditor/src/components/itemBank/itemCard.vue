<template>
    <div v-if="selectedItem">
        <div class="card">
            <div class="card-header">
                <div class="row">
                    <div class="col">
                        <h1 class="card-title">{{ selectedItem.el_Label }} </h1>
                    </div>
                    <div class="col">
                        <span class="itemID"> ID : {{ selectedItem.el_ID }}</span>
                    </div>
                    <div class="col" style="text-align: right">
                        <h2><span class="badge mr-2 bg-Success"> {{ selectedItem.el_Type }}</span></h2>
                    </div>
                </div>
            </div>

            <div class="card-body">
                <div class="row">
                    <!-- Metadata -->
                    <div class="col">
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="author" v-model="formItem.el_Label"/>
                            <label for="author">Short label</label>
                        </div>

                        <h2>Metadata</h2>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="author" v-model="formItem.metadata.author"
                                placeholder="Author" />
                            <label for="author">Author</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="institution"
                                v-model="formItem.metadata.institution" placeholder="Institution" />
                            <label for="institution">Institution</label>
                        </div>

                        <div class="form-floating mb-3">
                            <input type="date" class="form-control" id="created" v-model="createdDate"
                                placeholder="Created" />
                            <label for="created">Created</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="date" class="form-control" id="lastModification"
                                v-model="formItem.metadata.lastModif" placeholder="Last Modification" />
                            <label for="lastModification">Last Modification</label>
                        </div>
                        <!-- <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="createdFrom"
                                v-model="formItem.metadata.createdFrom" placeholder="Created From" />
                            <label for="createdFrom">Created From</label>
                        </div> -->
                    </div>

                    <!-- Content -->
                    <div class="col">
                        <h2>Content</h2>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="subject" v-model="formItem.metadata.subject"
                                placeholder="Subject" />
                            <label for="subject">Subject</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="domain" v-model="formItem.metadata.domain"
                                placeholder="Domain" />
                            <label for="domain">Domain</label>
                        </div>
                        <div class="form-floating mb-3">
                            <textarea class="form-control" id="taskDefinition" v-model="formItem.metadata.description"
                                placeholder="Task Definition" style="height: 100px"></textarea>
                            <label for="taskDefinition">Task Definition / Description</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="keywords" v-model="formItem.metadata.keywords"
                                placeholder="Keywords" />
                            <label for="keywords">Keywords</label>
                        </div>
                        <div class="mb-3">
                            <IscedSelector v-model="formItem.metadata.ISCED" />
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="text" class="form-control" id="framework" placeholder="Framework"
                                v-model="formItem.param.framework" />
                            <label for="framework">Framework</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="text" class="form-control" id="frameworkKey" placeholder="Framework Key"
                                v-model="formItem.param.frameworkKey" />
                            <label for="frameworkKey">Framework Key</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <select class="form-select" id="applicationBased" v-model="formItem.param.applicationBase">
                                <option selected>Choose...</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                            <label for="applicationBased">Application Based</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="text" class="form-control" id="complementaryTools"
                                placeholder="Complementary Tools" v-model="formItem.param.complementaryTools" />
                            <label for="complementaryTools">Complementary Tools</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="text" class="form-control" id="stimulusReferences"
                                placeholder="Stimulus References" v-model="formItem.param.stimulusReferences" />
                            <label for="stimulusReferences">Stimulus References</label>
                        </div>
                        <div hidden class="form-floating mb-3">
                            <input type="text" class="form-control" id="license" placeholder="license"
                                v-model="formItem.metadata.license" />
                            <label for="license">License</label>
                        </div>
                    </div>



                    <!-- Localisation -->
                    <div class="col">
                        <h2>Localisation</h2>
                        <div class="form-floating mb-3">
                            <input disabled type="text" class="form-control" id="country" v-model="formItem.metadata.country"
                                placeholder="Country" />
                            <label for="country">Country</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input disabled type="text" class="form-control" id="originalLanguage"
                                v-model="formItem.metadata.originalLanguage" placeholder="Original Language" />
                            <label for="originalLanguage">Original Language</label>
                        </div>
                        <div class="form-floating mb-3">
                            <textarea disabled class="form-control" id="translations" v-model="formItem.metadata.translations"
                                placeholder="Translations" style="height: 100px"></textarea>
                            <label for="translations">Translations</label>
                        </div>
                        <div class="form-floating mb-3">
                            <select disabled class="form-select" id="multilingualItem"
                                v-model="formItem.metadata.multilingualItem">
                                <option selected>Choose...</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                            <label for="multilingualItem">Multilingual Item</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <button type="button" class="btn btn-primary" @click="updateItem">
                    Update Item complementary data
                </button>
            </div>
        </div>
    </div>
    <div v-else>
        <p>Select an item from the table to view details.</p>
    </div>
</template>


<script setup>
import { ref, watch, computed,toRef } from "vue";
import api from "@/services/axios";
import IscedSelector from "@/components/common/IscedSelector.vue";

const emit = defineEmits(['refresh']);
const props = defineProps(['selectedItem']);
const selectedItem = toRef(props, 'selectedItem');

const formItem = ref({});

// Normalise la date pour le datepicker
const createdDate = computed({
    get() {
        const raw = formItem.value?.metadata?.created
        if (!raw) return ''
        return new Date(raw).toISOString().split('T')[0] // 'YYYY-MM-DD'
    },
    set(val) {
        formItem.value.metadata.created = new Date(val).toISOString()
    }
})


watch(
    () => props.selectedItem,
    (newItem) => {
        if (newItem) {
            formItem.value = {
                ...newItem,
                metadata: {
                    author: newItem.metadata?.author || "",
                    institution: newItem.metadata?.institution || "",
                    created: newItem.metadata?.created || "",
                    lastModif: newItem.metadata?.lastModif || "",
                    //createdFrom: newItem.metadata?.createdFrom || "",
                    subject: newItem.metadata?.subject || "",
                    domain: newItem.metadata?.domain || "",
                    description: newItem.metadata?.description || "",
                    keywords: newItem.metadata?.keywords || "",
                    ISCED: newItem.metadata?.ISCED || "",
                    country: newItem.metadata?.country || "",
                    originalLanguage: newItem.metadata?.originalLanguage || "",
                    translations: newItem.metadata?.translations || "",
                    multilingualItem: newItem.metadata?.multilingualItem || "false",
                    license: newItem.metadata?.license || "",
                },
                param: {
                    stimulusReferences: newItem.param?.stimulusReferences || "",
                    complementaryTools: newItem.param?.complementaryTools || "",
                    applicationBase: newItem.param?.applicationBase || "No",
                    frameworkKey: newItem.param?.frameworkKey || "",
                    framework: newItem.param?.framework || "",
                },
            };
        } else {
            formItem.value = {};
        }
    },
    { immediate: true }
);

watch(
  () => formItem.value.el_Label,
  (newLabel) => {
    if (selectedItem.value) {
      selectedItem.value.el_Label = newLabel;
    }
  }
);



const updateItem = async () => {
    try {
        const cleanedData = {
            ...formItem.value,
            metadata: {
                ...formItem.value.metadata,
            },
            param: {
                ...formItem.value.param,
            },
        };

        const response = await api.put(
            `/items/${formItem.value._id}`,
            cleanedData
        );

        console.log("Item updated successfully:", response.data);
        alert("Item updated successfully!");
        emit('refresh');
    } catch (error) {
        console.error("Error updating item:", error.response?.data || error.message);
        alert("Failed to update the item. Please try again.");
    }
};
</script>





<style scoped>
h1 {
    text-transform: capitalize;
    font-size: 1.5rem;
    font-weight: bold;
}

h2 {
    font-size: 1.25rem;
    font-weight: bold;
}

.mr-2 {
    margin-right: 0.5rem;
}

.itemID {

    font-size: 1rem;
    margin-left: 0.5rem;
}

.bg-Success {
    background-color: #81aaf5;
}
</style>