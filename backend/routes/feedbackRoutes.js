const express = require('express');
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', protect, feedbackController.listFeedback);

router.post(
  '/',
  optionalAuth,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required.'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.'),
    body('senderEmail')
      .if((value, { req }) => !req.user)
      .isEmail()
      .withMessage('Valid email is required.'),
    body('senderName')
      .if((value, { req }) => !req.user)
      .trim()
      .notEmpty()
      .withMessage('Your name is required.'),
  ],
  validateRequest,
  feedbackController.createFeedback
);

router.patch('/:id/respond', protect, authorize('admin'), feedbackController.respondToFeedback);

module.exports = router;
