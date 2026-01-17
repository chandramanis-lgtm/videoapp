const express = require('express');
const Video = require('../models/Video');
const authMiddleware = require('../middleware/auth');
const { cacheWrapper, invalidateCache } = require('../config/redis');

const router = express.Router();

// Get all videos with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { batchId, courseId, subjectId, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    
    if (batchId) query.batch = batchId;
    if (courseId) query.course = courseId;
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;

    const cacheKey = `videos:${JSON.stringify(query)}:${page}:${limit}`;

    const videos = await cacheWrapper(cacheKey, 1800, async () => {
      return await Video.find(query)
        .select('-__v') // Exclude version field
        .lean()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    });

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get video by ID
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `video:${req.params.id}`;
    
    const video = await cacheWrapper(cacheKey, 3600, async () => {
      return await Video.findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
      ).lean();
    });
    
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create video (instructor only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, batch, course, subject, youtubeVideoId } = req.body;
    const video = new Video({
      title,
      batch,
      course,
      subject,
      youtubeVideoId
    });
    await video.save();
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update video
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    
    await invalidateCache(`video:${req.params.id}`);
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete video
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Video.findByIdAndDelete(req.params.id);
    await invalidateCache(`video:${req.params.id}`);
    
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
