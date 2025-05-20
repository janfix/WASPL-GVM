import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Group from '../models/groupModel.js';


import {
    importGroupWithStudents,
    createGroup,
    getGroups,
    updateGroup,
    deleteGroup,
    newGroup,
    addStudentsToGroup,
    removeStudentFromGroup 
  } from "../controllers/groupController.js";

const router = express.Router();
// Route pour créer un nouveau groupe vide

router.use(authMiddleware);

//Récupérer la liste des groupes pour le select
// Nouvelle route pour récupérer uniquement les noms et identifiants des groupes
router.get("/list", async (req, res) => {
  try {
    const groups = await Group.find({}, "groupName _id"); // Récupère uniquement les champs 'groupName' et '_id'
    res.status(200).json(groups);
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des groupes" });
  }
});

router.post("/newGroup", newGroup);

// Route pour importer un groupe et ses étudiants
router.post("/import", importGroupWithStudents);

// CREATE : Créer un groupe
router.post("/", createGroup);

// READ : Récupérer les groupes
router.get("/", getGroups);

router.put('/remove-student', removeStudentFromGroup);

// UPDATE : Mettre à jour un groupe
router.put("/:id", updateGroup);

// DELETE : Supprimer un groupe
router.delete("/:id", deleteGroup);

// Lire un seul groupe par son ID
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.status(200).json(group);
  } catch (error) {
    console.error("Erreur récupération groupe :", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



// Récupérer les étudiants d'un groupe
router.get("/:id/students", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("students");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group.students);
  } catch (error) {
    console.error("Erreur lors de la récupération des étudiants :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des étudiants" });
  }
});





// Route pour ajouter plusieurs étudiants à un groupe existant
router.put("/:id/add-students", addStudentsToGroup);





export default router;
