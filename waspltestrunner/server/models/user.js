import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true, // Indique si ce champ est obligatoire
    trim: true
  },
  lastName: { 
    type: String, 
    required: true, // Indique si ce champ est obligatoire
    trim: true
  },
  sid: { 
    type: String, 
    required: true, // Indique si ce champ est obligatoire
    unique: true, // Garantit que le SID est unique pour chaque utilisateur
    trim: true
  },
  lastConnection: { 
    type: Date,
    default: null
  },
  answer: { 
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
