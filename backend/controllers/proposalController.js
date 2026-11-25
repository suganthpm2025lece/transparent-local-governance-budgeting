const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Project = require('../models/Project');
const Budget = require('../models/Budget');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notify');

// GET /api/proposals
exports.listProposals = asyncHandler(async (req, res) => {
  const { search = '', category, status, mine, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const filter = {};

  if (category && category !== 'All') filter.category = category;
  if (status && status !== 'All') filter.status = status;

  if (mine === 'true') {
    if (!req.user) {
      throw new AppError('Authentication required to view your own proposals.', 401);
    }
    filter.submittedBy = req.user._id;
  }

  if (search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }];
  }

  const allowedSorts = ['createdAt', 'voteCount', 'estimatedBudget'];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const proposals = await Proposal.find(filter)
    .populate('submittedBy', 'name ward')
    .populate('linkedProject', 'name status completionPercentage')
    .sort({ [sortField]: sortDir })
    .lean();

  // If authenticated, mark which proposals this citizen has already voted on
  let votedIds = new Set();
  if (req.user) {
    const votes = await Vote.find({ citizen: req.user._id }).select('proposal').lean();
    votedIds = new Set(votes.map((v) => String(v.proposal)));
  }

  const enriched = proposals.map((p) => ({
    ...p,
    hasVoted: votedIds.has(String(p._id)),
  }));

  res.status(200).json({
    success: true,
    count: enriched.length,
    proposals: enriched,
  });
});

// GET /api/proposals/:id
exports.getProposalById = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id)
    .populate('submittedBy', 'name ward')
    .populate('linkedProject', 'name status completionPercentage allocatedBudget amountSpent')
    .lean();

  if (!proposal) {
    throw new AppError('Proposal not found.', 404);
  }

  let hasVoted = false;
  if (req.user) {
    const vote = await Vote.findOne({ proposal: proposal._id, citizen: req.user._id }).lean();
    hasVoted = Boolean(vote);
  }

  res.status(200).json({
    success: true,
    proposal: { ...proposal, hasVoted },
  });
});

// POST /api/proposals (Citizen or Admin)
exports.createProposal = asyncHandler(async (req, res) => {
  const { title, description, category, location, estimatedBudget, attachmentUrl, attachmentName } = req.body;

  const attachments = [];
  if (Array.isArray(req.files)) {
    for (const file of req.files) {
      attachments.push({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
      });
    }
  }

  if (attachmentUrl && String(attachmentUrl).trim()) {
    attachments.push({
      name: attachmentName?.trim() || 'Supporting Document Link',
      url: String(attachmentUrl).trim(),
      type: 'link',
    });
  }

  const proposal = await Proposal.create({
    title,
    description,
    category,
    location,
    estimatedBudget: Number(estimatedBudget),
    attachments,
    submittedBy: req.user._id,
    status: 'Pending',
  });

  const populated = await Proposal.findById(proposal._id)
    .populate('submittedBy', 'name ward')
    .lean();

  res.status(201).json({
    success: true,
    message: 'Proposal submitted successfully and queued for municipal review.',
    proposal: populated,
  });
});

// PATCH /api/proposals/:id/status (Admin only)
exports.updateProposalStatus = asyncHandler(async (req, res) => {
  const { status, adminRemarks, votingDeadline, createProject, departmentId } = req.body;

  const proposal = await Proposal.findById(req.params.id);
  if (!proposal) {
    throw new AppError('Proposal not found.', 404);
  }

  proposal.status = status;
  if (adminRemarks !== undefined) proposal.adminRemarks = adminRemarks;
  proposal.reviewedBy = req.user._id;
  proposal.reviewedAt = new Date();

  if (status === 'Approved') {
    proposal.votingDeadline = votingDeadline
      ? new Date(votingDeadline)
      : proposal.votingDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // Optional: Convert approved/completed proposal directly into a tracked Project
  if (createProject && !proposal.linkedProject) {
    const activeBudget = await Budget.findOne({ status: 'published' }).sort({ fiscalYear: -1 });
    let targetDept = null;
    if (departmentId) {
      targetDept = await Department.findById(departmentId);
    } else {
      targetDept = await Department.findOne({ isActive: true });
    }

    if (activeBudget && targetDept) {
      const start = new Date();
      const end = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const project = await Project.create({
        name: proposal.title,
        description: proposal.description,
        department: targetDept._id,
        budget: activeBudget._id,
        proposal: proposal._id,
        location: proposal.location,
        allocatedBudget: proposal.estimatedBudget,
        startDate: start,
        expectedCompletionDate: end,
        status: status === 'Completed' ? 'Completed' : 'Planned',
        completionPercentage: status === 'Completed' ? 100 : 5,
        progressUpdates: [
          {
            note: 'Project initiated from approved citizen participatory proposal.',
            percentage: status === 'Completed' ? 100 : 5,
            updatedBy: req.user._id,
          },
        ],
      });
      proposal.linkedProject = project._id;
    }
  }

  await proposal.save();

  await createNotification({
    recipient: proposal.submittedBy,
    title: `Proposal Status Updated: ${status}`,
    message: `Your proposal "${proposal.title}" is now marked as ${status}.${adminRemarks ? ` Note: ${adminRemarks}` : ''}`,
    type: 'proposal',
    link: status === 'Approved' ? '/voting' : '/proposals',
  });

  const populated = await Proposal.findById(proposal._id)
    .populate('submittedBy', 'name ward')
    .populate('linkedProject', 'name status completionPercentage')
    .lean();

  res.status(200).json({
    success: true,
    message: `Proposal status updated to ${status}.`,
    proposal: populated,
  });
});
