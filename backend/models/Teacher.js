const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  classes: [{
    type: String,
  }],
  timetable: {
    type: Object, // { Monday: [{ time: '9:00–10:00', subject: 'SUB-1', type: 'class' }, { time: '10:00–11:00', subject: 'LAB-A', type: 'lab', batch: 'B1' }, ...], ... }
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Teacher', teacherSchema);