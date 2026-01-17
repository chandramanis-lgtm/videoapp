const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    description: String,
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    thumbnail: String,
    category: { type: String, index: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    isPublished: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

courseSchema.index({ isPublished: 1, category: 1 });
courseSchema.index({ instructor: 1, isPublished: 1 });

module.exports = mongoose.model('Course', courseSchema);
