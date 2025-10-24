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

// Get semesters for a given date
router.get('/semesters/:date', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const Teacher = require('../models/Teacher');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    console.log('Teacher found:', teacher.teacherId, teacher.email);
    console.log('Teacher timetable:', teacher.timetable);

    // Get day of the week for the given date
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const givenDate = new Date(date);
    const dayOfWeek = daysOfWeek[givenDate.getDay()];
    console.log('Given date:', date, 'Day of week:', dayOfWeek);

    // Get timetable slots for that day
    const slots = teacher.timetable[dayOfWeek] || [];
    console.log('Slots for day:', slots);

    // Extract unique semesters
    const semesters = new Set();
    slots.forEach(slot => {
      if (slot.semester) {
        semesters.add(slot.semester);
      }
    });

    console.log('Semesters found:', Array.from(semesters));

    res.json({ semesters: Array.from(semesters) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get branches for a given date and semester
router.get('/branches/:date/:semester', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { date, semester } = req.params;
    const Teacher = require('../models/Teacher');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get day of the week for the given date
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const givenDate = new Date(date);
    const dayOfWeek = daysOfWeek[givenDate.getDay()];

    // Get timetable slots for that day and semester
    const slots = teacher.timetable[dayOfWeek] || [];
    const filteredSlots = slots.filter(slot => slot.semester === semester);

    // Extract unique branches
    const branches = new Set();
    filteredSlots.forEach(slot => {
      if (slot.Branch) {
        branches.add(slot.Branch);
      }
    });

    res.json({ branches: Array.from(branches) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sections for a given date, semester, and branch
router.get('/sections/:date/:semester/:branch', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { date, semester, branch } = req.params;
    const Teacher = require('../models/Teacher');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get day of the week for the given date
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const givenDate = new Date(date);
    const dayOfWeek = daysOfWeek[givenDate.getDay()];

    // Get timetable slots for that day, semester, and branch
    const slots = teacher.timetable[dayOfWeek] || [];
    const filteredSlots = slots.filter(slot => slot.semester === semester && slot.Branch === branch);

    // Extract unique sections
    const sections = new Set();
    filteredSlots.forEach(slot => {
      if (slot.Section) {
        sections.add(slot.Section);
      }
    });

    res.json({ sections: Array.from(sections) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get subjects for a given date, semester, branch, and section
router.get('/subjects/:date/:semester/:branch/:section', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { date, semester, branch, section } = req.params;
    const Teacher = require('../models/Teacher');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get day of the week for the given date
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const givenDate = new Date(date);
    const dayOfWeek = daysOfWeek[givenDate.getDay()];

    // Get timetable slots for that day, semester, branch, and section
    const slots = teacher.timetable[dayOfWeek] || [];
    const filteredSlots = slots.filter(slot => slot.semester === semester && slot.Branch === branch && slot.Section === section);

    // Extract unique subjects
    const subjects = new Set();
    filteredSlots.forEach(slot => {
      if (slot.subject) {
        subjects.add(slot.subject);
      }
    });

    res.json({ subjects: Array.from(subjects) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get batch for a given date, semester, branch, section, and subject
router.get('/batch/:date/:semester/:branch/:section/:subject', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { date, semester, branch, section, subject } = req.params;
    const Teacher = require('../models/Teacher');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get day of the week for the given date
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const givenDate = new Date(date);
    const dayOfWeek = daysOfWeek[givenDate.getDay()];

    // Get timetable slots for that day, semester, branch, section, and subject
    const slots = teacher.timetable[dayOfWeek] || [];
    const filteredSlots = slots.filter(slot => slot.semester === semester && slot.Branch === branch && slot.Section === section && slot.subject === subject);

    // Get the batch from the first matching slot (assuming all slots for the same subject have the same batch)
    let batch = '';
    if (filteredSlots.length > 0 && filteredSlots[0].batches) {
      batch = filteredSlots[0].batches;
    }

    res.json({ batch });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher's available options for exam creation (legacy endpoint)
router.get('/exam-options', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const Student = require('../models/Student');

    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get current day of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = daysOfWeek[today.getDay()];

    // Get today's timetable slots
    const todaySlots = teacher.timetable[currentDay] || [];

    // Extract unique branches, sections, and subjects
    const branches = new Set();
    const sectionsByBranch = {};
    const subjectsByBranchSection = {};

    todaySlots.forEach(slot => {
      if (slot.Branch && slot.Section) {
        branches.add(slot.Branch);

        if (!sectionsByBranch[slot.Branch]) {
          sectionsByBranch[slot.Branch] = new Set();
        }
        sectionsByBranch[slot.Branch].add(slot.Section);

        const key = `${slot.Branch}-${slot.Section}`;
        if (!subjectsByBranchSection[key]) {
          subjectsByBranchSection[key] = new Set();
        }
        subjectsByBranchSection[key].add(slot.subject);
      }
    });

    // Convert sets to arrays
    const branchList = Array.from(branches);
    const sectionList = {};
    Object.keys(sectionsByBranch).forEach(branch => {
      sectionList[branch] = Array.from(sectionsByBranch[branch]);
    });
    const subjectList = {};
    Object.keys(subjectsByBranchSection).forEach(key => {
      subjectList[key] = Array.from(subjectsByBranchSection[key]);
    });

    res.json({
      branches: branchList,
      sections: sectionList,
      subjects: subjectList
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/students-count/:batch/:branch/:section', authMiddleware, teacherAuth, async (req, res) => {
   try {
    const { batch, branch, section } = req.params;

    const count = await Student.countDocuments({ batch, branch, section });
     res.json({ count });
   } catch (error) {
     res.status(500).json({ message: 'Server error', error: error.message });
   }
});
// Create Exam
router.post('/exam/create', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examName, semester, branch, section, subject, batch, numberOfStudents, scheduledDate, scheduledTime, duration } = req.body;

    const exam = new Exam({
      examName,
      semester,
      branch,
      section,
      subject,
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
