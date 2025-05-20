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
  access: {
    type: String,
    enum: ['unique', 'multiple'],
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  leaveMessage: {
    type: String,
    trim: true,
  },
  attempts: {
    type: Number,
    required: true
  },
  mode:{
    type:String,
    required:true
  },
  submission:{
    type:String,
    required:false
  },
  browsing:{
    type:String,
    required:true
  },
  institution:{
    type:String,
    required:true
  },
  readOnlyAnswer:{
    type:Boolean,
    required : false
  },
  revealQuestionNB:{
    type:Boolean,
    required : false
  },
  attemptLimit:{
    type:Number,
    required : false
  },
  shuffleQuestions : {
    type:Boolean,
    required : false
  },
  shufflePages : {
    type:Boolean,
    required : false
  },
  directScore_FB : {
    type:Boolean,
    required : false
  },
  timeLimit:{
    type:Boolean,
    required : false
  },
  skip:{
    type:Boolean,
    required : false
  },
  AICorr:{
    type:Boolean,
    required : false
  },
  testMap:{
    type:Boolean,
    default : true
  },
  ctools:{ 
    type:Boolean,
    default : false
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
