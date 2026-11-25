import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FilePlus2, MapPin, Calendar, ExternalLink, ShieldCheck, X } from 'lucide-react';
import api, { getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, StatusBadge } from '../components/UI';

export default function ProposalListingPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [proposals, setProposals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'Approved',
    adminRemarks: '',
    createProject: false,
    departmentId: '',
  });
  const [savingReview, setSavingReview] = useState(false);

  const fetchProposals = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      const [propRes, deptRes] = await Promise.all([
        api.get(`/proposals?${params.toString()}`),
        api.get('/departments'),
      ]);
      setProposals(propRes.data.proposals || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProposals();
  };

  const openReviewModal = (proposal) => {
    setReviewTarget(proposal);
    setReviewForm({
      status: proposal.status === 'Pending' ? 'Approved' : proposal.status,
      adminRemarks: proposal.adminRemarks || '',
      createProject: false,
      departmentId: departments[0]?._id || '',
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setSavingReview(true);
    try {
      await api.patch(`/proposals/${reviewTarget._id}/status`, reviewForm);
      showToast(`Proposal updated to ${reviewForm.status}.`, 'success');
      setReviewTarget(null);
      fetchProposals();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Citizen Community Proposals</h1>
          <p className="text-sm text-slate-600">
            Browse public development ideas submitted by residents and track municipal review status.
          </p>
        </div>
        <Link to={isAuthenticated ? '/proposals/new' : '/login'} className="gov-btn-green">
          <FilePlus2 className="w-4 h-4" />
          Submit New Proposal
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="gov-card p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="gov-label text-xs">Search Title, Description, or Location</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search proposals..."
              className="gov-input pl-9"
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className="gov-label text-xs">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="gov-input">
            <option value="All">All Categories</option>
            {PROPOSAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="gov-label text-xs">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="gov-input">
            <option value="All">All Statuses</option>
            {PROPOSAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="gov-btn-primary w-full">Apply Search</button>
        </div>
      </form>

      <ErrorBanner message={error} onRetry={fetchProposals} />

      {loading ? (
        <LoadingState message="Loading proposals..." />
      ) : proposals.length === 0 ? (
        <EmptyState
          title="No proposals match your filters"
          description="Try clearing your search filters or submit a new proposal for your neighborhood."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {proposals.map((p) => (
            <div key={p._id} className="gov-card p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-navy-50 text-navy-800">
                    {p.category}
                  </span>
                  <StatusBadge status={p.status} />
                </div>

                <h2 className="text-lg font-bold text-navy-950">{p.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-civic-green" />
                    {p.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(p.createdAt)}
                  </span>
                  <span>By: {p.submittedBy?.name || 'Citizen'} ({p.submittedBy?.ward || 'Resident'})</span>
                </div>

                {p.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={getAssetUrl(att.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}

                {p.adminRemarks && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong>Municipal Review:</strong> {p.adminRemarks}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Estimated Budget</span>
                  <span className="text-base font-extrabold text-navy-950">{formatCurrency(p.estimatedBudget)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {p.status === 'Approved' && (
                    <Link to="/voting" className="gov-btn-green py-1.5 px-3 text-xs">
                      Vote ({p.voteCount})
                    </Link>
                  )}
                  {isAdmin && (
                    <button onClick={() => openReviewModal(p)} className="gov-btn-outline py-1.5 px-3 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-navy-700" />
                      Admin Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950">Review Proposal</h3>
              <button onClick={() => setReviewTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-700">{reviewTarget.title}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="gov-label">Decision / Status</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm((f) => ({ ...f, status: e.target.value }))}
                  className="gov-input"
                >
                  {PROPOSAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="gov-label">Official Review Remarks</label>
                <textarea
                  rows={3}
                  value={reviewForm.adminRemarks}
                  onChange={(e) => setReviewForm((f) => ({ ...f, adminRemarks: e.target.value }))}
                  placeholder="Provide feedback or approval justification..."
                  className="gov-input"
                />
              </div>

              {!reviewTarget.linkedProject && (reviewForm.status === 'Approved' || reviewForm.status === 'Completed') && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-navy-950">
                    <input
                      type="checkbox"
                      checked={reviewForm.createProject}
                      onChange={(e) => setReviewForm((f) => ({ ...f, createProject: e.target.checked }))}
                    />
                    Automatically launch tracked Public Project
                  </label>
                  {reviewForm.createProject && (
                    <select
                      value={reviewForm.departmentId}
                      onChange={(e) => setReviewForm((f) => ({ ...f, departmentId: e.target.value }))}
                      className="gov-input text-xs"
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewTarget(null)} className="gov-btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={savingReview} className="gov-btn-primary">
                  {savingReview ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
