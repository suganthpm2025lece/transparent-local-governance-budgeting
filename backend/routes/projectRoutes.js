const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProjectById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required.'),
    body('departmentId').notEmpty().withMessage('Department is required.'),
    body('budgetId').notEmpty().withMessage('Budget is required.'),
    body('location').trim().notEmpty().withMessage('Location is required.'),
    body('allocatedBudget').isFloat({ min: 0 }).withMessage('Allocated budget must be non-negative.'),
    body('startDate').notEmpty().withMessage('Start date is required.'),
    body('expectedCompletionDate').notEmpty().withMessage('Expected completion date is required.'),
  ],
  validateRequest,
  projectController.createProject
);

router.patch('/:id/progress', protect, authorize('admin'), projectController.updateProjectProgress);

module.exports = router;
