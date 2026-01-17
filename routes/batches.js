const express = require('express');
const Batch = require('../models/Batch');
const authMiddleware = require('../middleware/auth');
const { cacheWrapper, invalidateCache } = require('../config/redis');

const router = express.Router();

// Get all batches with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `batches:${page}:${limit}`;

    const batches = await cacheWrapper(cacheKey, 1800, async () => {
      return await Batch.find()
        .select('-students') // Exclude large arrays
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ startDate: -1 });
    });

    const total = await Batch.countDocuments();

    res.json({
      batches,
      pagination: { total, page, pages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get batches by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `batches:course:${req.params.courseId}:${page}:${limit}`;

    const batches = await cacheWrapper(cacheKey, 1800, async () => {
      return await Batch.find({ course: req.params.courseId })
        .select('name status startDate endDate maxStudents students')
        .lean()
        .skip(skip)
        .limit(limit);
    });

    const total = await Batch.countDocuments({ course: req.params.courseId });

    res.json({
      batches,
      pagination: { total, page, pages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single batch
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `batch:${req.params.id}`;
    
    const batch = await cacheWrapper(cacheKey, 3600, async () => {
      return await Batch.findById(req.params.id)
        .populate('course', 'title')
        .populate('instructor', 'name email')
        .select('-students') // Exclude large array
        .lean();
    });

    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create batch (instructor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, course, startDate, endDate, maxStudents, description } = req.body;
    const batch = new Batch({
      name,
      course,
      instructor: req.user.id,
      startDate,
      endDate,
      maxStudents,
      description
    });
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update batch
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (batch.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(batch, req.body);
    await batch.save();
    
    await invalidateCache(`batch:${req.params.id}`);
    
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add student to batch
router.post('/:id/add-student', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (batch.maxStudents && batch.students.length >= batch.maxStudents) {
      return res.status(400).json({ message: 'Batch is full' });
    }

    if (!batch.students.includes(studentId)) {
      batch.students.push(studentId);
      await batch.save();
    }

    await invalidateCache(`batch:${req.params.id}`);

    res.json({ message: 'Student added to batch', batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove student from batch
router.post('/:id/remove-student', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.students = batch.students.filter(id => id.toString() !== studentId);
    await batch.save();

    await invalidateCache(`batch:${req.params.id}`);

    res.json({ message: 'Student removed from batch', batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
