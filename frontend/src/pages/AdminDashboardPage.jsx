import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, FileCheck2, HardHat, Users, Check, X, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ErrorBanner, LoadingState, StatCard, StatusBadge } from '../components/UI';

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [feedbackOpenCount, setFeedbackOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, propRes, userRes, fbRes] = await Promise.all([
        api.get('/budgets/dashboard'),
        api.get('/proposals'),
        api.get('/users'),
        api.get('/feedback'),
      ]);
      setDashboard(dashRes.data);
      setProposals(propRes.data.proposals || []);
      setUsersCount(userRes.data.count || 0);
      setFeedbackOpenCount((fbRes.data.feedback || []).filter((f) => f.status === 'Open').length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOverview();
  }, []);

  const handleQuickDecision = async (proposalId, status) => {
    try {
      await api.patch(`/proposals/${proposalId}/status`, {
        status,
        adminRemarks:
          status === 'Approved'
            ? 'Approved by Administration for participatory citizen voting.'
            : 'Declined during municipal feasibility review.',
      });
      showToast(`Proposal marked as ${status}.`, 'success');
      loadAdminOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingState message="Loading administration console..." />;

  const summary = dashboard?.summary;
  const pendingQueue = proposals.filter((p) => p.status === 'Pending' || p.status === 'Under Review');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Administrator Command Overview</h1>
          <p className="text-sm text-slate-600">
            Review citizen proposals, oversee municipal budgets, and manage public projects.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/budgets" className="gov-btn-primary">
            Manage Budgets
          </Link>
          <Link to="/spending" className="gov-btn-green">
            Record Expenditure
          </Link>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={loadAdminOverview} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Published Budget"
          value={formatCurrency(summary?.totalAllocatedBudget || 0)}
          subtitle={`${summary?.utilizationPercentage || 0}% spent`}
          icon={Wallet}
          accent="navy"
        />
        <StatCard
          title="Pending Proposals"
          value={pendingQueue.length}
          subtitle={`${proposals.length} total submitted`}
          icon={FileCheck2}
          accent="amber"
        />
        <StatCard
          title="Active Projects"
          value={summary?.activeProjectsCount || 0}
          subtitle={`${summary?.completedProjectsCount || 0} completed`}
          icon={HardHat}
          accent="green"
        />
        <StatCard
          title="Registered Accounts"
          value={usersCount}
          subtitle={`${feedbackOpenCount} open feedback tickets`}
          icon={Users}
          accent="blue"
        />
      </div>

      {/* Proposal Review Queue */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-950">Citizen Proposals Awaiting Decision</h2>
            <p className="text-xs text-slate-500">Approve proposals to publish them directly to the citizen voting ballot</p>
          </div>
          <Link to="/proposals" className="text-xs font-semibold text-civic-green hover:underline flex items-center gap-1">
            All Proposals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingQueue.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">All submitted citizen proposals have been reviewed.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingQueue.map((p) => (
              <div key={p._id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-navy-950">{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-slate-600">{p.description}</p>
                  <p className="text-xs text-slate-500">
                    {p.category} • {p.location} • Est. <strong>{formatCurrency(p.estimatedBudget)}</strong> • Submitted {formatDate(p.createdAt)} by {p.submittedBy?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'Pending' && (
                    <button
                      onClick={() => handleQuickDecision(p._id, 'Under Review')}
                      className="gov-btn-outline py-1.5 px-3 text-xs"
                    >
                      Mark Under Review
                    </button>
                  )}
                  <button
                    onClick={() => handleQuickDecision(p._id, 'Approved')}
                    className="gov-btn-green py-1.5 px-3 text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve for Vote
                  </button>
                  <button
                    onClick={() => handleQuickDecision(p._id, 'Rejected')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link to="/admin/budgets" className="gov-card p-5 hover:border-navy-400 transition">
          <h3 className="font-bold text-navy-950">Create &amp; Publish Budgets →</h3>
          <p className="text-xs text-slate-500 mt-1">Manage annual fiscal ceilings and department allocations.</p>
        </Link>
        <Link to="/projects" className="gov-card p-5 hover:border-navy-400 transition">
          <h3 className="font-bold text-navy-950">Update Project Milestones →</h3>
          <p className="text-xs text-slate-500 mt-1">Log completion percentages and status notes for citizens.</p>
        </Link>
        <Link to="/admin/users" className="gov-card p-5 hover:border-navy-400 transition">
          <h3 className="font-bold text-navy-950">Manage Citizen Accounts →</h3>
          <p className="text-xs text-slate-500 mt-1">Inspect registered residents and manage account status.</p>
        </Link>
      </div>
    </div>
  );
}
