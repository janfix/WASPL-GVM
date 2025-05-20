import Student from "../models/studentModel.js";
import Group from "../models/groupModel.js";

// Contrôleur pour créer un nouvel étudiant
export const newStudent = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      institution,
      class: studentClass,
      grade,
      sector,
      location,
      zipcode,
      role,
      group, // Tableau des IDs de groupes
    } = req.body;

    // Validation des champs obligatoires
    if (!firstname || !lastname || !email || !password || !role) {
      return res.status(400).json({ message: "Firstname, Lastname, Email, Password, and Role are required." });
    }

    // Validation des groupes (doit être un tableau)
    if (!Array.isArray(group)) {
      return res.status(400).json({ message: "Group must be an array." });
    }

    // Création de l'étudiant
    const student = await Student.create({
      firstname,
      lastname,
      email,
      password,
      institution,
      class: studentClass,
      grade,
      sector,
      location,
      zipcode,
      role,
      group,
    });

    // Mise à jour des groupes pour ajouter l'étudiant
    await Group.updateMany(
      { _id: { $in: group } }, // Trouver tous les groupes par ID
      { $push: { students: student._id } } // Ajouter l'ID de l'étudiant au tableau `students`
    );

    res.status(201).json({
      message: "Student created successfully!",
      student,
    });
  } catch (error) {
    console.error("Error creating student:", error.message);
    res.status(500).json({ message: "Failed to create student." });
  }
};

// CREATE : Créer un nouveau studente
export const createStudent = async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    password,
    institution,
    sector,
    grade,
    location,
    zipcode,
    mailStatus,
  } = req.body;
  
  try {
    const student = await Student.create({
      firstname,
      lastname,
      email,
      password,
      institution,
      sector,
      grade,
      location,
      zipcode,
      mailStatus,
    });

    res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
  
  // READ : Récupérer tous les studentes ou ceux d’un créateur spécifique
  export const getStudents = async (req, res) => {
    //console.log("Requête pour récupérer les étudiants - Query:", req.query);

    try {
        let query = {};
        
        // 1. Gestion des filtres standards (depuis setFilter)
        if (req.query.filters) {
            const filters = JSON.parse(req.query.filters);
            filters.forEach(filter => {
                if (filter.field === 'group') {
                    // Pour le groupe, recherche exacte d'ID
                    query['group'] = filter.value;
                } else {
                    // Pour les autres champs, recherche textuelle
                    query[filter.field] = { $regex: filter.value, $options: 'i' };
                }
            });
        }

        // 2. Gestion des headerFilters (filtres d'en-tête de colonne)
        if (req.query.headerFilters) {
            const headerFilters = JSON.parse(req.query.headerFilters);
            headerFilters.forEach(filter => {
                if (!filter.value) return; // Ignore les filtres vides

                switch (filter.type) {
                    case '=': // Égalité exacte
                        query[filter.field] = filter.value;
                        break;
                    case '!=': // Différent
                        query[filter.field] = { $ne: filter.value };
                        break;
                    case 'like': // Contient (recherche textuelle)
                        query[filter.field] = { $regex: filter.value, $options: 'i' };
                        break;
                    case '>': // Supérieur
                        query[filter.field] = { $gt: Number(filter.value) || filter.value };
                        break;
                    case '<': // Inférieur
                        query[filter.field] = { $lt: Number(filter.value) || filter.value };
                        break;
                    case '>=': // Supérieur ou égal
                        query[filter.field] = { $gte: Number(filter.value) || filter.value };
                        break;
                    case '<=': // Inférieur ou égal
                        query[filter.field] = { $lte: Number(filter.value) || filter.value };
                        break;
                    default: // Par défaut, recherche "contient"
                        query[filter.field] = { $regex: filter.value, $options: 'i' };
                }
            });
        }

        // 3. Gestion du tri
        let sort = {};
        if (req.query.sortField) {
            sort[req.query.sortField] = req.query.sortDir === 'asc' ? 1 : -1;
        }

        // 4. Pagination
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const skip = (page - 1) * size;

        // 5. Exécution de la requête
        const students = await Student.find(query)
            .sort(sort)
            .skip(skip)
            .limit(size);

        const totalStudents = await Student.countDocuments(query);

        res.status(200).json({
            students,
            total: totalStudents,
            last_page: Math.ceil(totalStudents / size)
        });

    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ error: error.message });
    }
};
  
  // UPDATE : Mettre à jour un studente existant
  export const updateStudent = async (req, res) => {
    const { id } = req.params;
  
    // Liste des champs autorisés à être modifiés
    const allowedFields = [
      'firstname',
      'lastname',
      'email',
      'institution',
      'sector',
      'grade',
      'location',
      'zipcode'
    ];
  
    // On filtre uniquement les champs autorisés
    const updatedData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
  
    try {
      const student = await Student.findByIdAndUpdate(
        id,
        updatedData,
        { new: true, runValidators: true }
      );
  
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      res.status(200).json({ message: "Student updated successfully", student });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  
  
  // DELETE : Supprimer un studente
  export const deleteStudent = async (req, res) => {
    const { id } = req.params;
  
    try {
        // 1. Supprimer l'étudiant
        const student = await Student.findByIdAndDelete(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // 2. Retirer l'étudiant des groupes
        const result = await Group.updateMany(
            { students: id },
            { $pull: { students: id } }
        );
        
        console.log(`Étudiant retiré de ${result.modifiedCount} groupe(s).`);
  
        // 3. Réponse réussie
        res.status(200).json({ 
            success: true,
            message: "Student deleted successfully",
            deletedCount: 1,
            groupsUpdated: result.modifiedCount
        });
        
    } catch (error) {
        console.error("Erreur suppression étudiant:", error);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            details: error.message
        });
    }
};

  // Ajouter un groupe à un étudiant
  export const addGroupToStudent = async (req, res) => {
    const studentId = req.params.id;
    const { groupId } = req.body;
  
    console.log("Étudiant ID :", studentId);
    console.log("Group ID :", groupId);
  
    try {
      const student = await Student.findById(studentId);
      console.log("Étudiant trouvé :", student);
  
      if (!student.group.includes(groupId)) {
        student.group.push(groupId);
        console.log("Groupe ajouté :", groupId);
        await student.save();
      }
  
      res.status(200).json({
        message: "Groupe ajouté avec succès.",
        student,
      });
    } catch (error) {
      console.error("Erreur :", error.message);
      res.status(500).json({
        message: "Erreur lors de l'ajout du groupe.",
        error: error.message,
      });
    }
  };
  
  export const deleteAllStudents = async (req, res) => {
    try {
      await Student.deleteMany(); // Supprime tous les documents de la collection
      res.status(200).json({ message: "All students deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting all students", error });
    }
  };

  export const getStudentNames = async (req, res) => {
    try {
      const { studentIds } = req.body;
      const students = await Student.find({ _id: { $in: studentIds } }, "_id firstname lastname").lean();
          
  
      const nameMap = students.reduce((acc, student) => {
        acc[student._id] =  student.firstname +' '+student.lastname;
        //console.log(acc)
        return acc;
      }, {});
  
      res.json(nameMap);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des noms des étudiants :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  };
  
  // Vérifier si un étudiant existe en fonction de son email
export const checkStudentExists = async (req, res) => {
  const { email } = req.query; // Récupérer l'email depuis la requête

  try {
    const studentExists = await Student.findOne({ email }); // Vérifier en base
    res.json({ exists: !!studentExists }); // Retourne true ou false
  } catch (error) {
    console.error("Error checking student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Étudiant non trouvé" });
    res.json(student);
  } catch (err) {
    console.error("❌ getStudentById error:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
