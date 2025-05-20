import express from "express";

import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  addGroupToStudent,
  deleteAllStudents,
  newStudent,
  getStudentNames,
  checkStudentExists,
  getStudentById,
} from "../controllers/studentController.js";

import { addStudentsToGroup } from "../controllers/groupController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Vérifier si un étudiant existe
router.get("/check", checkStudentExists);

// CREATE : Créer un Studente
router.post("/", createStudent);

// Add new Student
router.post("/newStudent", newStudent);

// READ : Récupérer les Studentes
router.get("/", getStudents);

// UPDATE : Mettre à jour un Studente
router.put("/:id", updateStudent);

// DELETE : Supprimer un Studente
router.delete("/:id", deleteStudent);

// DELETE : ALL STUDENTS !
router.delete("/", deleteAllStudents);

router.get("/:id", getStudentById);

// ADD GROUP : Ajouter un groupe à un étudiant
router.post("/:id/add-group", addGroupToStudent);

router.put("/:id/add-students", addStudentsToGroup);

router.post("/getNames", getStudentNames);

export default router;
