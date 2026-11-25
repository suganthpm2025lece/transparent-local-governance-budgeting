import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Wallet, TrendingUp, PiggyBank, HardHat, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EmptyState, ErrorBanner, LoadingState, ProgressBar, StatCard, StatusBadge } from '../components/UI';

const CHART_COLORS = ['#0f2d5e', '#059669', '#1d4ed8', '#0284c7', '#0d9488', '#16a34a', '#6366f1'];

export default function PublicDashboardPage() {
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async (year = '') => {
    setLoading(true);
    setError('');
    try {
      const query = year ? `?fiscalYear=${year}` : '';
      const res = await api.get(`/budgets/dashboard${query}`);
      setData(res.data);
      if (!year && res.data?.budget?.fiscalYear) {
        setSelectedYear(String(res.data.budget.fiscalYear));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleYearChange = (e) => {
    const yr = e.target.value;
    setSelectedYear(yr);
    fetchDashboard(yr);
  };

  if (loading) return <LoadingState message="Loading public budget dashboard..." />;
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ErrorBanner message={error} onRetry={() => fetchDashboard(selectedYear)} />
      </div>
    );
  }

  if (!data?.budget) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState
          title="No published municipal budgets yet"
          description="Once an administrator publishes an annual budget, allocations and spending charts will appear here."
        />
      </div>
    );
  }

  const { budget, availableBudgets, summary, departmentBreakdown, monthlySpendingTrend, recentActivities } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Public Budget Dashboard</h1>
            {budget.isDemoData && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Sample Demo Data
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{budget.title} — {budget.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="gov-input w-auto font-semibold"
            aria-label="Select Fiscal Year"
          >
            {availableBudgets.map((b) => (
              <option key={b._id} value={b.fiscalYear}>
                FY {b.fiscalYear} ({b.status})
              </option>
            ))}
          </select>
          <Link to="/reports" className="gov-btn-outline">
            <FileSpreadsheet className="w-4 h-4" />
            Export Reports
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Allocated Budget"
          value={formatCurrency(summary.totalAllocatedBudget)}
          subtitle={`Dept. Assigned: ${formatCurrency(summary.totalDepartmentAllocated)}`}
          icon={Wallet}
          accent="navy"
        />
        <StatCard
          title="Total Amount Spent"
          value={formatCurrency(summary.totalSpent)}
          subtitle={`${summary.utilizationPercentage}% budget utilized`}
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          title="Remaining Balance"
          value={formatCurrency(summary.remainingBudget)}
          subtitle={`Unallocated reserve: ${formatCurrency(summary.unallocatedFunds)}`}
          icon={PiggyBank}
          accent="blue"
        />
        <StatCard
          title="Active Public Projects"
          value={summary.activeProjectsCount}
          subtitle={`${summary.completedProjectsCount} completed • ${summary.approvedProposalsCount} proposals on ballot`}
          icon={HardHat}
          accent="amber"
        />
      </div>

      {/* Overall Utilization Bar */}
      <div className="gov-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-navy-950">Overall Annual Budget Utilization</h2>
            <p className="text-xs text-slate-500">
              Verified municipal expenditures against total FY {budget.fiscalYear} appropriation
            </p>
          </div>
          <span className="text-lg font-extrabold text-civic-green">{summary.utilizationPercentage}% Utilized</span>
        </div>
        <ProgressBar value={summary.utilizationPercentage} showLabel={false} />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Spent: {formatCurrency(summary.totalSpent)}</span>
          <span>Total Budget: {formatCurrency(summary.totalAllocatedBudget)}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="gov-card p-6 lg:col-span-7">
          <h3 className="text-base font-bold text-navy-950">Department Budget Allocation vs. Spending</h3>
          <p className="text-xs text-slate-500 mb-4">Comparing appropriated funds against recorded expenditures</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdown} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: '#334155' }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="allocatedAmount" name="Allocated" fill="#1b3a77" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spentAmount" name="Spent" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gov-card p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-navy-950">Allocation Share by Department</h3>
          <p className="text-xs text-slate-500 mb-4">Proportional distribution of FY {budget.fiscalYear} funds</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentBreakdown}
                  dataKey="allocatedAmount"
                  nameKey="departmentName"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {departmentBreakdown.map((entry, idx) => (
                    <Cell key={entry.departmentId} fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Spending Trend & Department Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="gov-card p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-navy-950">Monthly Expenditure Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Disbursement trajectory across recorded months</p>
          {monthlySpendingTrend.length === 0 ? (
            <p className="text-sm text-slate-500 py-16 text-center">No expenditure transactions recorded for this budget yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpendingTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="amount" name="Spent" stroke="#059669" fill="#d1fae5" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="gov-card p-6 lg:col-span-7 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-950">Department-Wise Breakdown</h3>
              <p className="text-xs text-slate-500">Allocated funds, expenditures, and remaining balances</p>
            </div>
            <Link to="/spending" className="text-xs font-semibold text-civic-green hover:underline flex items-center gap-1">
              Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2.5 pr-3">Department</th>
                <th className="py-2.5 px-3 text-right">Allocated</th>
                <th className="py-2.5 px-3 text-right">Spent</th>
                <th className="py-2.5 px-3 text-right">Remaining</th>
                <th className="py-2.5 pl-3 w-36">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentBreakdown.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-navy-950">{dept.departmentName}</p>
                    <p className="text-xs text-slate-500">{dept.code} • {dept.headOfDepartment}</p>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{formatCurrency(dept.allocatedAmount)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-civic-green">{formatCurrency(dept.spentAmount)}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{formatCurrency(dept.remainingBalance)}</td>
                  <td className="py-3 pl-3">
                    <ProgressBar value={dept.spendingPercentage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Financial & Civic Activities */}
      <div className="gov-card p-6">
        <h3 className="text-base font-bold text-navy-950 mb-4">Recent Financial &amp; Governance Activities</h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activities logged.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={`${act.type}-${act.id}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        act.type === 'expenditure' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy-700'
                      }`}
                    >
                      {act.type}
                    </span>
                    <span className="font-semibold text-sm text-navy-950">{act.title}</span>
                    {act.status && <StatusBadge status={act.status} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{act.subtitle}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="font-bold text-sm text-navy-900">{formatCurrency(act.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(act.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
