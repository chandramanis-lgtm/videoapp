const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrolledDate: { type: Date, default: Date.now, index: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active', index: true }
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
