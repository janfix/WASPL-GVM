import mongoose, { version } from 'mongoose';

const PageSchema = new mongoose.Schema({
  id: String,
  label: String,
  children: [
    {
      id: String,
      label: String,
    },
  ],
  Randomized: Boolean,
});

const ElementSchema = new mongoose.Schema({
  el_ID: String,
  el_Type: String,
  el_Text: String,
  el_RichText: String,
  
  // Pour les interactions de type choice et choiceBlock
  options: [{
    id: String,
    text: String,
    isCorrect: Boolean,
    weight: Number,
  }],
  multiple: Boolean,
  
  dataInt: {},

  dimension: [
    {
      id: String,
      label: String,
      description: String
    }
  ],

  // Pour textGaps
  gaps: [{
    id: Number,
    label: String,
    weight: Number,
  }],
  el_GapsedText: String,
  
  // Pour order
  labels: [String],

  //AI Control
  AIisActivated: { type: Boolean, default: false },
  
  // Pour shortAnswer
  correctionAxes: [{
    axis: String,
    point: Number,
    penalty: Number,
  }],
  metadata: {
    Author :String,
    Institution: String,
    Created: String,
    LastModif: String,
    CreatedFrom: String,
    Version: String
  },
  // Champs communs
  maxScore: Number,
  feedback: {
    correct: String,
    incorrect: String,
  },
  tip: String,
  randomized: Boolean,
  isNewElement: Boolean,
  language: String,
  
  // Ajout d'un champ weight spécifique pour certaines interactions
  weight: Number
}, { 
  strict: false // Permet temporairement d'accepter des champs non définis
});


const TestSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ID: String,
  title: String,
  type: String,
  isNewElement: Boolean,
  version: String,
  language: String,
  navigation: String,
  progression: String,
  Description: String,
  Subject: String,
  location: String,
  ISCED : String,
  level: String,
  domain: String,
  duration: String,
  Keywords: [String],
  metadata: {
    Author :String,
    Institution: String,
    Created: String,
    LastModif: String,
    CreatedFrom: String,
    Version: String
  },
  pages: [PageSchema],
  elements: [ElementSchema],
  dimensions: [
    {
      _id: { type: String, required: true }, // UUID
      color: { type: String, default: '#ccc' },
      label: { type: String, required: true },
      description: { type: String, default: '' }
    }
  ],
  settings: Object,
}, { strict: true }
);

const Test = mongoose.model('Test', TestSchema);

export default Test;
