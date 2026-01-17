const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Enroll in course
router.post('/:courseId/enroll', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    const enrollment = new Enrollment({
      student: req.user.id,
      course: courseId
    });

    await enrollment.save();
    course.students.push(req.user.id);
    await course.save();

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student enrollments
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.studentId })
      .populate('course')
      .populate('completedLessons');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark lesson as completed
router.put('/:enrollmentId/complete-lesson', authMiddleware, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const enrollment = await Enrollment.findById(req.params.enrollmentId);

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    const totalLessons = await Lesson.countDocuments({ module: { $in: (await Course.findById(enrollment.course)).modules } });
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);

    await enrollment.save();
    res.json({ message: 'Lesson marked complete', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
