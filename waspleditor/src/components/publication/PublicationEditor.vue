<template>
    <div>
        <h3>Edit Publication</h3>
        <form @submit.prevent="updatePublication">
            <div class="row">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type="text" class="form-control" v-model="publicationData.publicationName"
                            placeholder="Publication Name" />
                        <label>Publication Name</label>
                    </div>
                </div>
                <div class="col">
                    <div class="col">
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" v-model="publicationData.institution"
                                placeholder="Institution" />
                            <label>Institution</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col mb-4">
                    <div class="form-floating">
                        <select class="form-select" v-model="publicationData.testId" :disabled="!tests.length">
                            <option value="" disabled>Select a Test</option>
                            <option v-for="test in tests" :key="test._id" :value="String(test._id)">
                                {{ test.title }}
                            </option>
                        </select>

                        <label>Test</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating">
                        <select class="form-select" v-model="publicationData.groupId._id" :disabled="!groups.length">
                            <option value="" disabled>Select a Group</option>
                            <option v-for="group in groups" :key="group._id" :value="group._id">
                                {{ group.groupName }}
                            </option>
                        </select>
                        <label>Group</label>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="form-floating">
                    <textarea class="form-control" v-model="publicationData.description"
                        placeholder="Add some important details"></textarea>
                    <label style="margin-left:10px">Description</label>
                </div>
            </div>
            <!--<div class="row mb-4">
                
                 <div class="col">
                    <div class="form-floating">
                        <input
                            type="number"
                            :min="publicationData.access === 'multiple' ? 2 : 1"
                            class="form-control"
                            v-model="publicationData.attemptLimit"
                            :disabled="publicationData.access !== 'multiple'"
                        />
                        
                        <label>Attempts limit (multiple access)</label>  
  
                    </div>
                </div> 
            </div>-->

            <div class="row mt-3">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type="date" class="form-control"
                            :value="formatDateForInput(publicationData.startingDate)" @input="updateStartingDate" />
                        <label>Starting Date</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type="date" class="form-control" :value="formatDateForInput(publicationData.endDate)"
                            @input="updateEndDate" />
                        <label>End Date</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating">
                        <select class="form-select" v-model="publicationData.access" id="access">
                            <option value="unique">Unique</option>
                            <option value="multiple">Multiple</option>
                        </select>
                        <label for="access" class="form-label">Access</label>
                    </div>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col">
                    <div class="form-floating">
                        <select id="mode" class="form-select" v-model="publicationData.mode" title="Test Mode">
                            <option value="exam">Exam</option>
                            <option value="formative">Formative mode</option>
                            <option disabled value="live">Live</option>
                            <option disabled value="custom">Custom</option>
                        </select>
                        <label for="mode">Test Mode</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating">
                        <select id="Tnav" class="form-select" v-model="publicationData.browsing" title="Browsing">
                            <option value="backPossible">Browsing back is possible</option>
                            <option value="noBack">Browsing back is not allowed</option>
                        </select>
                        <label for="Tnav">Browsing</label>
                    </div>

                </div>

                <!-- <div class="col">
                    <div class="form-floating">
                        <select id="TSub" class="form-select" v-model="publicationData.submission"
                            title="Submission Mode">
                            <option value="eachQuestion">Each question</option>
                            <option value="eachPage">Each page</option>
                            <option value="endTest">End of test</option>
                        </select>
                        <label for="TSub">Answers submission mode</label>
                    </div> -->


                <div class="row">

                    <div class="col mt-4" style="margin-left:40px">
                        <div class="form-check form-switch">
                            <input disabled class="form-check-input" type="checkbox" id="settingShuffleQuestionsEditor"
                                v-model="publicationData.shuffleQuestions">
                            <label class="form-check-label" for="settingShuffleQuestionsEditor">Shuffle Questions in
                                page</label>
                        </div>
                        <div class="form-check form-switch">
                            <input disabled class="form-check-input" type="checkbox" id="settingShufflePagesEditor"
                                v-model="publicationData.shufflePages">
                            <label class="form-check-label" for="settingShufflePagesEditor">Shuffle pages</label>
                        </div>
                        <div hidden class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="settingFeedbackEditor"
                                v-model="publicationData.feedbackAllowed">
                            <label class="form-check-label" for="settingFeedbackEditor">FeedBack Allowed</label>
                        </div>
                        
                        <div hidden class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="settingCountDownEditor"
                                v-model="publicationData.countDown">
                            <label class="form-check-label" for="settingCountDownEditor">Count down</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="settingTimeLimitEditor"
                                v-model="publicationData.timeLimit">
                            <label class="form-check-label" for="settingTimeLimitEditor">Time limit</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="settingSkipEditor"
                                v-model="publicationData.skip">
                            <label class="form-check-label" for="settingSkipEditor">Skip is allowed</label>
                        </div>
                        
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="testMap"
                                v-model="publicationData.testMap">
                            <label class="form-check-label" for="testMap">Test Map</label>
                        </div>
                        <div class="form-check form-switch">
                            <input disabled class="form-check-input" type="checkbox" id="ctools"
                                v-model="publicationData.ctools">
                            <label class="form-check-label" for="ctools">Complementary tools</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="ReadOnlyAnsw"
                                v-model="publicationData.readOnlyAnswer">
                            <label class="form-check-label" for="ReadOnlyAnsw">Read-only once answered</label>
                        </div>

                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="revealQuestionNB"
                                v-model="publicationData.revealQuestionNB">
                            <label class="form-check-label" for="revealQuestionNB">Reveal Question number</label>
                        </div>
                    </div>
                    <div class="col mt-4">
                        <div class="mb-2"><b>Last page elements</b></div>
                        <div class="form-floating mb-2">
                            <textarea class="form-control" placeholder="Thank you for your participation"
                                id="PubLeaveMessage" v-model="publicationData.leaveMessage"></textarea>
                            <label style="margin-left:10px" for="PubLeaveMessage">Leave Message</label>
                        </div>
                        <div class="notice">
                            The open-ended question are excluded of the score calculation in that version.
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="settingDirectScoreEditor"
                                v-model="publicationData.directScore_FB">
                            <label class="form-check-label" for="settingDirectScoreEditor">Final score report</label>
                        </div>
                        <div class="form-check form-switch">
                            <input disabled class="form-check-input" type="checkbox" id="AICorrectionEditor"
                                v-model="publicationData.AICorr">
                            <label class="form-check-label" for="AICorrectionEditor">AI Correction</label>
                        </div>
                    </div>
                </div>

            </div>

            <div hidden class="row mt-4 mb-2">
                <div class="col-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="publicationData.reports.studentReport"
                            id="StudentReport">
                        <label class="form-check-label" for="StudentReport">
                            Student Report
                        </label>
                    </div>
                </div>
                <div class="col-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="publicationData.reports.groupReport"
                            id="GroupReport">
                        <label class="form-check-label" for="GroupReport">
                            Group Report
                        </label>
                    </div>
                </div>

                <div class="col-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="publicationData.reports.statReport"
                            id="StatisticReport" checked>
                        <label class="form-check-label" for="StatisticReport">
                            Statistic Report
                        </label>
                    </div>
                </div>
            </div>
            <div class="row mt-4 mb-2">
                <div class="col">
                    <button type="submit" class="btn btn-primary">Update Publication</button>
                </div>
                <div class="col" style="text-align: right;">
                    <button type="submit" class="btn btn-danger">Delete Publication</button>
                </div>
            </div>


        </form>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import api from "@/services/axios";



const props = defineProps({
    publication: {
        type: Object,
        required: true,
    },
});

// Utiliser `ref` pour les listes
const tests = ref([]);
const groups = ref([]);

const mode = props.publication.mode;
const submission = props.publication.submission;

// Créer une copie réactive des données de publication
const publicationData = ref({
    ...props.publication,
    testId: props.publication.testId ? String(props.publication.testId) : ''
});

watch(() => publicationData.value.access, (newAccess) => {
    if (newAccess === 'unique') {
        publicationData.value.attemptLimit = 1;
    }
});

// Surveiller les changements de la prop `publication`
watch(
    () => props.publication,
    (newValue) => {
        publicationData.value = {
            ...newValue,
            testId: newValue.testId ? String(newValue.testId._id || newValue.testId) : ''
        };
    },
    { immediate: true, deep: true }
);


watch(tests, (newTests) => {
    if (newTests.length > 0 && publicationData.value.testId) {
        // S'assurer que testId est bien une chaîne
        if (typeof publicationData.value.testId === 'object' && publicationData.value.testId._id) {
            // Si testId est un objet avec un _id, utilisez cet _id
            publicationData.value.testId = String(publicationData.value.testId._id);
        } else if (publicationData.value.testId) {
            // Sinon, assurez-vous que c'est une chaîne
            publicationData.value.testId = String(publicationData.value.testId);
        }
    }
}, { immediate: true, deep: true });



// Fonction pour formater la date pour l'input
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

// Fonctions de mise à jour des dates
const updateStartingDate = (event) => {
    publicationData.value.startingDate = event.target.value;
};

const updateEndDate = (event) => {
    publicationData.value.endDate = event.target.value;
};

// Charger la liste des tests et des groupes

async function fetchTests() {
    try {
        const [testResponse, groupResponse] = await Promise.all([
            api.get(`tests/getTests`),
            api.get(`/groups`)
        ]);

        tests.value = testResponse.data.tests;
        groups.value = groupResponse.data.groups;
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
    }
}

// Mettre à jour la publication
async function updatePublication() {
    if (publicationData.value.testId) {
        publicationData.value.testId = String(publicationData.value.testId);
    }
    const today = new Date();
    const startingDate = new Date(publicationData.value.startingDate);
    const endDate = new Date(publicationData.value.endDate);

    // Gestion des cas selon les dates
    // if (today < startingDate) {
    // Cas 1 : Avant la date de début (Coming)
    try {
        await api.put(
            `/publications/${publicationData.value._id}`,
            publicationData.value
        );
        alert("Publication updated successfully!");
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la publication :", error);
    }
    /* } else if (today >= startingDate && today <= endDate) {
        // Cas 2 : Pendant la session (Open)
        alert("Modification impossible : the publication is running.");
    } else if (today > endDate) {
        // Cas 3 : Après la date de fin (Closed)
        alert("Modification impossible : the session is over.");
    } */
}

// Charger les tests et les groupes au montage
fetchTests();


</script>

<style scoped>
.notice{
  font-style: italic;
  color: gray;  
  font-size: small;
}
</style>