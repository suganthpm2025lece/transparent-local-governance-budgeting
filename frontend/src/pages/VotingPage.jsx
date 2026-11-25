import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Vote, CheckCircle2, Clock, Trophy, MapPin } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDeadlineCountdown, PROPOSAL_CATEGORIES } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, ProgressBar } from '../components/UI';

export default function VotingPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [ballot, setBallot] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votingId, setVotingId] = useState(null);

  const loadBallot = async () => {
    setLoading(true);
    setError('');
    try {
      const q = category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
      const { data } = await api.get(`/votes/ballot${q}`);
      setBallot(data.proposals || []);
      setTotalVotes(data.totalVotes || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBallot();
  }, [category]);

  const handleVote = async (proposalId) => {
    if (!isAuthenticated) {
      showToast('Please sign in as a registered citizen to cast your vote.', 'info');
      return;
    }
    setVotingId(proposalId);
    try {
      const { data } = await api.post(`/votes/${proposalId}`, {});
      showToast(data.message || 'Vote recorded!', 'success');
      await loadBallot();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Participatory Budgeting &amp; Voting</h1>
          <p className="text-sm text-slate-600">
            Vote on municipality-approved citizen proposals. One verified vote per citizen per proposal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="gov-input w-auto"
            aria-label="Filter ballot by category"
          >
            <option value="All">All Categories</option>
            {PROPOSAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-bold">
            {totalVotes} Total Votes
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="rounded-xl bg-navy-50 border border-navy-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy-900 font-medium">
            Sign in with your Citizen account to cast your vote on approved community initiatives.
          </p>
          <Link to="/login" state={{ from: '/voting' }} className="gov-btn-primary py-2 px-4 text-xs">
            Sign In to Vote
          </Link>
        </div>
      )}

      <ErrorBanner message={error} onRetry={loadBallot} />

      {loading ? (
        <LoadingState message="Loading live participatory ballot..." />
      ) : ballot.length === 0 ? (
        <EmptyState
          title="No approved proposals on the ballot yet"
          description="Administrators review submitted citizen proposals before opening them for public voting."
        />
      ) : (
        <>
          {/* Live Results Chart */}
          <div className="gov-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-civic-green" />
              <h2 className="text-lg font-bold text-navy-950">Live Voting Standings</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ballot.map((b) => ({
                    name: b.title.length > 28 ? `${b.title.slice(0, 28)}…` : b.title,
                    votes: b.voteCount,
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip />
                  <Bar dataKey="votes" name="Citizen Votes" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Proposal Ballot Cards */}
          <div className="space-y-4">
            {ballot.map((p) => (
              <div key={p._id} className="gov-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-navy-900 text-white text-xs font-bold">
                      Rank #{p.rank}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      {p.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDeadlineCountdown(p.votingDeadline)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy-950">{p.title}</h3>
                  <p className="text-sm text-slate-600">{p.description}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-civic-green" />
                      {p.location}
                    </span>
                    <span>Est. Cost: <strong>{formatCurrency(p.estimatedBudget)}</strong></span>
                    <span>Proposed by: {p.submittedBy?.name || 'Citizen'}</span>
                  </div>

                  <div className="pt-1 max-w-md">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>{p.voteCount} votes</span>
                      <span>{p.sharePercentage}% of ballot</span>
                    </div>
                    <ProgressBar value={p.sharePercentage} showLabel={false} />
                  </div>
                </div>

                <div className="lg:w-52 shrink-0 flex flex-col items-stretch sm:items-end justify-center gap-2">
                  {p.hasVoted ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Vote Recorded
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVote(p._id)}
                      disabled={votingId === p._id || p.isDeadlinePassed || !isAuthenticated}
                      className="gov-btn-green py-2.5 px-5"
                    >
                      <Vote className="w-4 h-4" />
                      {p.isDeadlinePassed
                        ? 'Voting Closed'
                        : votingId === p._id
                          ? 'Recording...'
                          : isAuthenticated
                            ? 'Vote for Proposal'
                            : 'Sign In to Vote'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
