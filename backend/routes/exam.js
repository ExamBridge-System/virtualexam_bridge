const express = require('express');
const Exam = require('../models/Exam');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get exam details
router.get('/:examId', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('teacherId', 'name email');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update exam status
router.put('/:examId/status', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const { status } = req.body;

    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    exam.status = status;
    await exam.save();

    res.json({ message: 'Exam status updated', exam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;