const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { toCsv } = require('../utils/csvExport');

async function buildReportPayload(fiscalYear) {
  const budgetFilter = { status: 'published' };
  if (fiscalYear) budgetFilter.fiscalYear = Number(fiscalYear);

  const budget = await Budget.findOne(budgetFilter)
    .populate('allocations.department', 'name code headOfDepartment color')
    .sort({ fiscalYear: -1 })
    .lean();

  const [expenditures, projects, proposals] = await Promise.all([
    Expenditure.find(budget ? { budget: budget._id } : {})
      .populate('department', 'name code')
      .populate('project', 'name')
      .sort({ transactionDate: -1 })
      .lean(),
    Project.find(budget ? { budget: budget._id } : {})
      .populate('department', 'name code')
      .sort({ completionPercentage: -1 })
      .lean(),
    Proposal.find({})
      .populate('submittedBy', 'name ward')
      .sort({ voteCount: -1, createdAt: -1 })
      .lean(),
  ]);

  const spentByDept = new Map();
  for (const exp of expenditures) {
    const key = String(exp.department?._id || exp.department);
    spentByDept.set(key, (spentByDept.get(key) || 0) + exp.amount);
  }

  const departmentReport = (budget?.allocations || []).map((alloc) => {
    const dept = alloc.department || {};
    const deptId = String(dept._id || alloc.department);
    const spent = spentByDept.get(deptId) || 0;
    const allocated = alloc.allocatedAmount || 0;
    const remaining = Math.max(0, allocated - spent);
    const utilization = allocated > 0 ? Number(((spent / allocated) * 100).toFixed(1)) : 0;
    return {
      departmentName: dept.name || 'Department',
      code: dept.code || '',
      headOfDepartment: dept.headOfDepartment || '',
      allocatedAmount: allocated,
      spentAmount: spent,
      remainingBalance: remaining,
      utilizationPercentage: utilization,
    };
  });

  const totalSpent = expenditures.reduce((sum, e) => sum + e.amount, 0);

  return {
    generatedAt: new Date().toISOString(),
    disclaimer: 'Sample / Demo Municipal Financial Report for transparency evaluation.',
    budget: budget
      ? {
          _id: budget._id,
          fiscalYear: budget.fiscalYear,
          title: budget.title,
          totalAmount: budget.totalAmount,
          totalSpent,
          remainingBudget: Math.max(0, budget.totalAmount - totalSpent),
          utilizationPercentage: budget.totalAmount > 0 ? Number(((totalSpent / budget.totalAmount) * 100).toFixed(1)) : 0,
        }
      : null,
    departmentReport,
    expenditures,
    projects,
    proposals,
  };
}

// GET /api/reports/summary
exports.getReportsSummary = asyncHandler(async (req, res) => {
  const payload = await buildReportPayload(req.query.fiscalYear);
  res.status(200).json({
    success: true,
    ...payload,
  });
});

// GET /api/reports/export?type=budget|spending|projects|voting&fiscalYear=2026
exports.exportCsvReport = asyncHandler(async (req, res) => {
  const { type = 'budget', fiscalYear } = req.query;
  const payload = await buildReportPayload(fiscalYear);

  let csv = '';
  let filename = `civicledger-${type}-report.csv`;

  if (type === 'budget') {
    csv = toCsv(payload.departmentReport, [
      { key: 'code', label: 'Department Code' },
      { key: 'departmentName', label: 'Department Name' },
      { key: 'headOfDepartment', label: 'Department Head' },
      { key: 'allocatedAmount', label: 'Allocated Budget' },
      { key: 'spentAmount', label: 'Amount Spent' },
      { key: 'remainingBalance', label: 'Remaining Balance' },
      { key: 'utilizationPercentage', label: 'Utilization (%)' },
    ]);
  } else if (type === 'spending') {
    csv = toCsv(payload.expenditures, [
      { key: 'referenceNumber', label: 'Reference No' },
      { label: 'Date', value: (r) => new Date(r.transactionDate).toISOString().split('T')[0] },
      { label: 'Department', value: (r) => r.department?.name || '' },
      { label: 'Project', value: (r) => r.project?.name || 'General Operations' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'amount', label: 'Amount' },
    ]);
  } else if (type === 'projects') {
    csv = toCsv(payload.projects, [
      { key: 'name', label: 'Project Name' },
      { label: 'Department', value: (r) => r.department?.name || '' },
      { key: 'location', label: 'Location' },
      { key: 'allocatedBudget', label: 'Allocated Budget' },
      { key: 'amountSpent', label: 'Amount Spent' },
      { key: 'status', label: 'Status' },
      { key: 'completionPercentage', label: 'Completion (%)' },
      { label: 'Start Date', value: (r) => new Date(r.startDate).toISOString().split('T')[0] },
      { label: 'Expected Completion', value: (r) => new Date(r.expectedCompletionDate).toISOString().split('T')[0] },
    ]);
  } else if (type === 'voting') {
    csv = toCsv(payload.proposals, [
      { key: 'title', label: 'Proposal Title' },
      { key: 'category', label: 'Category' },
      { key: 'location', label: 'Location' },
      { key: 'estimatedBudget', label: 'Estimated Budget' },
      { key: 'status', label: 'Status' },
      { key: 'voteCount', label: 'Total Votes' },
      { label: 'Submitted By', value: (r) => r.submittedBy?.name || 'Citizen' },
    ]);
  } else {
    throw new AppError('Invalid report type. Use budget, spending, projects, or voting.', 400);
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});
