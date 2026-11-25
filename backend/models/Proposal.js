const mongoose = require('mongoose');

const PROPOSAL_CATEGORIES = [
  'Roads and transportation',
  'Education',
  'Healthcare',
  'Drinking water',
  'Sanitation',
  'Parks and public facilities',
];

const PROPOSAL_STATUSES = [
  'Pending',
  'Under Review',
  'Approved',
  'Rejected',
  'Completed',
];

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, default: 'document' },
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Proposal title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [160, 'Title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Proposal description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Development category is required'],
      enum: PROPOSAL_CATEGORIES,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    estimatedBudget: {
      type: Number,
      required: [true, 'Estimated budget is required'],
      min: [100, 'Estimated budget must be at least 100'],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: 'Pending',
      index: true,
    },
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: [600, 'Admin remarks cannot exceed 600 characters'],
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    votingDeadline: {
      type: Date,
      default: null,
    },
    voteCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

proposalSchema.index({ status: 1, voteCount: -1, createdAt: -1 });

module.exports = mongoose.model('Proposal', proposalSchema);
module.exports.PROPOSAL_CATEGORIES = PROPOSAL_CATEGORIES;
module.exports.PROPOSAL_STATUSES = PROPOSAL_STATUSES;
