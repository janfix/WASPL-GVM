import mongoose from "mongoose";
const { Schema } = mongoose;

const ElementSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  el_ID: String,
  el_Label: String, // Nouveau champ pour le titre
  el_Type: String,
  el_Text: String,
  el_RichText: String,
  el_keywords: [String], // Tableau de mots-clés
  options: [
    {
      id: String,
      text: String,
      isCorrect: Boolean,
      weight: Number,
    },
  ],
  multiple: Boolean,
  gaps: [
    {
      id: Number,
      label: String,
      weight: Number,
    },
  ],
  el_GapsedText: String,
  labels: [String],
  el_InteractionData: {
    type: Schema.Types.Mixed, // ✅ Accepte tout type d'objet
    default: {}
  },
  correctionAxes: [
    {
      axis: String,
      point: Number,
      penalty: Number,
    },
  ],
  maxScore: Number,
  feedback: {
    correct: String,
    incorrect: String,
  },
  tip: String,
  randomized: Boolean,
  isNewElement: Boolean,
  language: String,
  weight: Number,
  metadata: {
    author :String,
    institution : String,
    created: String,
    lastModif: String,
    //createdFrom: String,
    subject: String,    
    domain : String,
    description:String,
    keywords: Array,
    ISCED : String,
    country : String,
    originalLanguage : String,
    translations: Array,
    multilingualItem: Boolean,
    license : String

  },
  param: Object, // Nouvel objet
  reportOption: Object, // Nouvel objet
});

export const Element = mongoose.model("Element", ElementSchema);
