const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const router = express.Router();

// Teacher Registration
router.post('/teacher/register', async (req, res) => {
  try {
    const { name, email, password, teacherId, department, branchSection, timetable } = req.body;

    let teacher = await Teacher.findOne({ email });
    if (teacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      teacherId,
      department,
      branchSection: branchSection || [],
      timetable: timetable || {},
    });

    await teacher.save();

    res.status(201).json({ message: 'Teacher registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher Login
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        branchSection: teacher.branchSection,
        role: 'teacher',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Registration
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, class: studentClass, batch } = req.body;

    let student = await Student.findOne({ email });
    if (student) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    student = new Student({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      class: studentClass,
      batch,
    });

    await student.save();

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unified Login for both Teacher and Student, with first-time login support
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = null;
    let role = null;

    // First, check if email is teacherId
    user = await Teacher.findOne({ teacherId: email });
    if (user) {
      role = 'teacher';
    } else {
      // Check if email is rollNumber
      user = await Student.findOne({ rollNumber: email });
      if (user) {
        role = user.email === 'admin@example.com' ? 'admin' : 'student';
      } else {
        // Check by email
        user = await Teacher.findOne({ email });
        if (user) {
          role = 'teacher';
        } else {
          user = await Student.findOne({ email });
          if (user) {
            role = user.email === 'admin@example.com' ? 'admin' : 'student';
          }
        }
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // For first-time login, if password === email, hash it
    let isMatch = true;
    if (password === email) {
      // First-time login
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    const userResponse = role === 'teacher' ? {
      id: user._id,
      name: user.name,
      email: user.email,
      teacherId: user.teacherId,
      department: user.department,
      branchSection: user.branchSection,
      timetable: user.timetable,
      role: 'teacher',
    } : role === 'admin' ? {
      id: user._id,
      name: user.name,
      email: user.email,
      role: 'admin',
    } : {
      id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      class: user.class,
      batch: user.batch,
      branch: user.branch,
      section: user.section,
      semester: user.semester,
      role: 'student',
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Login (keeping for backward compatibility if needed)
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        class: student.class,
        batch: student.batch,
        role: 'student',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
