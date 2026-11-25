const Feedback = require('../models/Feedback');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notify');

// POST /api/feedback (Public or Authenticated)
exports.createFeedback = asyncHandler(async (req, res) => {
  const { senderName, senderEmail, type, subject, message, departmentId, projectId } = req.body;

  const feedback = await Feedback.create({
    user: req.user ? req.user._id : null,
    senderName: req.user ? req.user.name : senderName,
    senderEmail: req.user ? req.user.email : senderEmail,
    type: type || 'Suggestion',
    subject,
    message,
    department: departmentId || null,
    project: projectId || null,
    status: 'Open',
  });

  res.status(201).json({
    success: true,
    message: 'Your feedback has been submitted. Thank you for engaging with local governance.',
    feedback,
  });
});

// GET /api/feedback (Authenticated: Admin sees all; Citizen sees own submissions)
exports.listFeedback = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

  if (req.query.status && req.query.status !== 'All') {
    filter.status = req.query.status;
  }
  if (req.query.type && req.query.type !== 'All') {
    filter.type = req.query.type;
  }

  const feedbackList = await Feedback.find(filter)
    .populate('department', 'name code')
    .populate('project', 'name')
    .populate('respondedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: feedbackList.length,
    feedback: feedbackList,
  });
});

// PATCH /api/feedback/:id/respond (Admin only)
exports.respondToFeedback = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    throw new AppError('Feedback entry not found.', 404);
  }

  if (status && ['Open', 'In Review', 'Resolved', 'Closed'].includes(status)) {
    feedback.status = status;
  }
  if (adminResponse !== undefined) {
    feedback.adminResponse = adminResponse;
    feedback.respondedBy = req.user._id;
    feedback.respondedAt = new Date();
  }

  await feedback.save();

  if (feedback.user) {
    await createNotification({
      recipient: feedback.user,
      title: `Feedback Update: ${feedback.status}`,
      message: `Administration responded to "${feedback.subject}".`,
      type: 'feedback',
      link: '/feedback',
    });
  }

  const populated = await Feedback.findById(feedback._id)
    .populate('department', 'name code')
    .populate('project', 'name')
    .populate('respondedBy', 'name')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Feedback updated successfully.',
    feedback: populated,
  });
});
