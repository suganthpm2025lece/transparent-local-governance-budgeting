const express = require('express');
const { body } = require('express-validator');
const budgetController = require('../controllers/budgetController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/dashboard', optionalAuth, budgetController.getBudgetDashboard);
router.get('/', optionalAuth, budgetController.listBudgets);
router.get('/:id', optionalAuth, budgetController.getBudgetById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('fiscalYear').isInt({ min: 2020, max: 2100 }).withMessage('Valid fiscal year is required.'),
    body('title').trim().notEmpty().withMessage('Budget title is required.'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total budget amount must be non-negative.'),
  ],
  validateRequest,
  budgetController.createBudget
);

router.put('/:id', protect, authorize('admin'), budgetController.updateBudget);

router.put(
  '/:id/allocate',
  protect,
  authorize('admin'),
  [
    body('departmentId').notEmpty().withMessage('Department ID is required.'),
    body('allocatedAmount').isFloat({ min: 0 }).withMessage('Allocated amount must be non-negative.'),
  ],
  validateRequest,
  budgetController.allocateDepartmentFunds
);

module.exports = router;
