const express = require('express');
const { body } = require('express-validator');
const expenditureController = require('../controllers/expenditureController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', expenditureController.listExpenditures);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('budgetId').notEmpty().withMessage('Budget ID is required.'),
    body('departmentId').notEmpty().withMessage('Department ID is required.'),
    body('title').trim().notEmpty().withMessage('Expenditure title is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero.'),
  ],
  validateRequest,
  expenditureController.createExpenditure
);

router.delete('/:id', protect, authorize('admin'), expenditureController.deleteExpenditure);

module.exports = router;
