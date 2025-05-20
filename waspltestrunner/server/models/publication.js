import mongoose from 'mongoose';

const publicationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicationName: {
    type: String,
    required: true,
    trim: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test', // Référence à la collection Test
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group', // Référence à la collection Group
    required: true,
  },
  startingDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  mode: {
    type: String,
    enum: ['exam', 'learning', 'live','custom'],
    required: false, //A mettre plus tard sur true!!! dev need
  },
  access: {
    type: String,
    enum: ['unique', 'multiple'],
    required: true,
  },
  institution: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  attempts: {
    type: Number,
    required: true
  },
  testMap:{
    type:Boolean,
    default : true
  },
  ctools:{ 
    type:Boolean,
    default : false
  },
  browsing:{
    type:String,
    required:true
  },
  submission:{
    type:String,
    required:true
  },
  leaveMessage: {
    type: String,
    trim: true,
  },
  readOnlyAnswer:{
    type:Boolean,
    required : false
  },
  reports: {
    studentReport: {
      type: Boolean,
      default: false,
    },
    groupReport: {
      type: Boolean,
      default: false,
    },
    statisticReport: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Publication = mongoose.model('Publication', publicationSchema);

export default Publication;
