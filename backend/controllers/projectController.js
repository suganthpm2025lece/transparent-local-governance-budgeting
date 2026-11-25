const Project = require('../models/Project');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/projects
exports.listProjects = asyncHandler(async (req, res) => {
  const { search = '', departmentId, status, budgetId } = req.query;
  const filter = {};

  if (departmentId && departmentId !== 'All') filter.department = departmentId;
  if (status && status !== 'All') filter.status = status;
  if (budgetId) filter.budget = budgetId;

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { location: regex }, { contractor: regex }];
  }

  const projects = await Project.find(filter)
    .populate('department', 'name code color')
    .populate('budget', 'fiscalYear title')
    .populate('progressUpdates.updatedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: projects.length,
    projects,
  });
});

// GET /api/projects/:id
exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('department', 'name code color headOfDepartment')
    .populate('budget', 'fiscalYear title')
    .populate('proposal', 'title voteCount location')
    .populate('progressUpdates.updatedBy', 'name role')
    .lean();

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  res.status(200).json({
    success: true,
    project,
  });
});

// POST /api/projects (Admin only)
exports.createProject = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    departmentId,
    budgetId,
    location,
    allocatedBudget,
    startDate,
    expectedCompletionDate,
    status,
    completionPercentage,
    contractor,
  } = req.body;

  const [dept, budget] = await Promise.all([
    Department.findById(departmentId),
    Budget.findById(budgetId),
  ]);

  if (!dept) throw new AppError('Selected department not found.', 404);
  if (!budget) throw new AppError('Selected budget not found.', 404);

  const pct = Math.min(100, Math.max(0, Number(completionPercentage || 0)));
  const resolvedStatus = pct === 100 ? 'Completed' : status || 'Planned';

  const project = await Project.create({
    name,
    description: description || '',
    department: dept._id,
    budget: budget._id,
    location,
    allocatedBudget: Number(allocatedBudget),
    startDate: new Date(startDate),
    expectedCompletionDate: new Date(expectedCompletionDate),
    actualCompletionDate: resolvedStatus === 'Completed' ? new Date() : null,
    status: resolvedStatus,
    completionPercentage: pct,
    contractor: contractor || 'City Works Authority',
    progressUpdates: [
      {
        note: 'Project created and registered on Public Transparency Tracker.',
        percentage: pct,
        updatedBy: req.user._id,
      },
    ],
  });

  const populated = await Project.findById(project._id)
    .populate('department', 'name code color')
    .populate('budget', 'fiscalYear title')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Development project created successfully.',
    project: populated,
  });
});

// PATCH /api/projects/:id/progress (Admin only)
exports.updateProjectProgress = asyncHandler(async (req, res) => {
  const { status, completionPercentage, note, amountSpent } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  if (completionPercentage !== undefined) {
    const pct = Number(completionPercentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      throw new AppError('Completion percentage must be between 0 and 100.', 400);
    }
    project.completionPercentage = pct;
  }

  if (status && ['Planned', 'In Progress', 'On Hold', 'Completed'].includes(status)) {
    project.status = status;
  }

  if (project.completionPercentage === 100) {
    project.status = 'Completed';
    if (!project.actualCompletionDate) project.actualCompletionDate = new Date();
  } else if (project.status === 'Completed' && project.completionPercentage < 100) {
    project.completionPercentage = 100;
    if (!project.actualCompletionDate) project.actualCompletionDate = new Date();
  }

  if (amountSpent !== undefined && !Number.isNaN(Number(amountSpent))) {
    project.amountSpent = Math.max(0, Number(amountSpent));
  }

  if (note && String(note).trim()) {
    project.progressUpdates.push({
      note: String(note).trim(),
      percentage: project.completionPercentage,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });
  }

  await project.save();

  const populated = await Project.findById(project._id)
    .populate('department', 'name code color')
    .populate('budget', 'fiscalYear title')
    .populate('progressUpdates.updatedBy', 'name role')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Project progress updated.',
    project: populated,
  });
});
