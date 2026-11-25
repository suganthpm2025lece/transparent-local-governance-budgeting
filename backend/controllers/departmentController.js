const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/departments
exports.listDepartments = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
  const filter = includeInactive ? {} : { isActive: true };
  const departments = await Department.find(filter).sort({ name: 1 }).lean();

  res.status(200).json({
    success: true,
    count: departments.length,
    departments,
  });
});

// POST /api/departments (Admin only)
exports.createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, headOfDepartment, contactEmail, color } = req.body;
  const existing = await Department.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
  });
  if (existing) {
    throw new AppError('A department with this name or code already exists.', 409);
  }

  const department = await Department.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description || '',
    headOfDepartment: headOfDepartment || 'Directorate Office',
    contactEmail: contactEmail || '',
    color: color || '#0f2d5e',
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully.',
    department,
  });
});

// PUT /api/departments/:id (Admin only)
exports.updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    throw new AppError('Department not found.', 404);
  }

  const fields = ['name', 'code', 'description', 'headOfDepartment', 'contactEmail', 'color', 'isActive'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      department[field] = field === 'code' ? String(req.body[field]).toUpperCase().trim() : req.body[field];
    }
  });

  await department.save();
  res.status(200).json({
    success: true,
    message: 'Department updated successfully.',
    department,
  });
});
