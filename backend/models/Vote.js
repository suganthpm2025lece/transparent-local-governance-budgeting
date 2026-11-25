const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: [true, 'Proposal reference is required'],
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required'],
      index: true,
    },
    fiscalYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [300, 'Comment cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Database-level constraint preventing duplicate votes by the same citizen on a proposal
voteSchema.index({ proposal: 1, citizen: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
