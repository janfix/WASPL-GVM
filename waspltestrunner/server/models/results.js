import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentFirstname: { type: String },
  studentLastname: { type: String },

  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  testTitle: { type: String },

  publicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true },
  publicationName: { type: String },

  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  groupName: { type: String },

  responses: { type: Array, required: true },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Result', resultSchema);

