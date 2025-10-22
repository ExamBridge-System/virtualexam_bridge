require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');

async function createOrUpdateTeacher() {
  try {
    // Connect using the same config as server
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/internal-test-system';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const timetable = {
      Monday: [
        { time: '9:00–10:00', subject: 'SUB-1', type: 'class', class: 'IT-3' },
        { time: '10:00–11:00', subject: 'LAB-A', type: 'lab', batches: ['B1'], class: 'CSE-4' },
        { time: '11:00–12:00', subject: 'LAB-A', type: 'lab', batches: ['B1'], class: 'CSE-4' },
        { time: '1:00–2:00', subject: 'SUB-2', type: 'class', class: 'IT-2' },
        { time: '2:00–3:00', subject: 'SUB-3', type: 'class', class: 'IT-3' }
      ],
      Tuesday: [
        { time: '9:00–10:00', subject: 'SUB-4', type: 'class', class: 'CSE-4' },
        { time: '10:00–11:00', subject: 'LAB-A', type: 'lab', batches: ['B2'], class: 'CSE-4' },
        { time: '11:00–12:00', subject: 'LAB-A', type: 'lab', batches: ['B2'], class: 'CSE-4' },
        { time: '1:00–2:00', subject: 'SUB-1', type: 'class', class: 'IT-3' },
        { time: '2:00–3:00', subject: 'SUB-5', type: 'class', class: 'CSE-4' }
      ],
      Wednesday: [
        { time: '9:00–10:00', subject: 'SUB-2', type: 'class', class: 'IT-2' },
        { time: '10:00–11:00', subject: 'LAB-B', type: 'lab', batches: ['B1'], class: 'IT-2' },
        { time: '11:00–12:00', subject: 'LAB-B', type: 'lab', batches: ['B1'], class: 'IT-2' },
        { time: '1:00–2:00', subject: 'SUB-3', type: 'class', class: 'IT-3' },
        { time: '2:00–3:00', subject: 'SUB-4', type: 'class', class: 'CSE-4' }
      ],
      Thursday: [
        { time: '9:00–10:00', subject: 'SUB-5', type: 'class', class: 'CSE-4' },
        { time: '10:00–11:00', subject: 'LAB-B', type: 'lab', batches: ['B2'], class: 'IT-2' },
        { time: '11:00–12:00', subject: 'LAB-B', type: 'lab', batches: ['B2'], class: 'IT-2' },
        { time: '1:00–2:00', subject: 'SUB-1', type: 'class', class: 'IT-3' },
        { time: '2:00–3:00', subject: 'SUB-2', type: 'class', class: 'IT-2' },
        { time: '3:00–4:00', subject: 'SUB-3', type: 'class', class: 'IT-3' }
      ],
      Friday: [
        { time: '9:00–10:00', subject: 'LAB-C', type: 'lab', batches: ['B1'], class: 'IT-3' },
        { time: '10:00–11:00', subject: 'LAB-C', type: 'lab', batches: ['B1'], class: 'IT-3' },
        { time: '11:00–12:00', subject: 'SUB-4', type: 'class', class: 'CSE-4' },
        { time: '1:00–2:00', subject: 'SUB-5', type: 'class', class: 'IT-2' },
        { time: '2:00–3:00', subject: 'SUB-1', type: 'class', class: 'IT-3' }
      ]
    };

    const hashedPassword = await bcrypt.hash('password123', 10);

    const teacherData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      teacherId: 'T001',
      department: 'Computer Science',
      classes: ['IT-2', 'IT-3', 'CSE-4'],
      timetable,
    };

    await Teacher.updateOne(
      { email: 'john@example.com' },
      { $set: teacherData },
      { upsert: true }
    );
    console.log('✅ Teacher created or updated');

    // Create sample students
    const students = [
      { name: 'Alice Johnson', email: 'alice@example.com', rollNumber: 'IT2B1001', class: 'IT-2', batch: 'B1' },
      { name: 'Bob Smith', email: 'bob@example.com', rollNumber: 'IT2B2001', class: 'IT-2', batch: 'B2' },
      { name: 'Charlie Brown', email: 'charlie@example.com', rollNumber: 'IT3B1001', class: 'IT-3', batch: 'B1' },
      { name: 'Diana Prince', email: 'diana@example.com', rollNumber: 'CSE4B1001', class: 'CSE-4', batch: 'B1' },
      { name: 'Eve Wilson', email: 'eve@example.com', rollNumber: 'CSE4B2001', class: 'CSE-4', batch: 'B2' },
    ];

    for (const studentData of students) {
      const studentHashedPassword = await bcrypt.hash('password123', 10);
      await Student.updateOne(
        { email: studentData.email },
        { $set: { ...studentData, password: studentHashedPassword } },
        { upsert: true }
      );
      console.log(`✅ Student ${studentData.name} created or updated`);
    }

    const updatedTeacher = await Teacher.findOne({ email: 'john@example.com' });
    if (updatedTeacher) {
      console.log('Teacher timetable keys:', Object.keys(updatedTeacher.timetable));
      console.log('Wednesday slots:', updatedTeacher.timetable.Wednesday);
    } else {
      console.log('Teacher not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createOrUpdateTeacher();
