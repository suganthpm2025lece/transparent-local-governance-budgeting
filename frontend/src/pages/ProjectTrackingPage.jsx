import { useEffect, useState } from 'react';
import { HardHat, MapPin, Calendar, Plus, RefreshCw, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, PROJECT_STATUSES } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, ProgressBar, StatusBadge } from '../components/UI';

export default function ProjectTrackingPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    departmentId: '',
    budgetId: '',
    location: '',
    allocatedBudget: '',
    startDate: '',
    expectedCompletionDate: '',
    status: 'Planned',
    completionPercentage: 10,
    contractor: '',
  });

  const [updateTarget, setUpdateTarget] = useState(null);
  const [progressForm, setProgressForm] = useState({ status: 'In Progress', completionPercentage: 50, note: '' });

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (deptFilter !== 'All') params.append('departmentId', deptFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const [projRes, deptRes, budRes] = await Promise.all([
        api.get(`/projects?${params.toString()}`),
        api.get('/departments'),
        api.get('/budgets'),
      ]);
      setProjects(projRes.data.projects || []);
      const depts = deptRes.data.departments || [];
      const buds = budRes.data.budgets || [];
      setDepartments(depts);
      setBudgets(buds);
      setCreateForm((f) => ({
        ...f,
        departmentId: f.departmentId || depts[0]?._id || '',
        budgetId: f.budgetId || buds[0]?._id || '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [deptFilter, statusFilter]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', createForm);
      showToast('Development project added to tracker.', 'success');
      setShowCreate(false);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!updateTarget) return;
    try {
      await api.patch(`/projects/${updateTarget._id}/progress`, progressForm);
      showToast('Project milestone & status updated.', 'success');
      setUpdateTarget(null);
      loadAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Development Project Tracking</h1>
          <p className="text-sm text-slate-600">
            Monitor municipal infrastructure timelines, budget utilization, and verified progress milestones.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="gov-btn-green">
            <Plus className="w-4 h-4" />
            Add Public Project
          </button>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadAll();
        }}
        className="gov-card p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-5">
          <label className="gov-label text-xs">Search Project Name, Location, or Contractor</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="gov-input"
          />
        </div>
        <div className="md:col-span-3">
          <label className="gov-label text-xs">Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="gov-input">
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="gov-label text-xs">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="gov-input">
            <option value="All">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="gov-btn-primary w-full">Filter</button>
        </div>
      </form>

      <ErrorBanner message={error} onRetry={loadAll} />

      {loading ? (
        <LoadingState message="Loading development projects..." />
      ) : projects.length === 0 ? (
        <EmptyState title="No public projects found" description="Try adjusting your department or status filter." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p._id} className="gov-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-civic-green">{p.department?.name || 'Department'}</span>
                  <h2 className="text-lg font-bold text-navy-950 mt-0.5">{p.name}</h2>
                </div>
                <StatusBadge status={p.status} />
              </div>

              {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Project Budget</span>
                  <strong className="text-navy-950 text-sm">{formatCurrency(p.allocatedBudget)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Spent So Far</span>
                  <strong className="text-civic-green text-sm">{formatCurrency(p.amountSpent)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Start Date</span>
                  <strong className="text-slate-800">{formatDate(p.startDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Finish</span>
                  <strong className="text-slate-800">{formatDate(p.expectedCompletionDate)}</strong>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Completion Progress</span>
                  <span>{p.completionPercentage}%</span>
                </div>
                <ProgressBar value={p.completionPercentage} showLabel={false} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-civic-green" />
                  {p.location}
                </span>
                <span className="flex items-center gap-1">
                  <HardHat className="w-3.5 h-3.5 text-slate-400" />
                  {p.contractor}
                </span>
              </div>

              {p.progressUpdates?.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest Milestone Updates</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {[...p.progressUpdates].reverse().map((u, idx) => (
                      <div key={u._id || idx} className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/70">
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(u.updatedAt)}
                          </span>
                          <span className="font-semibold text-civic-green">{u.percentage}%</span>
                        </div>
                        <p className="text-slate-700">{u.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setUpdateTarget(p);
                      setProgressForm({
                        status: p.status,
                        completionPercentage: p.completionPercentage,
                        note: '',
                      });
                    }}
                    className="gov-btn-outline py-1.5 px-3 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Update Progress
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950">Create Public Development Project</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="gov-label">Project Name *</label>
                <input required value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className="gov-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Department *</label>
                  <select value={createForm.departmentId} onChange={(e) => setCreateForm((f) => ({ ...f, departmentId: e.target.value }))} className="gov-input">
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gov-label">Budget Year *</label>
                  <select value={createForm.budgetId} onChange={(e) => setCreateForm((f) => ({ ...f, budgetId: e.target.value }))} className="gov-input">
                    {budgets.map((b) => <option key={b._id} value={b._id}>FY {b.fiscalYear} ({b.status})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Location *</label>
                  <input required value={createForm.location} onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))} className="gov-input" />
                </div>
                <div>
                  <label className="gov-label">Allocated Budget ($) *</label>
                  <input type="number" required min={0} value={createForm.allocatedBudget} onChange={(e) => setCreateForm((f) => ({ ...f, allocatedBudget: e.target.value }))} className="gov-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Start Date *</label>
                  <input type="date" required value={createForm.startDate} onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value }))} className="gov-input" />
                </div>
                <div>
                  <label className="gov-label">Expected Completion *</label>
                  <input type="date" required value={createForm.expectedCompletionDate} onChange={(e) => setCreateForm((f) => ({ ...f, expectedCompletionDate: e.target.value }))} className="gov-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Contractor</label>
                  <input value={createForm.contractor} onChange={(e) => setCreateForm((f) => ({ ...f, contractor: e.target.value }))} className="gov-input" />
                </div>
                <div>
                  <label className="gov-label">Initial Progress (%)</label>
                  <input type="number" min={0} max={100} value={createForm.completionPercentage} onChange={(e) => setCreateForm((f) => ({ ...f, completionPercentage: e.target.value }))} className="gov-input" />
                </div>
              </div>
              <div>
                <label className="gov-label">Description</label>
                <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} className="gov-input" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="gov-btn-outline">Cancel</button>
                <button type="submit" className="gov-btn-green">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {updateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950">Update Project Progress</h3>
              <button onClick={() => setUpdateTarget(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-sm font-semibold text-slate-700">{updateTarget.name}</p>
            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <label className="gov-label">Project Status</label>
                <select value={progressForm.status} onChange={(e) => setProgressForm((f) => ({ ...f, status: e.target.value }))} className="gov-input">
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="gov-label">Completion Percentage ({progressForm.completionPercentage}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressForm.completionPercentage}
                  onChange={(e) => setProgressForm((f) => ({ ...f, completionPercentage: Number(e.target.value) }))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label className="gov-label">Progress Milestone Note *</label>
                <textarea
                  required
                  rows={3}
                  value={progressForm.note}
                  onChange={(e) => setProgressForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Describe completed work or field inspection findings..."
                  className="gov-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setUpdateTarget(null)} className="gov-btn-outline">Cancel</button>
                <button type="submit" className="gov-btn-primary">Save Progress</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
