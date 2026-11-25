const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/votes/ballot
exports.getVotingBallot = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { status: 'Approved' };
  if (category && category !== 'All') {
    filter.category = category;
  }

  const proposals = await Proposal.find(filter)
    .populate('submittedBy', 'name ward')
    .sort({ voteCount: -1, createdAt: -1 })
    .lean();

  let userVotes = [];
  if (req.user) {
    userVotes = await Vote.find({ citizen: req.user._id }).select('proposal createdAt').lean();
  }
  const votedMap = new Map(userVotes.map((v) => [String(v.proposal), v.createdAt]));

  const totalVotes = proposals.reduce((sum, p) => sum + (p.voteCount || 0), 0);

  const rankedBallot = proposals.map((p, index) => {
    const votes = p.voteCount || 0;
    const sharePercentage = totalVotes > 0 ? Number(((votes / totalVotes) * 100).toFixed(1)) : 0;
    const isDeadlinePassed = p.votingDeadline ? new Date(p.votingDeadline) < new Date() : false;
    return {
      ...p,
      rank: index + 1,
      sharePercentage,
      hasVoted: votedMap.has(String(p._id)),
      votedAt: votedMap.get(String(p._id)) || null,
      isDeadlinePassed,
    };
  });

  res.status(200).json({
    success: true,
    totalVotes,
    count: rankedBallot.length,
    proposals: rankedBallot,
  });
});

// POST /api/votes/:proposalId (Citizen / authenticated user)
exports.castVote = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { comment } = req.body;

  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw new AppError('Proposal not found.', 404);
  }

  if (proposal.status !== 'Approved') {
    throw new AppError('Voting is only open for approved proposals.', 400);
  }

  if (proposal.votingDeadline && new Date(proposal.votingDeadline) < new Date()) {
    throw new AppError('The voting deadline for this proposal has passed.', 400);
  }

  const existingVote = await Vote.findOne({ proposal: proposal._id, citizen: req.user._id });
  if (existingVote) {
    throw new AppError('You have already voted for this proposal.', 409);
  }

  // Create vote (unique index {proposal, citizen} also enforces DB-level constraint)
  const vote = await Vote.create({
    proposal: proposal._id,
    citizen: req.user._id,
    comment: comment || '',
  });

  // Sync denormalized voteCount from authoritative Vote count
  const exactCount = await Vote.countDocuments({ proposal: proposal._id });
  proposal.voteCount = exactCount;
  await proposal.save();

  res.status(201).json({
    success: true,
    message: 'Your vote has been recorded!',
    voteCount: exactCount,
    voteId: vote._id,
  });
});

// GET /api/votes/my (Authenticated user)
exports.getMyVotes = asyncHandler(async (req, res) => {
  const votes = await Vote.find({ citizen: req.user._id })
    .populate({
      path: 'proposal',
      select: 'title category location estimatedBudget status voteCount votingDeadline',
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: votes.length,
    votes,
  });
});
