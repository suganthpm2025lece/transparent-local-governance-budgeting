const User = require('../models/User');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users (Admin only)
exports.listUsers = asyncHandler(async (req, res) => {
  const { search = '', role, isActive } = req.query;
  const filter = {};

  if (role && ['citizen', 'admin'].includes(role)) {
    filter.role = role;
  }
  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true';
  }
  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { ward: regex }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// PATCH /api/users/:id/status (Admin only)
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) {
    throw new AppError('User account not found.', 404);
  }

  if (target._id.toString() === req.user._id.toString() && isActive === false) {
    throw new AppError('Administrators cannot deactivate their own active session account.', 400);
  }

  if (typeof isActive === 'boolean') target.isActive = isActive;
  if (role && ['citizen', 'admin'].includes(role)) {
    if (target._id.toString() === req.user._id.toString() && role !== 'admin') {
      throw new AppError('You cannot remove your own administrator role.', 400);
    }
    target.role = role;
  }

  await target.save();

  res.status(200).json({
    success: true,
    message: 'Citizen account updated.',
    user: target.toSafeObject(),
  });
});

// GET /api/users/notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.status(200).json({
    success: true,
    unreadCount,
    notifications,
  });
});

// PATCH /api/users/notifications/:id/read
exports.markNotificationRead = asyncHandler(async (req, res) => {
  if (req.params.id === 'all') {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found.', 404);
  }

  res.status(200).json({
    success: true,
    notification,
  });
});
