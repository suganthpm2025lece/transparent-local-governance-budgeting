const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: [true, 'Update note is required'],
      trim: true,
      maxlength: [500, 'Update note cannot exceed 500 characters'],
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [160, 'Project name cannot exceed 160 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      required: [true, 'Budget reference is required'],
      index: true,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    location: {
      type: String,
      required: [true, 'Project location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    allocatedBudget: {
      type: Number,
      required: [true, 'Allocated budget is required'],
      min: [0, 'Allocated budget cannot be negative'],
    },
    amountSpent: {
      type: Number,
      default: 0,
      min: [0, 'Amount spent cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Starting date is required'],
    },
    expectedCompletionDate: {
      type: Date,
      required: [true, 'Expected completion date is required'],
    },
    actualCompletionDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'On Hold', 'Completed'],
      default: 'Planned',
      index: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    contractor: {
      type: String,
      trim: true,
      maxlength: [120, 'Contractor name cannot exceed 120 characters'],
      default: 'City Works Authority',
    },
    progressUpdates: {
      type: [progressUpdateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ status: 1, department: 1 });

module.exports = mongoose.model('Project', projectSchema);
