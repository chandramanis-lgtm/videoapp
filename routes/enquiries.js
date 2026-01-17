const express = require('express');
const Enquiry = require('../models/Enquiry');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all enquiries (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get enquiry by ID
router.get('/:id', async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create enquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, course, message } = req.body;

    const enquiry = new Enquiry({
      name,
      email,
      mobile,
      course,
      message,
      status: 'pending'
    });

    await enquiry.save();
    res.status(201).json({ message: 'Enquiry submitted successfully', enquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update enquiry status (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, notes: req.body.notes },
      { new: true }
    );

    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
