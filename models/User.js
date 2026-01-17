const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student', index: true },
    avatar: String,
    bio: String,
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    lastLogin: Date,
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 });
userSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
