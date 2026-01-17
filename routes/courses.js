const express = require('express');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const { cacheWrapper, invalidateCache } = require('../config/redis');

const router = express.Router();

// Get all courses with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `courses:published:${page}:${limit}`;
    
    const courses = await cacheWrapper(cacheKey, 3600, async () => {
      return await Course.find({ isPublished: true })
        .populate('instructor', 'name email')
        .select('-students') // Exclude large arrays from query
        .lean() // Return plain JS objects, faster than Mongoose docs
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    });

    const total = await Course.countDocuments({ isPublished: true });

    res.json({
      courses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `course:${req.params.id}`;
    
    const course = await cacheWrapper(cacheKey, 3600, async () => {
      return await Course.findById(req.params.id)
        .populate('instructor', 'name email')
        .populate({
          path: 'modules',
          populate: { path: 'lessons', select: '-resources' } // Exclude resources
        })
        .lean();
    });

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create course (instructor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, level, price } = req.body;
    const course = new Course({
      title,
      description,
      category,
      level,
      price,
      instructor: req.user.id
    });
    await course.save();
    
    // Invalidate cache
    await invalidateCache(`courses:published:*`);
    
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update course
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(course, req.body);
    await course.save();
    
    // Invalidate cache
    await invalidateCache(`course:${req.params.id}`);
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Publish course
router.put('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.isPublished = true;
    await course.save();
    
    await invalidateCache(`course:${req.params.id}`);
    
    res.json({ message: 'Course published', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
