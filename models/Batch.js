const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxStudents: Number,
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming', index: true },
    description: String
  },
  { timestamps: true }
);

batchSchema.index({ course: 1, status: 1 });
batchSchema.index({ instructor: 1, status: 1 });

module.exports = mongoose.model('Batch', batchSchema);
