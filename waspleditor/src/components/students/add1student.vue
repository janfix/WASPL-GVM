<template>
    <div class="container">
      <h3>Add a New Student</h3>
      <form @submit.prevent="submitForm">
        <div class="row">
          <div class="col">
            <!-- Firstname -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="firstname"
                v-model="student.firstname"
                placeholder="Firstname"
              />
              <label for="firstname">Firstname</label>
            </div>
          </div>
          <div class="col">
            <!-- Lastname -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="lastname"
                v-model="student.lastname"
                placeholder="Lastname"
              />
              <label for="lastname">Lastname</label>
            </div>
          </div>
          <div class="col">
            <!-- Email -->
            <div class="form-floating mb-3">
              <input
                type="email"
                class="form-control"
                id="email"
                v-model="student.email"
                placeholder="Email"
              />
              <label for="email">Email</label>
            </div>
          </div>
        </div>
  
        <div class="row">
          <div class="col">
            <!-- Password -->
            <div class="form-floating mb-3">
              <input
                type="password"
                class="form-control"
                id="password"
                v-model="student.password"
                placeholder="Password"
              />
              <label for="password">Password</label>
            </div>
          </div>
          <div class="col">
            <!-- Institution -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="institution"
                v-model="student.institution"
                placeholder="Institution"
              />
              <label for="institution">Institution</label>
            </div>
          </div>
          <div class="col">
            <!-- Class -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="class"
                v-model="student.class"
                placeholder="Class"
              />
              <label for="class">Class</label>
            </div>
          </div>
        </div>
  
        <div class="row">
          <div class="col">
            <!-- Grade -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="grade"
                v-model="student.grade"
                placeholder="Grade"
              />
              <label for="grade">Grade</label>
            </div>
          </div>
          <div class="col">
            <!-- Sector -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="sector"
                v-model="student.sector"
                placeholder="Sector"
              />
              <label for="sector">Sector</label>
            </div>
          </div>
          <div class="col">
            <!-- Location -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="location"
                v-model="student.location"
                placeholder="Location"
              />
              <label for="location">Location</label>
            </div>
          </div>
        </div>
  
        <div class="row">
          <div class="col">
            <!-- Zipcode -->
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="zipcode"
                v-model="student.zipcode"
                placeholder="Zipcode"
              />
              <label for="zipcode">Zipcode</label>
            </div>
          </div>
          <div class="col">
            <!-- Group Selection -->
            <div class="form-floating">
              <select
                class="form-select"
                id="GroupSelect"
                v-model="selectedGroup"
                @change="addGroupToStudent"
              >
                <option value="" disabled>Select a Group</option>
                <option v-for="group in groups" :key="group._id" :value="group._id">
                  {{ group.groupName }}
                </option>
              </select>
              <label for="GroupSelect">Select a Group</label>
            </div>
          </div>
        </div>
  
        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary">Add Student</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import api from "@/services/axios";
  
  
  const groups = ref([]); // Liste des groupes
  const selectedGroup = ref(""); // Groupe sélectionné
  
  // Données du formulaire
  const student = ref({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    institution: "",
    class: "",
    grade: "",
    sector: "",
    location: "",
    zipcode: "",
    role: "student",
    group: [], // Liste des groupes associés à l'étudiant
  });

  // Charger les groupes depuis l'API
  async function getGroupList() {
    try {
      const response = await api.get(`/groups/list`);
      groups.value = response.data;
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }
  
  // Ajouter un groupe à l'étudiant
  function addGroupToStudent() {
    if (selectedGroup.value && !student.value.group.includes(selectedGroup.value)) {
      student.value.group.push(selectedGroup.value);
    }
    selectedGroup.value = ""; // Réinitialiser le choix du groupe
  }
  
  // Obtenir le nom d'un groupe à partir de son ID
  function getGroupName(groupId) {
    const group = groups.value.find((g) => g._id === groupId);
    return group ? group.groupName : "Unknown Group";
  }
  
  // Soumettre le formulaire
  async function submitForm() {
    try {
        const response = await api.post(`/students/newStudent`, student.value);
      alert("Student added successfully!");
  
      // Réinitialiser le formulaire
      Object.keys(student.value).forEach((key) => {
        if (Array.isArray(student.value[key])) {
          student.value[key] = [];
        } else {
          student.value[key] = "";
        }
      });
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student. Please try again.");
    }
  }
  
  // Charger les groupes au montage
  onMounted(getGroupList);
  </script>
  

  


<style scoped>
.container {
    border: 1px gainsboro solid;
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 20px;
    background-color: rgb(189, 220, 245);
}
</style>