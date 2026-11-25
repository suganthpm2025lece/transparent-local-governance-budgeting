const mongoose = require('mongoose');

const expenditureSchema = new mongoose.Schema(
  {
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      required: [true, 'Budget reference is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expenditure title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Expenditure description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    vendorName: {
      type: String,
      trim: true,
      maxlength: [120, 'Vendor name cannot exceed 120 characters'],
      default: 'Municipal Contractor',
    },
    referenceNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['verified', 'pending'],
      default: 'verified',
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenditureSchema.index({ budget: 1, department: 1, transactionDate: -1 });

module.exports = mongoose.model('Expenditure', expenditureSchema);
