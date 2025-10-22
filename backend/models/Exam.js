const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: false,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  numberOfStudents: {
    type: Number,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Exam', examSchema);