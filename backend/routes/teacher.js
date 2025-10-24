const express = require('express');
const nodemailer = require('nodemailer');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentExam = require('../models/StudentExam');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { authMiddleware, teacherAuth } = require('../middleware/auth');

const router = express.Router();

// Configure nodemailer transporter (uses EMAIL_USER/EMAIL_PASS in .env)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Get teacher's classes
router.get('/classes', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(req.user.id);
    res.json({ classes: teacher.classes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Exam
router.post('/exam/create', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examName, class: examClass, batch, numberOfStudents, scheduledDate, scheduledTime, duration } = req.body;

    const exam = new Exam({
      examName,
      class: examClass,
      batch: batch || undefined,
      teacherId: req.user.id,
      numberOfStudents,
      scheduledDate,
      scheduledTime,
      duration,
    });

    await exam.save();
    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Question to Exam
router.post('/exam/:examId/question', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { questionText, level } = req.body;
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const question = new Question({
      examId,
      questionText,
      level,
    });

    await question.save();
    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all questions for an exam
router.get('/exam/:examId/questions', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const questions = await Question.find({ examId });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all exams by teacher
router.get('/exams', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const exams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 });
    res.json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Delete an exam
router.delete('/exam/:examId', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Only the teacher who created the exam can delete it
    if (exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Exam.findByIdAndDelete(examId);

    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student submissions for an exam
router.get('/exam/:examId/submissions', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam || exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submissions = await StudentExam.find({ examId })
      .populate('studentId', 'name rollNumber email')
      .populate('assignedQuestions.questionId');

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific student submission details
router.get('/submission/:submissionId', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await StudentExam.findById(submissionId)
      .populate('studentId', 'name rollNumber email class')
      .populate('examId', 'examName class scheduledDate')
      .populate('assignedQuestions.questionId')
      .populate('screenshots.questionId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const exam = await Exam.findById(submission.examId);
    if (exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =====================
// Teacher: Email Change Routes
// =====================

// Send verification code to new email (teacher)
router.post('/send-verification-code', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'New email is required' });

    // Check if email already exists among teachers or students
    const existingTeacher = await Teacher.findOne({ email: newEmail });
    const existingStudent = await Student.findOne({ email: newEmail });
    if ((existingTeacher && existingTeacher._id.toString() !== req.user.id) || existingStudent) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    global.emailVerificationCodes = global.emailVerificationCodes || {};
    global.emailVerificationCodes[newEmail] = {
      code: verificationCode,
      teacherId: req.user.id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newEmail,
      subject: 'Email Verification Code - Virtual Exam Bridge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Teacher email verification code for ${newEmail}: ${verificationCode}`);

    res.json({ message: 'Verification code sent to your new email address' });
  } catch (error) {
    console.error('Error sending verification code (teacher):', error);
    res.status(500).json({ message: 'Failed to send verification code', error: error.message });
  }
});

// Verify code and update teacher email
router.post('/verify-email', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { newEmail, code } = req.body;
    if (!newEmail || !code) return res.status(400).json({ message: 'New email and code are required' });

    if (!global.emailVerificationCodes || !global.emailVerificationCodes[newEmail]) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    const verificationData = global.emailVerificationCodes[newEmail];
    if (verificationData.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Verification code not for this user' });
    }
    if (Date.now() > verificationData.expiresAt) {
      delete global.emailVerificationCodes[newEmail];
      return res.status(400).json({ message: 'Verification code has expired' });
    }
    if (verificationData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    teacher.email = newEmail;
    await teacher.save();

    delete global.emailVerificationCodes[newEmail];

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error verifying teacher email:', error);
    res.status(500).json({ message: 'Failed to verify email', error: error.message });
  }
});

module.exports = router;
