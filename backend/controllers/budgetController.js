const Budget = require('../models/Budget');
const Department = require('../models/Department');
const Expenditure = require('../models/Expenditure');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/budgets
exports.listBudgets = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const filter = {};

  if (!isAdmin) {
    filter.status = 'published';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.fiscalYear) {
    filter.fiscalYear = Number(req.query.fiscalYear);
  }

  const budgets = await Budget.find(filter)
    .populate('allocations.department', 'name code color headOfDepartment')
    .sort({ fiscalYear: -1, createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: budgets.length,
    budgets,
  });
});

// GET /api/budgets/dashboard
exports.getBudgetDashboard = asyncHandler(async (req, res) => {
  const { budgetId, fiscalYear } = req.query;
  const isAdmin = req.user?.role === 'admin';

  let selectedBudget = null;
  if (budgetId) {
    selectedBudget = await Budget.findById(budgetId)
      .populate('allocations.department', 'name code color headOfDepartment')
      .lean();
  } else if (fiscalYear) {
    const q = { fiscalYear: Number(fiscalYear) };
    if (!isAdmin) q.status = 'published';
    selectedBudget = await Budget.findOne(q)
      .populate('allocations.department', 'name code color headOfDepartment')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
  } else {
    selectedBudget = await Budget.findOne({ status: 'published' })
      .populate('allocations.department', 'name code color headOfDepartment')
      .sort({ fiscalYear: -1, publishedAt: -1 })
      .lean();
  }

  if (!selectedBudget) {
    return res.status(200).json({
      success: true,
      budget: null,
      availableBudgets: [],
      summary: {
        totalAllocatedBudget: 0,
        totalDepartmentAllocated: 0,
        unallocatedFunds: 0,
        totalSpent: 0,
        remainingBudget: 0,
        utilizationPercentage: 0,
        activeProjectsCount: 0,
        completedProjectsCount: 0,
        totalProjectsCount: 0,
        totalProposalsCount: 0,
        approvedProposalsCount: 0,
        totalVotesCast: 0,
      },
      departmentBreakdown: [],
      monthlySpendingTrend: [],
      recentActivities: [],
    });
  }

  if (selectedBudget.status !== 'published' && !isAdmin) {
    throw new AppError('This budget is not yet published.', 403);
  }

  const availableBudgets = await Budget.find(isAdmin ? {} : { status: 'published' })
    .select('fiscalYear title status totalAmount isDemoData')
    .sort({ fiscalYear: -1 })
    .lean();

  // Aggregate expenditures by department for this budget
  const [deptSpendingAgg, monthlyAgg, recentExpenditures, recentProposals, projectStats] = await Promise.all([
    Expenditure.aggregate([
      { $match: { budget: selectedBudget._id } },
      { $group: { _id: '$department', totalSpent: { $sum: '$amount' }, txCount: { $sum: 1 } } },
    ]),
    Expenditure.aggregate([
      { $match: { budget: selectedBudget._id } },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Expenditure.find({ budget: selectedBudget._id })
      .populate('department', 'name code color')
      .populate('project', 'name')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Proposal.find({})
      .select('title category status estimatedBudget voteCount location createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Project.aggregate([
      { $match: { budget: selectedBudget._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, allocated: { $sum: '$allocatedBudget' }, spent: { $sum: '$amountSpent' } } },
    ]),
  ]);

  const spendingByDeptId = new Map();
  let totalSpent = 0;
  for (const item of deptSpendingAgg) {
    spendingByDeptId.set(String(item._id), item);
    totalSpent += item.totalSpent;
  }

  const departmentBreakdown = (selectedBudget.allocations || []).map((alloc) => {
    const dept = alloc.department || {};
    const deptId = String(dept._id || alloc.department);
    const spendEntry = spendingByDeptId.get(deptId) || { totalSpent: 0, txCount: 0 };
    const allocatedAmount = alloc.allocatedAmount || 0;
    const spentAmount = spendEntry.totalSpent || 0;
    const remainingBalance = Math.max(0, allocatedAmount - spentAmount);
    const spendingPercentage = allocatedAmount > 0 ? Number(((spentAmount / allocatedAmount) * 100).toFixed(1)) : 0;

    return {
      departmentId: deptId,
      departmentName: dept.name || 'Department',
      code: dept.code || 'DEPT',
      color: dept.color || '#0f2d5e',
      headOfDepartment: dept.headOfDepartment || '',
      allocatedAmount,
      spentAmount,
      remainingBalance,
      spendingPercentage,
      transactionCount: spendEntry.txCount || 0,
      notes: alloc.notes || '',
    };
  });

  const totalDepartmentAllocated = departmentBreakdown.reduce((sum, d) => sum + d.allocatedAmount, 0);
  const totalBudget = selectedBudget.totalAmount || 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const unallocatedFunds = Math.max(0, totalBudget - totalDepartmentAllocated);
  const utilizationPercentage = totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

  let activeProjectsCount = 0;
  let completedProjectsCount = 0;
  let totalProjectsCount = 0;
  for (const stat of projectStats) {
    totalProjectsCount += stat.count;
    if (stat._id === 'Completed') completedProjectsCount += stat.count;
    if (stat._id === 'In Progress' || stat._id === 'Planned') activeProjectsCount += stat.count;
  }

  const [totalProposalsCount, approvedProposalsCount, totalVotesCast] = await Promise.all([
    Proposal.countDocuments(),
    Proposal.countDocuments({ status: 'Approved' }),
    Vote.countDocuments(),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySpendingTrend = monthlyAgg.map((m) => ({
    month: `${monthNames[(m._id.month || 1) - 1]} ${m._id.year}`,
    amount: m.amount,
    transactions: m.count,
  }));

  const recentActivities = [
    ...recentExpenditures.map((exp) => ({
      id: exp._id,
      type: 'expenditure',
      title: exp.title,
      subtitle: `${exp.department?.name || 'Department'}${exp.project ? ` • ${exp.project.name}` : ''}`,
      amount: exp.amount,
      date: exp.transactionDate,
      reference: exp.referenceNumber || '',
    })),
    ...recentProposals.map((prop) => ({
      id: prop._id,
      type: 'proposal',
      title: prop.title,
      subtitle: `${prop.category} • ${prop.location}`,
      status: prop.status,
      amount: prop.estimatedBudget,
      date: prop.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  res.status(200).json({
    success: true,
    budget: selectedBudget,
    availableBudgets,
    summary: {
      totalAllocatedBudget: totalBudget,
      totalDepartmentAllocated,
      unallocatedFunds,
      totalSpent,
      remainingBudget,
      utilizationPercentage,
      activeProjectsCount,
      completedProjectsCount,
      totalProjectsCount,
      totalProposalsCount,
      approvedProposalsCount,
      totalVotesCast,
    },
    departmentBreakdown,
    monthlySpendingTrend,
    recentActivities,
  });
});

// GET /api/budgets/:id
exports.getBudgetById = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id)
    .populate('allocations.department', 'name code color headOfDepartment')
    .lean();

  if (!budget) {
    throw new AppError('Budget not found.', 404);
  }
  if (budget.status !== 'published' && req.user?.role !== 'admin') {
    throw new AppError('This budget is not published for public viewing.', 403);
  }

  res.status(200).json({ success: true, budget });
});

// POST /api/budgets (Admin only)
exports.createBudget = asyncHandler(async (req, res) => {
  const { fiscalYear, title, description, totalAmount, status, votingDeadline, allocations, isDemoData } = req.body;

  const parsedAllocations = Array.isArray(allocations) ? allocations : [];
  const totalAllocated = parsedAllocations.reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);
  if (totalAllocated > Number(totalAmount)) {
    throw new AppError(
      `Department allocations (${totalAllocated}) cannot exceed total budget amount (${totalAmount}).`,
      400
    );
  }

  const budget = await Budget.create({
    fiscalYear: Number(fiscalYear),
    title,
    description: description || '',
    totalAmount: Number(totalAmount),
    status: status || 'draft',
    isDemoData: Boolean(isDemoData),
    publishedAt: status === 'published' ? new Date() : undefined,
    votingDeadline: votingDeadline || undefined,
    allocations: parsedAllocations,
    createdBy: req.user._id,
  });

  const populated = await Budget.findById(budget._id)
    .populate('allocations.department', 'name code color headOfDepartment')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Annual budget created successfully.',
    budget: populated,
  });
});

// PUT /api/budgets/:id (Admin only)
exports.updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    throw new AppError('Budget not found.', 404);
  }

  const { fiscalYear, title, description, totalAmount, status, votingDeadline, allocations } = req.body;

  if (fiscalYear !== undefined) budget.fiscalYear = Number(fiscalYear);
  if (title !== undefined) budget.title = title;
  if (description !== undefined) budget.description = description;
  if (totalAmount !== undefined) budget.totalAmount = Number(totalAmount);
  if (votingDeadline !== undefined) budget.votingDeadline = votingDeadline || null;

  if (Array.isArray(allocations)) {
    budget.allocations = allocations;
  }

  const sumAlloc = (budget.allocations || []).reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);
  if (sumAlloc > budget.totalAmount) {
    throw new AppError(
      `Total department allocations (${sumAlloc}) exceed budget total (${budget.totalAmount}).`,
      400
    );
  }

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    if (status === 'published' && budget.status !== 'published') {
      budget.publishedAt = new Date();
    }
    budget.status = status;
  }

  await budget.save();

  const populated = await Budget.findById(budget._id)
    .populate('allocations.department', 'name code color headOfDepartment')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Budget updated successfully.',
    budget: populated,
  });
});

// PUT /api/budgets/:id/allocate (Admin only)
exports.allocateDepartmentFunds = asyncHandler(async (req, res) => {
  const { departmentId, allocatedAmount, notes } = req.body;
  const budget = await Budget.findById(req.params.id);
  if (!budget) throw new AppError('Budget not found.', 404);

  const dept = await Department.findById(departmentId);
  if (!dept) throw new AppError('Department not found.', 404);

  const amountNum = Number(allocatedAmount);
  if (Number.isNaN(amountNum) || amountNum < 0) {
    throw new AppError('Allocated amount must be a non-negative number.', 400);
  }

  const existingIdx = budget.allocations.findIndex((a) => String(a.department) === String(departmentId));
  if (existingIdx >= 0) {
    budget.allocations[existingIdx].allocatedAmount = amountNum;
    if (notes !== undefined) budget.allocations[existingIdx].notes = notes;
  } else {
    budget.allocations.push({ department: departmentId, allocatedAmount: amountNum, notes: notes || '' });
  }

  const sumAlloc = budget.allocations.reduce((sum, a) => sum + Number(a.allocatedAmount || 0), 0);
  if (sumAlloc > budget.totalAmount) {
    throw new AppError(
      `Total department allocations (${sumAlloc}) exceed total budget (${budget.totalAmount}). Remaining unallocated: ${Math.max(0, budget.totalAmount - (sumAlloc - amountNum))}.`,
      400
    );
  }

  await budget.save();

  const populated = await Budget.findById(budget._id)
    .populate('allocations.department', 'name code color headOfDepartment')
    .lean();

  res.status(200).json({
    success: true,
    message: `Allocated funds to ${dept.name} successfully.`,
    budget: populated,
  });
});
