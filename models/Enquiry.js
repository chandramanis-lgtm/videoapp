const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: String,
    course: String,
    message: String,
    status: { type: String, enum: ['pending', 'contacted', 'converted', 'rejected'], default: 'pending' },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', enquirySchema);
