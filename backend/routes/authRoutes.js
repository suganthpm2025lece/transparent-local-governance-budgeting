const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again shortly.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2 to 100 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validateRequest,
  authController.login
);

router.get('/me', protect, authController.getMe);

router.put(
  '/profile',
  protect,
  [body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2 to 100 characters.')],
  validateRequest,
  authController.updateProfile
);

router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  ],
  validateRequest,
  authController.changePassword
);

module.exports = router;
