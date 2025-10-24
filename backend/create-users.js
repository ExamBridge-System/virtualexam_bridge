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

    // Extract unique branch-sections from timetable
    const branchSection = [];

    const hashedPassword = await bcrypt.hash('T001', 10);

    const teacherData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      teacherId: 'T001',
      department: 'Computer Science',
      branchSection,
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
      const studentHashedPassword = await bcrypt.hash(studentData.rollNumber, 10);
      await Student.updateOne(
        { email: studentData.email },
        { $set: { ...studentData, password: studentHashedPassword } },
        { upsert: true }
      );
      console.log(`✅ Student ${studentData.name} created or updated`);
    }

    // Create super admin
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    await Student.updateOne(
      { email: 'admin@example.com' },
      {
        $set: {
          name: 'Super Admin',
          email: 'admin@example.com',
          password: adminHashedPassword,
          rollNumber: 'ADMIN001',
          class: 'Admin',
          batch: 'Admin',
          branch: 'Admin',
          section: 'Admin',
          semester: 'Admin',
        }
      },
      { upsert: true }
    );
    console.log('✅ Admin created or updated');

    const updatedTeacher = await Teacher.findOne({ email: 'john@example.com' });
    if (updatedTeacher) {
      console.log('Teacher created successfully');
    } else {
      console.log('Teacher not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createOrUpdateTeacher();
