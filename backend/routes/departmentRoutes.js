const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', optionalAuth, departmentController.listDepartments);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Department name is required.'),
    body('code').trim().isLength({ min: 2, max: 16 }).withMessage('Department code must be 2-16 characters.'),
  ],
  validateRequest,
  departmentController.createDepartment
);

router.put('/:id', protect, authorize('admin'), departmentController.updateDepartment);

module.exports = router;
