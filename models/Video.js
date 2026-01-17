const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    youtubeVideoId: { type: String, required: true, unique: true },
    duration: Number,
    description: String,
    status: { type: Number, default: 1, index: true },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

videoSchema.index({ course: 1, status: 1 });
videoSchema.index({ batch: 1, status: 1 });

module.exports = mongoose.model('Video', videoSchema);
