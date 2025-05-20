import mongoose from "mongoose";

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true, // Le nom du groupe est obligatoire
    },
    description: {
      type: String,
      required: false,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student", // Référence au modèle Student
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Référence au manager qui a créé le groupe
      required: false,
    },
    institution: {
      type: String,
      required: false,
    },
    location : {
      type: String,
      required: false,
    },
    zipCode : {
      type: String,
      required: false,
      default:""
    },
    grade: {
      type: String, // Ex. "Classe de troisième", "Terminale"
      required: false,
      default:""
    },
    sector: {
      type: String, // Ex. "Scientifique", "Littéraire"
      required: false,
      default:""
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
