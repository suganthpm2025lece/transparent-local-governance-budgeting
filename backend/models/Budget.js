const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0, 'Allocated amount cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Allocation notes cannot exceed 300 characters'],
      default: '',
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    fiscalYear: {
      type: Number,
      required: [true, 'Fiscal year is required'],
      min: [2020, 'Fiscal year must be 2020 or later'],
      max: [2100, 'Fiscal year must be 2100 or earlier'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Budget title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total budget amount is required'],
      min: [0, 'Total budget cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isDemoData: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    votingDeadline: {
      type: Date,
    },
    allocations: {
      type: [allocationSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ fiscalYear: 1, status: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
