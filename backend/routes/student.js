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

// Helper function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get available exams for student's class
router.get('/exams', authMiddleware, studentAuth, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findById(req.user.id);
    
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

    // Get all questions by level
    const easyQuestions = await Question.find({ examId, level: 'easy' });
    const mediumQuestions = await Question.find({ examId, level: 'medium' });
    const hardQuestions = await Question.find({ examId, level: 'hard' });

    // --- FIX: Random distribution should be robust ---
    // Define possible random distributions
    const distributions = [
      { easy: 3, medium: 0, hard: 0, desc: '3 Easy' },
      { easy: 1, medium: 1, hard: 0, desc: '1 Easy, 1 Medium' },
      { easy: 0, medium: 0, hard: 1, desc: '1 Hard' }
    ];

    // Randomly select a distribution pattern
    const selectedDistribution = distributions[Math.floor(Math.random() * distributions.length)];

    const selectedQuestions = [];
    
    // Select easy questions
    // Use slice() on the shuffled array to safely select up to the requested count
    const shuffledEasy = shuffleArray(easyQuestions);
    const easySelection = shuffledEasy.slice(0, selectedDistribution.easy);
    easySelection.forEach(q => selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
    }));

    // Select medium questions
    const shuffledMedium = shuffleArray(mediumQuestions);
    const mediumSelection = shuffledMedium.slice(0, selectedDistribution.medium);
    mediumSelection.forEach(q => selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
    }));


    // Select hard questions
    const shuffledHard = shuffleArray(hardQuestions);
    const hardSelection = shuffledHard.slice(0, selectedDistribution.hard);
    hardSelection.forEach(q => selectedQuestions.push({
        questionId: q._id,
        questionText: q.questionText,
        level: q.level,
    }));
    // --- END FIX ---


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
    
    // Ensure studentExam.screenshots is an array before pushing
    if (!studentExam.screenshots) {
        studentExam.screenshots = [];
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
    console.error('Error uploading screenshot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete screenshot
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

        const screenshotIndex = studentExam.screenshots.findIndex(s => s.filename === filename);
        
        if (screenshotIndex === -1) {
            return res.status(404).json({ message: 'Screenshot not found' });
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
      return res.json({ status: 'not_started', setGenerated: false, uploadedScreenshots: [] });
    }

    // Return the list of filenames for the frontend to display
    const uploadedScreenshots = studentExam.screenshots.map(s => s.filename);

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

module.exports = router;