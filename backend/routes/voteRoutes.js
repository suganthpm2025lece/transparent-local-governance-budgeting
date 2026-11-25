const express = require('express');
const voteController = require('../controllers/voteController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/ballot', optionalAuth, voteController.getVotingBallot);
router.get('/my', protect, voteController.getMyVotes);
router.post('/:proposalId', protect, voteController.castVote);

module.exports = router;
