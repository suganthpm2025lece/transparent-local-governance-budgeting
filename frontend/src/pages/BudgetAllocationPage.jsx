import { useEffect, useState } from 'react';
import { Wallet, Building2, Plus, CheckCircle2, Globe } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { ErrorBanner, LoadingState, ProgressBar, StatusBadge } from '../components/UI';

export default function BudgetAllocationPage() {
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [budgetForm, setBudgetForm] = useState({
    fiscalYear: new Date().getFullYear() + 1,
    title: '',
    totalAmount: '',
    description: '',
    status: 'draft',
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    headOfDepartment: '',
    description: '',
    color: '#0f2d5e',
  });

  const [allocForm, setAllocForm] = useState({
    budgetId: '',
    departmentId: '',
    allocatedAmount: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [budRes, deptRes] = await Promise.all([api.get('/budgets'), api.get('/departments?includeInactive=true')]);
      const buds = budRes.data.budgets || [];
      const depts = deptRes.data.departments || [];
      setBudgets(buds);
      setDepartments(depts);
      setAllocForm((f) => ({
        ...f,
        budgetId: f.budgetId || buds[0]?._id || '',
        departmentId: f.departmentId || depts[0]?._id || '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', { ...budgetForm, isDemoData: true });
      showToast('Annual budget created.', 'success');
      setBudgetForm({ fiscalYear: new Date().getFullYear() + 1, title: '', totalAmount: '', description: '', status: 'draft' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', deptForm);
      showToast('Government department added.', 'success');
      setDeptForm({ name: '', code: '', headOfDepartment: '', description: '', color: '#0f2d5e' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocForm.budgetId) return;
    try {
      await api.put(`/budgets/${allocForm.budgetId}/allocate`, {
        departmentId: allocForm.departmentId,
        allocatedAmount: Number(allocForm.allocatedAmount),
        notes: allocForm.notes,
      });
      showToast('Funds allocated to department.', 'success');
      setAllocForm((f) => ({ ...f, allocatedAmount: '', notes: '' }));
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePublishToggle = async (budget) => {
    const nextStatus = budget.status === 'published' ? 'archived' : 'published';
    try {
      await api.put(`/budgets/${budget._id}`, { status: nextStatus });
      showToast(`Budget marked as ${nextStatus}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingState message="Loading budget allocation workspace..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950">Budget &amp; Department Fund Allocation</h1>
        <p className="text-sm text-slate-600">
          Create annual budgets, register municipal departments, allocate funds, and publish budgets to the public portal.
        </p>
      </div>

      <ErrorBanner message={error} onRetry={loadData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Annual Budget */}
        <form onSubmit={handleCreateBudget} className="gov-card p-5 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-navy-950">
            <Wallet className="w-5 h-5 text-civic-green" />
            <h2>1. Create Annual Budget</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="gov-label text-xs">Fiscal Year *</label>
              <input type="number" required value={budgetForm.fiscalYear} onChange={(e) => setBudgetForm((f) => ({ ...f, fiscalYear: e.target.value }))} className="gov-input" />
            </div>
            <div>
              <label className="gov-label text-xs">Initial Status</label>
              <select value={budgetForm.status} onChange={(e) => setBudgetForm((f) => ({ ...f, status: e.target.value }))} className="gov-input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div>
            <label className="gov-label text-xs">Budget Title *</label>
            <input required value={budgetForm.title} onChange={(e) => setBudgetForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., FY 2027 Municipal Budget" className="gov-input" />
          </div>
          <div>
            <label className="gov-label text-xs">Total Amount (USD) *</label>
            <input type="number" required min={0} value={budgetForm.totalAmount} onChange={(e) => setBudgetForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder="15000000" className="gov-input" />
          </div>
          <div>
            <label className="gov-label text-xs">Description</label>
            <textarea rows={2} value={budgetForm.description} onChange={(e) => setBudgetForm((f) => ({ ...f, description: e.target.value }))} className="gov-input" />
          </div>
          <button type="submit" className="gov-btn-primary w-full">
            <Plus className="w-4 h-4" /> Create Budget
          </button>
        </form>

        {/* Add Department */}
        <form onSubmit={handleCreateDept} className="gov-card p-5 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-navy-950">
            <Building2 className="w-5 h-5 text-navy-700" />
            <h2>2. Add Department</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="gov-label text-xs">Department Name *</label>
              <input required value={deptForm.name} onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))} placeholder="Clean Energy" className="gov-input" />
            </div>
            <div>
              <label className="gov-label text-xs">Code *</label>
              <input required maxLength={10} value={deptForm.code} onChange={(e) => setDeptForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ENG" className="gov-input" />
            </div>
          </div>
          <div>
            <label className="gov-label text-xs">Department Head</label>
            <input value={deptForm.headOfDepartment} onChange={(e) => setDeptForm((f) => ({ ...f, headOfDepartment: e.target.value }))} placeholder="Director Name" className="gov-input" />
          </div>
          <div>
            <label className="gov-label text-xs">Description</label>
            <textarea rows={2} value={deptForm.description} onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))} className="gov-input" />
          </div>
          <button type="submit" className="gov-btn-outline w-full">
            <Plus className="w-4 h-4" /> Register Department
          </button>
        </form>

        {/* Allocate Funds */}
        <form onSubmit={handleAllocate} className="gov-card p-5 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-navy-950">
            <CheckCircle2 className="w-5 h-5 text-civic-green" />
            <h2>3. Allocate Department Funds</h2>
          </div>
          <div>
            <label className="gov-label text-xs">Select Budget *</label>
            <select value={allocForm.budgetId} onChange={(e) => setAllocForm((f) => ({ ...f, budgetId: e.target.value }))} className="gov-input">
              {budgets.map((b) => <option key={b._id} value={b._id}>FY {b.fiscalYear} — {b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="gov-label text-xs">Select Department *</label>
            <select value={allocForm.departmentId} onChange={(e) => setAllocForm((f) => ({ ...f, departmentId: e.target.value }))} className="gov-input">
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div>
            <label className="gov-label text-xs">Allocated Amount (USD) *</label>
            <input type="number" required min={0} value={allocForm.allocatedAmount} onChange={(e) => setAllocForm((f) => ({ ...f, allocatedAmount: e.target.value }))} placeholder="2500000" className="gov-input" />
          </div>
          <div>
            <label className="gov-label text-xs">Allocation Notes</label>
            <input value={allocForm.notes} onChange={(e) => setAllocForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Program mandate..." className="gov-input" />
          </div>
          <button type="submit" className="gov-btn-green w-full">Save Allocation</button>
        </form>
      </div>

      {/* Existing Budgets List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-navy-950">All Municipal Budgets</h2>
        {budgets.map((b) => {
          const allocatedTotal = (b.allocations || []).reduce((s, a) => s + (a.allocatedAmount || 0), 0);
          const unallocated = Math.max(0, b.totalAmount - allocatedTotal);
          const allocPct = b.totalAmount > 0 ? Math.round((allocatedTotal / b.totalAmount) * 100) : 0;

          return (
            <div key={b._id} className="gov-card p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-navy-950">FY {b.fiscalYear}: {b.title}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{b.description}</p>
                </div>
                <button onClick={() => handlePublishToggle(b)} className="gov-btn-outline py-1.5 px-3 text-xs">
                  <Globe className="w-3.5 h-3.5 text-civic-green" />
                  {b.status === 'published' ? 'Archive Budget' : 'Publish to Public Dashboard'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 block">Total Budget Ceiling</span>
                  <strong className="text-navy-950">{formatCurrency(b.totalAmount)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Allocated to Departments</span>
                  <strong className="text-civic-green">{formatCurrency(allocatedTotal)} ({allocPct}%)</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Unallocated Reserve</span>
                  <strong className="text-slate-800">{formatCurrency(unallocated)}</strong>
                </div>
              </div>

              <ProgressBar value={allocPct} showLabel={false} />

              {(b.allocations || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {b.allocations.map((a, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-navy-950">{a.department?.name || 'Department'}</p>
                        <p className="text-slate-500">{a.notes || a.department?.code}</p>
                      </div>
                      <strong className="text-navy-900 text-sm">{formatCurrency(a.allocatedAmount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
