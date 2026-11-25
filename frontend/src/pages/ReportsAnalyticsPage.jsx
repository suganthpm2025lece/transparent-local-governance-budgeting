import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Printer } from 'lucide-react';
import api, { getExportUrl } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ErrorBanner, LoadingState, StatusBadge } from '../components/UI';

export default function ReportsAnalyticsPage() {
  const [report, setReport] = useState(null);
  const [fiscalYear, setFiscalYear] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async (year = '') => {
    setLoading(true);
    setError('');
    try {
      const q = year ? `?fiscalYear=${year}` : '';
      const [repRes, budRes] = await Promise.all([api.get(`/reports/summary${q}`), api.get('/budgets')]);
      setReport(repRes.data);
      setBudgets(budRes.data.budgets || []);
      if (!year && repRes.data?.budget?.fiscalYear) {
        setFiscalYear(String(repRes.data.budget.fiscalYear));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) return <LoadingState message="Compiling transparency & analytics reports..." />;
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ErrorBanner message={error} onRetry={() => loadReports(fiscalYear)} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Reports &amp; Financial Analytics</h1>
          <p className="text-sm text-slate-600">
            Generate, print, and download CSV transparency reports across budgets, expenditures, projects, and voting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <select
            value={fiscalYear}
            onChange={(e) => {
              setFiscalYear(e.target.value);
              loadReports(e.target.value);
            }}
            className="gov-input w-auto"
          >
            {budgets.map((b) => (
              <option key={b._id} value={b.fiscalYear}>FY {b.fiscalYear}</option>
            ))}
          </select>
          <button onClick={() => window.print()} className="gov-btn-primary">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Downloadable CSV Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {[
          { type: 'budget', title: 'Annual Budget Report', desc: 'Department allocations, spend & balances' },
          { type: 'spending', title: 'Spending Ledger CSV', desc: 'Full line-item public expenditures' },
          { type: 'projects', title: 'Project Progress Report', desc: 'Timelines, statuses & completion %' },
          { type: 'voting', title: 'Proposal Voting Report', desc: 'Citizen proposals & ballot standings' },
        ].map((item) => (
          <a
            key={item.type}
            href={getExportUrl(item.type, fiscalYear)}
            download
            className="gov-card p-5 hover:border-civic-green transition flex flex-col justify-between gap-3"
          >
            <div>
              <h2 className="font-bold text-navy-950 text-sm">{item.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-green">
              <Download className="w-4 h-4" />
              Download CSV
            </span>
          </a>
        ))}
      </div>

      {/* Annual Budget Overview */}
      {report?.budget && (
        <div className="gov-card p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-navy-950">{report.budget.title}</h2>
              <p className="text-xs text-slate-500">Generated {formatDate(report.generatedAt)} • {report.disclaimer}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Overall Utilization</span>
              <strong className="text-lg text-civic-green">{report.budget.utilizationPercentage}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50">
              <span className="text-slate-500 text-xs block">Total Annual Budget</span>
              <strong className="text-xl text-navy-950">{formatCurrency(report.budget.totalAmount)}</strong>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50">
              <span className="text-emerald-700 text-xs block">Total Disbursed</span>
              <strong className="text-xl text-emerald-900">{formatCurrency(report.budget.totalSpent)}</strong>
            </div>
            <div className="p-4 rounded-xl bg-navy-50">
              <span className="text-navy-700 text-xs block">Remaining Funds</span>
              <strong className="text-xl text-navy-950">{formatCurrency(report.budget.remainingBudget)}</strong>
            </div>
          </div>

          <div className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.departmentReport}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="allocatedAmount" name="Allocated" fill="#1b3a77" />
                <Bar dataKey="spentAmount" name="Spent" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Department Report Table */}
      <div className="gov-card p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-navy-950 mb-4">Department-Wise Financial Summary</h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2.5 pr-4">Department</th>
              <th className="py-2.5 px-3">Head</th>
              <th className="py-2.5 px-3 text-right">Allocated</th>
              <th className="py-2.5 px-3 text-right">Spent</th>
              <th className="py-2.5 px-3 text-right">Remaining</th>
              <th className="py-2.5 pl-3 text-right">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(report?.departmentReport || []).map((d) => (
              <tr key={d.code}>
                <td className="py-3 pr-4 font-semibold text-navy-950">{d.departmentName} ({d.code})</td>
                <td className="py-3 px-3 text-slate-600">{d.headOfDepartment}</td>
                <td className="py-3 px-3 text-right">{formatCurrency(d.allocatedAmount)}</td>
                <td className="py-3 px-3 text-right font-semibold text-civic-green">{formatCurrency(d.spentAmount)}</td>
                <td className="py-3 px-3 text-right">{formatCurrency(d.remainingBalance)}</td>
                <td className="py-3 pl-3 text-right font-bold">{d.utilizationPercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project & Voting Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-6 overflow-x-auto">
          <h2 className="text-lg font-bold text-navy-950 mb-4">Project Progress Summary</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 uppercase text-slate-500">
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 pl-2 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report?.projects || []).map((p) => (
                <tr key={p._id}>
                  <td className="py-2.5 pr-3 font-medium text-navy-950">{p.name}</td>
                  <td className="py-2.5 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-2.5 pl-2 text-right font-bold">{p.completionPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gov-card p-6 overflow-x-auto">
          <h2 className="text-lg font-bold text-navy-950 mb-4">Proposal Voting Standings</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 uppercase text-slate-500">
                <th className="py-2 pr-3">Proposal</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 pl-2 text-right">Votes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report?.proposals || []).map((p) => (
                <tr key={p._id}>
                  <td className="py-2.5 pr-3 font-medium text-navy-950">{p.title}</td>
                  <td className="py-2.5 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-2.5 pl-2 text-right font-bold text-civic-green">{p.voteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
