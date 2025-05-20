import Group from "../models/groupModel.js";
import Student from "../models/studentModel.js";

// Endpoint : Importer un groupe et ses étudiants
export const importGroupWithStudents = async (req, res) => {
  const { groupName, description, students, institution, location, zipCode, grade, sector } = req.body;

  try {
    let group = await Group.findOne({ groupName, owner: req.user._id });
    if (!group) {
      group = await Group.create({
        groupName,
        description,
        institution,
        location,
        zipCode,
        grade,
        sector,
        owner: req.user._id,
        students: []
      });
    }

    const studentIds = [];
    for (const studentData of students) {
      let student = await Student.findOne({ email: studentData.email });
      if (!student) {
        student = await Student.create(studentData);
      }
      studentIds.push(student._id);
    }

    group.students = [...new Set([...group.students, ...studentIds])];
    await group.save();

    res.status(200).json({ message: "Group and students imported successfully", group });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const newGroup = async (req, res) => {
  try {
    const { groupName, description, institution, location, zipCode, grade, sector } = req.body;

    if (!groupName || !institution) {
      return res.status(400).json({ message: "Group Name and Institution are required." });
    }

    const group = await Group.create({
      groupName,
      description,
      institution,
      location,
      zipCode,
      grade,
      sector,
      owner: req.user._id
    });

    res.status(201).json({
      message: "Group created successfully!",
      group,
    });
  } catch (error) {
    console.error("Erreur lors de la création du groupe :", error.message);
    res.status(500).json({ message: "Failed to create group." });
  }
};

export const createGroup = async (req, res) => {
  const { groupName, description, students, institution, location, zipCode, grade, sector } = req.body;

  try {
    const studentIds = students.map((student) =>
      typeof student === "string" ? student : student._id
    );

    const group = await Group.create({
      groupName,
      description,
      institution,
      location,
      zipCode,
      grade,
      sector,
      students: studentIds,
      owner: req.user._id
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    console.error("Erreur lors de la création du groupe :", error.message);
    res.status(400).json({ error: error.message });
  }
};

export const getGroups = async (req, res) => {
  console.log("REQ.USER =", req.user);
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const sortField = req.query.sortField || null;
  const sortDir = req.query.sortDir || 'asc';
  const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
  const headerFilters = req.query.headerFilters ? JSON.parse(req.query.headerFilters) : [];

  try {
    let query = { owner: req.user._id };

    filters.forEach(filter => {
      query[filter.field] = { $regex: filter.value, $options: "i" };
    });

    headerFilters.forEach(filter => {
      switch (filter.type) {
        case '=':
          query[filter.field] = filter.value;
          break;
        case '!=':
          query[filter.field] = { $ne: filter.value };
          break;
        case 'like':
          query[filter.field] = { $regex: filter.value, $options: "i" };
          break;
        case '>':
          query[filter.field] = { $gt: filter.value };
          break;
        case '<':
          query[filter.field] = { $lt: filter.value };
          break;
        case '>=':
          query[filter.field] = { $gte: filter.value };
          break;
        case '<=':
          query[filter.field] = { $lte: filter.value };
          break;
        default:
          query[filter.field] = { $regex: filter.value, $options: "i" };
      }
    });

    let sortQuery = {};
    if (sortField) {
      sortQuery[sortField] = sortDir === 'asc' ? 1 : -1;
    }

    const totalGroups = await Group.countDocuments(query);
    const groups = await Group.find(query)
      .sort(sortQuery)
      .skip((page - 1) * size)
      .limit(size);

    res.status(200).json({
      groups,
      total: totalGroups,
      last_page: Math.ceil(totalGroups / size)
    });

  } catch (error) {
    console.error("Erreur dans getGroups:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const group = await Group.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(403).json({ message: "Group not found or access denied." });
    }

    res.status(200).json({ message: "Group updated successfully", group });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await Group.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!group) {
      return res.status(403).json({ message: "Group not found or access denied." });
    }

    res.status(200).json({ message: "Group deleted successfully", group });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addStudentsToGroup = async (req, res) => {
  const groupId = req.params.id;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || !groupId) {
    return res.status(400).json({ message: "Requête invalide : id ou liste manquante" });
  }

  try {
    const group = await Group.findOne({ _id: groupId, owner: req.user._id });
    if (!group) {
      return res.status(404).json({ message: "Groupe non trouvé ou accès refusé." });
    }

    const alreadyInGroup = studentIds.filter(id => group.students.includes(id));
    const toAdd = studentIds.filter(id => !group.students.includes(id));

    await Group.findByIdAndUpdate(groupId, {
      $addToSet: { students: { $each: toAdd } },
    });

    await Student.updateMany(
      { _id: { $in: toAdd } },
      { $addToSet: { group: groupId } }
    );

    res.status(200).json({
      message: "Ajout terminé.",
      added: toAdd.length,
      alreadyPresent: alreadyInGroup.length,
      totalRequested: studentIds.length,
    });
  } catch (error) {
    console.error("❌ Erreur ajout étudiants au groupe :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'ajout des étudiants au groupe." });
  }
};

export const removeStudentFromGroup = async (req, res) => {
  const { studentId, groupId } = req.body;

  if (!studentId || !groupId) {
    return res.status(400).json({ error: "studentId et groupId sont requis" });
  }

  try {
    const group = await Group.findOne({ _id: groupId, owner: req.user._id });
    if (!group) {
      return res.status(403).json({ error: "Groupe non trouvé ou accès refusé." });
    }

    await Student.findByIdAndUpdate(studentId, {
      $pull: { group: groupId }
    });

    await Group.findByIdAndUpdate(groupId, {
      $pull: { students: studentId }
    });

    res.status(200).json({ message: "Étudiant retiré du groupe avec succès." });
  } catch (err) {
    console.error("Erreur dans removeStudentFromGroup:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
export default {
  importGroupWithStudents,
  newGroup,
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  addStudentsToGroup,
  removeStudentFromGroup
};