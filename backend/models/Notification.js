const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [400, 'Message cannot exceed 400 characters'],
    },
    type: {
      type: String,
      enum: ['proposal', 'vote', 'budget', 'project', 'feedback', 'system'],
      default: 'system',
    },
    link: {
      type: String,
      default: '/',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
