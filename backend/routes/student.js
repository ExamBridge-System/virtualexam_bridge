const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Exam = require('../models/Exam');
const StudentExam = require('../models/StudentExam');
const Question = require('../models/Question');
const Student = require('../models/Student');
const DistributionUsage = require('../models/DistributionUsage');
const { authMiddleware, studentAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/screenshots');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Helper function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Weighted random selection for distributions with more aggressive weighting
const weightedRandomDistribution = (distributions) => {
  // Use squared weighting for more aggressive bias reduction
  const weights = distributions.map(d => 1 / Math.pow(d.usageCount + 1, 2));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < distributions.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return distributions[i];
  }
};

// Weighted random selection for questions with more aggressive weighting
const weightedRandomSelect = (questions, count) => {
  const result = [];
  const availableQuestions = [...questions];

  for (let i = 0; i < count; i++) {
    if (availableQuestions.length === 0) break;

    // Use squared weighting for more aggressive bias reduction
    const weights = availableQuestions.map(q => 1 / Math.pow(q.usageCount + 1, 2));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;

    for (let j = 0; j < availableQuestions.length; j++) {
      rand -= weights[j];
      if (rand <= 0) {
        result.push(availableQuestions[j]);
        availableQuestions.splice(j, 1);
        break;
      }
    }
  }

  return result;
};

// Get available exams for student's class
router.get('/exams', authMiddleware, studentAuth, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findById(req.user.id);

    const exams = await Exam.find({
      $and: [
        { branch: student.branch },
        { section: student.section },
        {
          $or: [
            { batch: { $exists: false } },
            { batch: null },
            { batch: student.batch }
          ]
        }
      ]
    }).sort({ scheduledDate: -1 });

    res.json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if student can access exam
router.get('/exam/:examId/access', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const Student = require('../models/Student');
    const student = await Student.findById(req.user.id);

    if ((exam.branch !== student.branch || exam.section !== student.section) || (exam.batch && exam.batch !== student.batch)) {
      return res.status(403).json({ message: 'Not enrolled in this class or batch' });
    }

    // Use current date for schedule check, ensuring consistency
    const examDateTime = new Date(`${exam.scheduledDate.toISOString().split('T')[0]}T${exam.scheduledTime}`);
    const currentTime = new Date();
    const examEndTime = new Date(examDateTime.getTime() + exam.duration * 60000);

    const canAccess = currentTime >= examDateTime && currentTime <= examEndTime;

    res.json({ 
      canAccess, 
      examDateTime: examDateTime.toISOString(),
      currentTime: currentTime.toISOString(),
      examEndTime: examEndTime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate question set for student with RANDOM distribution
router.post('/exam/:examId/generate-set', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    // Check if set already generated
    let studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (studentExam && studentExam.setGenerated) {
      return res.json({
        message: 'Set already generated',
        questions: studentExam.assignedQuestions
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get all questions by level, sorted by usageCount ascending (least used first)
    const easyQuestions = await Question.find({ examId, level: 'easy' }).sort({ usageCount: 1 });
    const mediumQuestions = await Question.find({ examId, level: 'medium' }).sort({ usageCount: 1 });
    const hardQuestions = await Question.find({ examId, level: 'hard' }).sort({ usageCount: 1 });

    // Get counts
    const easyCount = easyQuestions.length;
    const mediumCount = mediumQuestions.length;
    const hardCount = hardQuestions.length;

    // Fetch usage stats for distributions
    const usageData = await DistributionUsage.find({ examId });
    const usageMap = {};
    usageData.forEach(d => usageMap[d.type] = d.usageCount || 0);

    // Define possible random distributions with usage counts
    const distributions = [
      { easy: 3, medium: 0, hard: 0, desc: '3 Easy', usageCount: usageMap['3 Easy'] || 0 },
      { easy: 1, medium: 1, hard: 0, desc: '1 Easy, 1 Medium', usageCount: usageMap['1 Easy, 1 Medium'] || 0 },
      { easy: 0, medium: 0, hard: 1, desc: '1 Hard', usageCount: usageMap['1 Hard'] || 0 }
    ];

    // Use weighted random selection for distributions
    const selectedDistribution = weightedRandomDistribution(distributions);

    // Update usage count for selected distribution
    await DistributionUsage.updateOne(
      { examId, type: selectedDistribution.desc },
      { $inc: { usageCount: 1 } },
      { upsert: true }
    );

    if (!selectedDistribution) {
      return res.status(400).json({ message: 'Not enough questions available to generate a valid set. Please ensure there are sufficient questions in the required levels.' });
    }

    const selectedQuestions = [];

    // Select easy questions using weighted random selection
    const easySelection = weightedRandomSelect(easyQuestions, selectedDistribution.easy);
    easySelection.forEach(q => {
      selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
      });
      // Increment usage count
      q.usageCount += 1;
      q.save();
    });

    // Select medium questions using weighted random selection
    const mediumSelection = weightedRandomSelect(mediumQuestions, selectedDistribution.medium);
    mediumSelection.forEach(q => {
      selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
      });
      // Increment usage count
      q.usageCount += 1;
      q.save();
    });

    // Select hard questions using weighted random selection
    const hardSelection = weightedRandomSelect(hardQuestions, selectedDistribution.hard);
    hardSelection.forEach(q => {
      selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
      });
      // Increment usage count
      q.usageCount += 1;
      q.save();
    });

    // Ensure at least one question was selected. This prevents a silent failure if
    // the chosen random distribution cannot be met by the available questions.
    if (selectedQuestions.length === 0) {
        return res.status(400).json({ message: 'Not enough questions available in the pool to generate a set.' });
    }

    // Shuffle the final selected questions so they're not ordered by difficulty
    const finalQuestions = shuffleArray(selectedQuestions);

    if (!studentExam) {
      studentExam = new StudentExam({
        studentId: req.user.id,
        examId: examId,
        assignedQuestions: finalQuestions,
        setGenerated: true,
        startedAt: new Date(),
        status: 'in_progress',
        screenshots: [], // Initialize screenshots array
      });
    } else {
      studentExam.assignedQuestions = finalQuestions;
      studentExam.setGenerated = true;
      studentExam.startedAt = new Date();
      studentExam.status = 'in_progress';
      studentExam.screenshots = studentExam.screenshots || []; // Ensure initialized
    }

    await studentExam.save();

    res.json({
      message: 'Question set generated successfully',
      questions: finalQuestions
    });
  } catch (error) {
    console.error('Error generating question set:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's assigned questions
router.get('/exam/:examId/questions', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam || !studentExam.setGenerated) {
      return res.status(404).json({ message: 'No question set generated yet' });
    }

    res.json({ questions: studentExam.assignedQuestions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload screenshot for a specific question
router.post('/exam/:examId/question/:questionId/upload', authMiddleware, studentAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam) {
      return res.status(404).json({ message: 'Exam not started' });
    }

    // Check if question is assigned to this student
    const questionAssigned = studentExam.assignedQuestions.some(q => q.questionId.toString() === questionId);
    if (!questionAssigned) {
      return res.status(403).json({ message: 'Question not assigned to you' });
    }

    // Ensure studentExam.screenshots is an array before pushing
    if (!studentExam.screenshots) {
        studentExam.screenshots = [];
    }

    studentExam.screenshots.push({
      questionId: questionId,
      filename: req.file.filename,
      path: req.file.path,
    });

    await studentExam.save();

    res.json({
      message: 'Screenshot uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete screenshot for a specific question
router.delete('/exam/:examId/question/:questionId/screenshot/:filename', authMiddleware, studentAuth, async (req, res) => {
    try {
        const { examId, questionId, filename } = req.params;

        const studentExam = await StudentExam.findOne({
            studentId: req.user.id,
            examId: examId,
        });

        if (!studentExam) {
            return res.status(404).json({ message: 'Exam not started' });
        }

        const screenshotIndex = studentExam.screenshots.findIndex(s => s.filename === filename && s.questionId.toString() === questionId);

        if (screenshotIndex === -1) {
            return res.status(404).json({ message: 'Screenshot not found for this question' });
        }

        // Remove the file from the filesystem first (optional, but good practice)
        const fileToRemove = studentExam.screenshots[screenshotIndex];
        if (fileToRemove.path && fs.existsSync(fileToRemove.path)) {
            fs.unlinkSync(fileToRemove.path);
        }

        // Remove the entry from the database array
        studentExam.screenshots.splice(screenshotIndex, 1);
        await studentExam.save();

        res.json({ message: 'Screenshot removed successfully' });

    } catch (error) {
        console.error('Error deleting screenshot:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Submit exam
router.post('/exam/:examId/submit', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam) {
      return res.status(404).json({ message: 'Exam not started' });
    }
    
    if (studentExam.status === 'submitted') {
        return res.status(400).json({ message: 'Exam already submitted' });
    }

    studentExam.status = 'submitted';
    studentExam.submittedAt = new Date();

    await studentExam.save();

    res.json({ message: 'Exam submitted successfully' });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's exam status (and uploaded screenshots)
router.get('/exam/:examId/status', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam) {
      return res.json({ status: 'not_started', setGenerated: false, uploadedScreenshots: {} });
    }

    // Group screenshots by questionId
    const uploadedScreenshots = {};
    studentExam.screenshots.forEach(screenshot => {
      if (screenshot.questionId) {
        const qId = screenshot.questionId.toString();
        if (!uploadedScreenshots[qId]) {
          uploadedScreenshots[qId] = [];
        }
        uploadedScreenshots[qId].push(screenshot.filename);
      }
    });

    res.json({
      status: studentExam.status,
      setGenerated: studentExam.setGenerated,
      uploadedScreenshots: uploadedScreenshots,
    });
  } catch (error) {
    console.error('Error getting exam status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send verification code to new email
router.post('/send-verification-code', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }

    // Check if email is already taken by another student
    const existingStudent = await Student.findOne({ email: newEmail });
    if (existingStudent && existingStudent._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Email already in use by another student' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code temporarily (in production, use Redis or database)
    // For now, we'll store in memory - in production, use proper storage
    global.emailVerificationCodes = global.emailVerificationCodes || {};
    global.emailVerificationCodes[newEmail] = {
      code: verificationCode,
      studentId: req.user.id,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    // Log the verification code for server-side testing/debugging
    console.log(`Verification code for ${newEmail}: ${verificationCode}`);

    // ----------------------------------------------------
    // FIX: UNCOMMENTED AND CLEANED UP EMAIL SENDING BLOCK
    // ----------------------------------------------------
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email from .env
      to: newEmail, // Recipient email from request body
      subject: 'Email Verification Code - Virtual Exam Bridge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>You requested to change your email address in Virtual Exam Bridge.</p>
          <p>Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this change, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    // ----------------------------------------------------

    res.json({ message: 'Verification code sent to your new email address' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Failed to send verification code', error: error.message });
  }
});

// Verify code and update email
router.post('/verify-email', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { newEmail, code } = req.body;

    if (!newEmail || !code) {
      return res.status(400).json({ message: 'New email and verification code are required' });
    }

    // Check if code exists and is valid
    if (!global.emailVerificationCodes || !global.emailVerificationCodes[newEmail]) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    const verificationData = global.emailVerificationCodes[newEmail];

    if (verificationData.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Verification code not for this user' });
    }

    if (Date.now() > verificationData.expiresAt) {
      delete global.emailVerificationCodes[newEmail];
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (verificationData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Update student's email
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.email = newEmail;
    await student.save();

    // Clean up verification code
    delete global.emailVerificationCodes[newEmail];

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Failed to verify email', error: error.message });
  }
});

module.exports = router;
