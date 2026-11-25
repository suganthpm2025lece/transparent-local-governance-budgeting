import { useEffect, useState } from 'react';
import { Search, Plus, Trash2, ArrowUpDown, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, ProgressBar } from '../components/UI';

export default function DepartmentSpendingPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [totalFilteredAmount, setTotalFilteredAmount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [expForm, setExpForm] = useState({
    budgetId: '',
    departmentId: '',
    projectId: '',
    title: '',
    description: '',
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    referenceNumber: '',
  });

  const loadSpending = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (search.trim()) params.append('search', search.trim());
      if (departmentId) params.append('departmentId', departmentId);

      const [expRes, dashRes, deptRes, budRes, projRes] = await Promise.all([
        api.get(`/expenditures?${params.toString()}`),
        api.get('/budgets/dashboard'),
        api.get('/departments'),
        api.get('/budgets'),
        api.get('/projects'),
      ]);

      setExpenditures(expRes.data.expenditures || []);
      setTotalFilteredAmount(expRes.data.totalFilteredAmount || 0);
      setDashboard(dashRes.data);
      const depts = deptRes.data.departments || [];
      const buds = budRes.data.budgets || [];
      setDepartments(depts);
      setBudgets(buds);
      setProjects(projRes.data.projects || []);
      setExpForm((f) => ({
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
    loadSpending();
  }, [departmentId, sortBy, sortOrder]);

  const handleRecordExpenditure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenditures', {
        ...expForm,
        projectId: expForm.projectId || undefined,
      });
      showToast('Expenditure recorded and budget balances updated.', 'success');
      setShowRecordModal(false);
      setExpForm((f) => ({ ...f, title: '', description: '', amount: '', vendorName: '', referenceNumber: '' }));
      loadSpending();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this expenditure transaction?')) return;
    try {
      await api.delete(`/expenditures/${id}`);
      showToast('Expenditure removed.', 'info');
      loadSpending();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Government Spending Tracker</h1>
          <p className="text-sm text-slate-600">
            Searchable ledger of department budgets, transaction-level disbursements, and remaining balances.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowRecordModal(true)} className="gov-btn-green">
            <Plus className="w-4 h-4" />
            Record Expenditure
          </button>
        )}
      </div>

      {/* Department Balance Summary Cards */}
      {dashboard?.departmentBreakdown?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.departmentBreakdown.map((d) => (
            <div key={d.departmentId} className="gov-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-navy-950 text-sm">{d.departmentName}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-navy-50 text-navy-800">{d.code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Allocated</span>
                  <strong className="text-navy-900">{formatCurrency(d.allocatedAmount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Spent</span>
                  <strong className="text-civic-green">{formatCurrency(d.spentAmount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Remaining</span>
                  <strong className="text-slate-700">{formatCurrency(d.remainingBalance)}</strong>
                </div>
              </div>
              <ProgressBar value={d.spendingPercentage} />
            </div>
          ))}
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadSpending();
        }}
        className="gov-card p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-4">
          <label className="gov-label text-xs">Search Description, Vendor, or Reference</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g., Asphalt, EXP-2026..."
              className="gov-input pl-9"
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className="gov-label text-xs">Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="gov-input">
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="gov-label text-xs">Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="gov-input">
            <option value="transactionDate">Transaction Date</option>
            <option value="amount">Amount</option>
            <option value="title">Title</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="gov-btn-outline w-full px-2"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder.toUpperCase()}
          </button>
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="gov-btn-primary w-full">Search Ledger</button>
        </div>
      </form>

      <ErrorBanner message={error} onRetry={loadSpending} />

      {/* Expenditures Table */}
      {loading ? (
        <LoadingState message="Loading expenditure transactions..." />
      ) : expenditures.length === 0 ? (
        <EmptyState title="No expenditure transactions match" description="Adjust your filters or record a new transaction." />
      ) : (
        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-navy-950">{expenditures.length} Transactions Listed</span>
            <span className="text-sm font-bold text-civic-green">
              Filtered Total: {formatCurrency(totalFilteredAmount)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-white">
                  <th className="py-3 px-4">Date &amp; Ref</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Project / Description</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenditures.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-navy-950">{formatDate(exp.transactionDate)}</p>
                      <p className="text-xs text-slate-400">{exp.referenceNumber || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-navy-50 text-navy-800 text-xs font-semibold">
                        {exp.department?.name || 'Department'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-navy-950">{exp.title}</p>
                      <p className="text-xs text-slate-600">{exp.description}</p>
                      {exp.project?.name && (
                        <p className="text-[11px] text-civic-green font-medium mt-0.5">Project: {exp.project.name}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{exp.vendorName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-navy-950 whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expenditure Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950">Record Public Expenditure</h3>
              <button onClick={() => setShowRecordModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordExpenditure} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Budget *</label>
                  <select value={expForm.budgetId} onChange={(e) => setExpForm((f) => ({ ...f, budgetId: e.target.value }))} className="gov-input">
                    {budgets.map((b) => <option key={b._id} value={b._id}>FY {b.fiscalYear} ({b.status})</option>)}
                  </select>
                </div>
                <div>
                  <label className="gov-label">Department *</label>
                  <select value={expForm.departmentId} onChange={(e) => setExpForm((f) => ({ ...f, departmentId: e.target.value }))} className="gov-input">
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="gov-label">Linked Project (Optional)</label>
                <select value={expForm.projectId} onChange={(e) => setExpForm((f) => ({ ...f, projectId: e.target.value }))} className="gov-input">
                  <option value="">General Departmental Operations</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="gov-label">Expenditure Title *</label>
                <input required value={expForm.title} onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))} className="gov-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Amount (USD) *</label>
                  <input type="number" required min={1} step="0.01" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} className="gov-input" />
                </div>
                <div>
                  <label className="gov-label">Transaction Date *</label>
                  <input type="date" required value={expForm.transactionDate} onChange={(e) => setExpForm((f) => ({ ...f, transactionDate: e.target.value }))} className="gov-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="gov-label">Vendor / Payee</label>
                  <input value={expForm.vendorName} onChange={(e) => setExpForm((f) => ({ ...f, vendorName: e.target.value }))} className="gov-input" />
                </div>
                <div>
                  <label className="gov-label">Invoice / Reference No.</label>
                  <input value={expForm.referenceNumber} onChange={(e) => setExpForm((f) => ({ ...f, referenceNumber: e.target.value }))} placeholder="Auto-generated if blank" className="gov-input" />
                </div>
              </div>
              <div>
                <label className="gov-label">Description *</label>
                <textarea required rows={2} value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} className="gov-input" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordModal(false)} className="gov-btn-outline">Cancel</button>
                <button type="submit" className="gov-btn-green">Save Expenditure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
