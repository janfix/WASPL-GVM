import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  publicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  responses: { type: Array, required: true },
  submittedAt: { type: Date, default: Date.now },

  // Champs dupliqués pour persistance
  studentFirstname: String,
  studentLastname: String,
  testTitle: String,
  groupName: String,
  publicationName: String,
});

export default mongoose.model('Result', resultSchema);
