const Expenditure = require('../models/Expenditure');
const Budget = require('../models/Budget');
const Department = require('../models/Department');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/expenditures
exports.listExpenditures = asyncHandler(async (req, res) => {
  const {
    search = '',
    departmentId,
    budgetId,
    projectId,
    startDate,
    endDate,
    sortBy = 'transactionDate',
    sortOrder = 'desc',
    limit = 50,
    page = 1,
  } = req.query;

  const filter = {};
  if (departmentId) filter.department = departmentId;
  if (budgetId) filter.budget = budgetId;
  if (projectId) filter.project = projectId;

  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { vendorName: regex },
      { referenceNumber: regex },
    ];
  }

  const allowedSortFields = ['transactionDate', 'amount', 'createdAt', 'title'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'transactionDate';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [expenditures, totalCount, totalAmountAgg] = await Promise.all([
    Expenditure.find(filter)
      .populate('department', 'name code color')
      .populate('budget', 'fiscalYear title status')
      .populate('project', 'name location status')
      .sort({ [sortField]: sortDir, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Expenditure.countDocuments(filter),
    Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    count: expenditures.length,
    totalCount,
    totalFilteredAmount: totalAmountAgg[0]?.totalAmount || 0,
    page: pageNum,
    pages: Math.ceil(totalCount / limitNum) || 1,
    expenditures,
  });
});

// POST /api/expenditures (Admin only)
exports.createExpenditure = asyncHandler(async (req, res) => {
  const { budgetId, departmentId, projectId, title, description, amount, transactionDate, vendorName, referenceNumber } =
    req.body;

  const [budget, department] = await Promise.all([
    Budget.findById(budgetId),
    Department.findById(departmentId),
  ]);

  if (!budget) throw new AppError('Referenced budget not found.', 404);
  if (!department) throw new AppError('Referenced department not found.', 404);

  let project = null;
  if (projectId) {
    project = await Project.findById(projectId);
    if (!project) throw new AppError('Referenced project not found.', 404);
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    throw new AppError('Expenditure amount must be greater than zero.', 400);
  }

  const refNum = referenceNumber?.trim() || `EXP-${budget.fiscalYear}-${Date.now().toString().slice(-6)}`;

  const expenditure = await Expenditure.create({
    budget: budget._id,
    department: department._id,
    project: project ? project._id : null,
    title,
    description,
    amount: numericAmount,
    transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    vendorName: vendorName || 'Municipal Contractor',
    referenceNumber: refNum,
    recordedBy: req.user._id,
  });

  if (project) {
    project.amountSpent = Number((project.amountSpent + numericAmount).toFixed(2));
    await project.save();
  }

  const populated = await Expenditure.findById(expenditure._id)
    .populate('department', 'name code color')
    .populate('budget', 'fiscalYear title')
    .populate('project', 'name location')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Expenditure recorded and dashboard balances updated.',
    expenditure: populated,
  });
});

// DELETE /api/expenditures/:id (Admin only)
exports.deleteExpenditure = asyncHandler(async (req, res) => {
  const expenditure = await Expenditure.findById(req.params.id);
  if (!expenditure) {
    throw new AppError('Expenditure record not found.', 404);
  }

  if (expenditure.project) {
    const project = await Project.findById(expenditure.project);
    if (project) {
      project.amountSpent = Math.max(0, Number((project.amountSpent - expenditure.amount).toFixed(2)));
      await project.save();
    }
  }

  await expenditure.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Expenditure record removed.',
  });
});
