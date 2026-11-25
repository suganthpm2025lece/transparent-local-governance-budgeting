const express = require('express');
const { body } = require('express-validator');
const proposalController = require('../controllers/proposalController');
const { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } = require('../models/Proposal');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, proposalController.listProposals);
router.get('/:id', optionalAuth, proposalController.getProposalById);

router.post(
  '/',
  protect,
  upload.array('attachments', 4),
  [
    body('title').trim().isLength({ min: 5, max: 160 }).withMessage('Proposal title must be 5 to 160 characters.'),
    body('description')
      .trim()
      .isLength({ min: 20, max: 3000 })
      .withMessage('Description must be at least 20 characters.'),
    body('category').isIn(PROPOSAL_CATEGORIES).withMessage('Please select a valid development category.'),
    body('location').trim().notEmpty().withMessage('Location is required.'),
    body('estimatedBudget').isFloat({ min: 100 }).withMessage('Estimated budget must be at least 100.'),
  ],
  validateRequest,
  proposalController.createProposal
);

router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  [body('status').isIn(PROPOSAL_STATUSES).withMessage('Invalid proposal status.')],
  validateRequest,
  proposalController.updateProposalStatus
);

module.exports = router;
