const express = require('express');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentExam = require('../models/StudentExam');
const { authMiddleware, teacherAuth } = require('../middleware/auth'); // Make sure this path is correct
const { stringify } = require('csv-stringify');

const router = express.Router();

// --- All routes here are prepended with /api/exam ---

// 1. Create Exam
// POST /api/exam/create
router.post('/create', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examName, semester, branch, section, subject, batch, numberOfStudents, scheduledDate, scheduledTime, duration } = req.body;
    const exam = new Exam({
      examName, semester, branch, section, subject, batch,
      teacherId: req.user.id, // <-- CORRECTED (matches your token)
      numberOfStudents, scheduledDate, scheduledTime, duration,
    });
    await exam.save();
    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    console.error("CREATE EXAM ERROR:", error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. GET CSV Template for Bulk Questions
// GET /api/exam/questions/template
router.get('/questions/template', authMiddleware, teacherAuth, (req, res) => {
  try {
    const columns = ["questionText"];
    const stringifier = stringify({ header: true, columns: columns });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="question_template.csv"');
    stringifier.pipe(res);
    stringifier.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. Get all exams by teacher
// GET /api/exam/my-exams
router.get('/my-exams', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const exams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 }); // <-- CORRECTED
    res.json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. Get specific student submission details
// GET /api/exam/submission/:submissionId
router.get('/submission/:submissionId', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await StudentExam.findById(submissionId)
      .populate('studentId', 'name rollNumber email class')
      .populate('examId', 'examName branch section scheduledDate')
      .populate('assignedQuestions.questionId')
      .populate('screenshots.questionId');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const exam = await Exam.findById(submission.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' }); // <-- CORRECTED
    
    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 5. Get all questions for an exam
// GET /api/exam/:examId/questions
router.get('/:examId/questions', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' }); // <-- CORRECTED

    const questions = await Question.find({ examId });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 6. Add Single Question to Exam
// POST /api/exam/:examId/question
router.post('/:examId/question', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { questionText, level } = req.body;
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' }); // <-- CORRECTED

    const question = new Question({ examId, questionText, level });
    await question.save();
    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 7. Bulk add questions to an exam
// POST /api/exam/:examId/questions/bulk
router.post('/:examId/questions/bulk', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body; 

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' }); // <-- CORRECTED

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'No questions provided' });
    }
    
    const created = [];
    for (const q of questions) {
      if (!q.questionText || q.questionText.trim().startsWith('#')) continue; 
      let level = (q.level || 'easy').toLowerCase().trim();
      if (!['easy', 'medium', 'hard'].includes(level)) level = 'easy';
      
      const question = new Question({ examId, questionText: q.questionText, level: level });
      await question.save();
      created.push(question);
    }
    res.status(201).json({ message: 'Questions uploaded', createdCount: created.length, created });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 8. Get student submissions for an exam
// GET /api/exam/:examId/submissions
router.get('/:examId/submissions', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam || exam.teacherId.toString() !== req.user.id) { // <-- CORRECTED
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

// 9. Update exam status
// PUT /api/exam/:examId/status
router.put('/:examId/status', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body;
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (exam.teacherId.toString() !== req.user.id) { // <-- CORRECTED
      return res.status(403).json({ message: 'Not authorized' });
    }

    exam.status = status;
    await exam.save();
    res.json({ message: 'Exam status updated', exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 10. Delete an exam
// DELETE /api/exam/:examId
router.delete('/:examId', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' }); // <-- CORRECTED
    
    await Exam.findByIdAndDelete(examId);
    await Question.deleteMany({ examId: examId });
    
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 11. Get exam details (MUST BE LAST)
// GET /api/exam/:examId
router.get('/:examId', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('teacherId', 'name email');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && exam.teacherId._id.toString() !== req.user.id) { // <-- CORRECTED
        return res.status(403).json({ message: 'Not authorized' });
    }
    // Add student auth logic here if needed

    res.json({ exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;