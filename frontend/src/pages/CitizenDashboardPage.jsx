import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Vote, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, StatCard, StatusBadge } from '../components/UI';

export default function CitizenDashboardPage() {
  const { user, setUnreadNotifications } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [votes, setVotes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [propRes, voteRes, fbRes, notifRes] = await Promise.all([
        api.get('/proposals?mine=true'),
        api.get('/votes/my'),
        api.get('/feedback'),
        api.get('/users/notifications'),
      ]);
      setProposals(propRes.data.proposals || []);
      setVotes(voteRes.data.votes || []);
      setFeedback(fbRes.data.feedback || []);
      setNotifications(notifRes.data.notifications || []);
      setUnreadNotifications(notifRes.data.unreadCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Loading your civic workspace..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-600">
            {user?.ward} • Track your community proposals, cast votes, and municipal responses.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/proposals/new" className="gov-btn-green">
            <FilePlus2 className="w-4 h-4" />
            Submit Proposal
          </Link>
          <Link to="/voting" className="gov-btn-primary">
            <Vote className="w-4 h-4" />
            Vote on Proposals
          </Link>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={loadData} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="My Proposals" value={proposals.length} subtitle="Submitted initiatives" icon={FilePlus2} accent="navy" />
        <StatCard
          title="Approved Proposals"
          value={proposals.filter((p) => p.status === 'Approved' || p.status === 'Completed').length}
          subtitle="Cleared municipal review"
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard title="Votes Cast" value={votes.length} subtitle="Participatory ballots" icon={Vote} accent="blue" />
        <StatCard title="Feedback Tickets" value={feedback.length} subtitle="Inquiries & complaints" icon={MessageSquare} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* My Proposals */}
        <div className="gov-card p-6 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950">My Submitted Proposals</h2>
            <Link to="/proposals/new" className="text-xs font-semibold text-civic-green hover:underline">
              + New Proposal
            </Link>
          </div>
          {proposals.length === 0 ? (
            <EmptyState
              title="No proposals submitted yet"
              description="Have an idea to improve roads, parks, schools, or water in your neighborhood?"
              action={
                <Link to="/proposals/new" className="gov-btn-green">
                  Submit First Proposal
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {proposals.map((p) => (
                <div key={p._id} className="py-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-navy-950">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {p.category} • {p.location} • Est. {formatCurrency(p.estimatedBudget)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.adminRemarks && (
                    <p className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700">
                      <strong>Admin Review Note:</strong> {p.adminRemarks}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Submitted {formatDate(p.createdAt)}</span>
                    <span>{p.voteCount} votes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Votes & Notifications */}
        <div className="lg:col-span-5 space-y-6">
          <div className="gov-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-navy-950">My Participatory Votes</h2>
            {votes.length === 0 ? (
              <p className="text-sm text-slate-500">
                You haven&apos;t voted yet. Visit the{' '}
                <Link to="/voting" className="text-civic-green font-semibold hover:underline">
                  Voting Ballot
                </Link>{' '}
                to support approved projects.
              </p>
            ) : (
              <div className="space-y-2.5">
                {votes.map((v) => (
                  <div key={v._id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                    <p className="font-semibold text-sm text-navy-950">{v.proposal?.title || 'Proposal'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Voted on {formatDate(v.createdAt)} • Total votes: {v.proposal?.voteCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="gov-card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-navy-800" />
              <h2 className="text-lg font-bold text-navy-950">Recent Notifications</h2>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.slice(0, 6).map((n) => (
                  <Link
                    key={n._id}
                    to={n.link || '/'}
                    className={`block p-3 rounded-lg border text-xs ${
                      n.isRead ? 'bg-white border-slate-200' : 'bg-navy-50/50 border-navy-200'
                    }`}
                  >
                    <p className="font-bold text-navy-950">{n.title}</p>
                    <p className="text-slate-600 mt-0.5">{n.message}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
