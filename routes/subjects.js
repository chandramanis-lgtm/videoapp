const express = require('express');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('course', 'title');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get subjects by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const subjects = await Subject.find({ course: req.params.courseId });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single subject
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('course', 'title')
      .populate('lessons');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create subject (instructor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, course, description } = req.body;
    const subject = new Subject({ title, course, description });
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update subject
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(subject, req.body);
    await subject.save();
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
