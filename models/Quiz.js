const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    title: { type: String, required: true },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
        points: Number
      }
    ],
    passingScore: { type: Number, default: 70 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
