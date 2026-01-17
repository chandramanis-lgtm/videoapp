const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['credit_card', 'debit_card', 'upi', 'bank_transfer', 'offline'], default: 'credit_card' },
    transactionId: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
