const User = require('../models/User');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, ward, address } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Always enforce role: 'citizen' on public self-registration
  const user = await User.create({
    name,
    email,
    password,
    role: 'citizen',
    phone: phone || '',
    ward: ward || 'Ward 1 - Central',
    address: address || '',
    lastLoginAt: new Date(),
  });

  await createNotification({
    recipient: user._id,
    title: 'Welcome to CivicLedger Transparency Portal',
    message: 'Your citizen account is active. You can now submit community proposals, vote on initiatives, and track municipal budgets.',
    type: 'system',
    link: '/citizen',
  });

  const token = signToken(user);
  res.status(201).json({
    success: true,
    message: 'Citizen account registered successfully.',
    token,
    user: user.toSafeObject(),
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated by an administrator.', 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);
  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: user.toSafeObject(),
  });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const unreadNotifications = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
    unreadNotifications,
  });
});

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, ward, address } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (ward !== undefined) user.ward = ward;
  if (address !== undefined) user.address = address;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: user.toSafeObject(),
  });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
  });
});
