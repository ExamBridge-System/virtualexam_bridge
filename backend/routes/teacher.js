const express = require('express');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const StudentExam = require('../models/StudentExam');
const Student = require('../models/Student');
const { authMiddleware, teacherAuth } = require('../middleware/auth');

const router = express.Router();

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
    const { examName, class: examClass, numberOfStudents, scheduledDate, scheduledTime, duration } = req.body;

    const exam = new Exam({
      examName,
      class: examClass,
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

// Get students currently taking an exam (for ongoing exams)
router.get('/exam/:examId/students', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam || exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const studentExams = await StudentExam.find({ examId, status: { $in: ['in_progress', 'submitted'] } })
      .populate('studentId', 'name rollNumber email')
      .populate('assignedQuestions.questionId');

    res.json({ students: studentExams });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle exchange permission for a specific student
router.post('/exam/:examId/student/:studentExamId/toggle-exchange', authMiddleware, teacherAuth, async (req, res) => {
  try {
    const { examId, studentExamId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam || exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const studentExam = await StudentExam.findById(studentExamId);
    if (!studentExam || studentExam.examId.toString() !== examId) {
      return res.status(404).json({ message: 'Student exam not found' });
    }

    studentExam.exchangeAllowed = !studentExam.exchangeAllowed;
    await studentExam.save();

    res.json({
      message: `Exchange ${studentExam.exchangeAllowed ? 'allowed' : 'disallowed'} for student`,
      exchangeAllowed: studentExam.exchangeAllowed
    });
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

module.exports = router;
