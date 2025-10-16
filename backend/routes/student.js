const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Exam = require('../models/Exam');
const StudentExam = require('../models/StudentExam');
const Question = require('../models/Question');
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

// Get available exams for student's class
router.get('/exams', authMiddleware, studentAuth, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findById(req.user.id);
    
    const currentDate = new Date();
    const exams = await Exam.find({ 
      class: student.class,
      status: { $in: ['scheduled', 'active'] }
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

    if (exam.class !== student.class) {
      return res.status(403).json({ message: 'Not enrolled in this class' });
    }

    // Check if exam already submitted
    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (studentExam && studentExam.status === 'submitted') {
      return res.status(403).json({ message: 'Exam already submitted. You cannot access it again.' });
    }

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

// Generate question set for student
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

    // Get all questions by level
    const easyQuestions = await Question.find({ examId, level: 'easy' });
    const mediumQuestions = await Question.find({ examId, level: 'medium' });
    const hardQuestions = await Question.find({ examId, level: 'hard' });

    // Shuffle and select questions based on distribution
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const selectedQuestions = [];
    
    // Select easy questions
    const shuffledEasy = shuffleArray([...easyQuestions]);
    for (let i = 0; i < exam.questionsPerSet.easy && i < shuffledEasy.length; i++) {
      selectedQuestions.push({
        questionId: shuffledEasy[i]._id,
        questionText: shuffledEasy[i].questionText,
        level: shuffledEasy[i].level,
      });
    }

    // Select medium questions
    const shuffledMedium = shuffleArray([...mediumQuestions]);
    for (let i = 0; i < exam.questionsPerSet.medium && i < shuffledMedium.length; i++) {
      selectedQuestions.push({
        questionId: shuffledMedium[i]._id,
        questionText: shuffledMedium[i].questionText,
        level: shuffledMedium[i].level,
      });
    }

    // Select hard questions
    const shuffledHard = shuffleArray([...hardQuestions]);
    for (let i = 0; i < exam.questionsPerSet.hard && i < shuffledHard.length; i++) {
      selectedQuestions.push({
        questionId: shuffledHard[i]._id,
        questionText: shuffledHard[i].questionText,
        level: shuffledHard[i].level,
      });
    }

    if (!studentExam) {
      studentExam = new StudentExam({
        studentId: req.user.id,
        examId: examId,
        assignedQuestions: selectedQuestions,
        setGenerated: true,
        startedAt: new Date(),
        status: 'in_progress',
      });
    } else {
      studentExam.assignedQuestions = selectedQuestions;
      studentExam.setGenerated = true;
      studentExam.startedAt = new Date();
      studentExam.status = 'in_progress';
    }

    await studentExam.save();

    res.json({ 
      message: 'Question set generated successfully', 
      questions: selectedQuestions 
    });
  } catch (error) {
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

// Upload screenshot
router.post('/exam/:examId/upload', authMiddleware, studentAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { examId } = req.params;

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

    if (studentExam.status === 'submitted') {
      return res.status(403).json({ message: 'Cannot upload screenshots after submission' });
    }

    studentExam.screenshots.push({
      filename: req.file.filename,
      path: req.file.path,
    });

    await studentExam.save();

    res.json({
      message: 'Screenshot uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove screenshot
router.delete('/exam/:examId/screenshot/:filename', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId, filename } = req.params;

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam) {
      return res.status(404).json({ message: 'Exam not started' });
    }

    if (studentExam.status === 'submitted') {
      return res.status(403).json({ message: 'Cannot remove screenshots after submission' });
    }

    // Find and remove the screenshot
    const screenshotIndex = studentExam.screenshots.findIndex(s => s.filename === filename);
    if (screenshotIndex === -1) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }

    const screenshot = studentExam.screenshots[screenshotIndex];

    // Remove from filesystem
    if (fs.existsSync(screenshot.path)) {
      fs.unlinkSync(screenshot.path);
    }

    // Remove from database
    studentExam.screenshots.splice(screenshotIndex, 1);
    await studentExam.save();

    res.json({ message: 'Screenshot removed successfully' });
  } catch (error) {
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

    studentExam.status = 'submitted';
    studentExam.submittedAt = new Date();

    await studentExam.save();

    res.json({ message: 'Exam submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's exam status
router.get('/exam/:examId/status', authMiddleware, studentAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const studentExam = await StudentExam.findOne({
      studentId: req.user.id,
      examId: examId,
    });

    if (!studentExam) {
      return res.json({ status: 'not_started', setGenerated: false });
    }

    res.json({ 
      status: studentExam.status,
      setGenerated: studentExam.setGenerated,
      screenshotsCount: studentExam.screenshots.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;