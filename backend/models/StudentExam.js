const mongoose = require('mongoose');

const studentExamSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  assignedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    questionText: String,
    level: String,
  }],
  screenshots: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted'],
    default: 'not_started',
  },
  startedAt: {
    type: Date,
  },
  submittedAt: {
    type: Date,
  },
  setGenerated: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('StudentExam', studentExamSchema);