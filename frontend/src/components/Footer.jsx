import { Link } from 'react-router-dom';
import { Landmark, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 text-white">
            <Landmark className="w-6 h-6 text-emerald-400" />
            <span className="text-lg font-extrabold tracking-tight">CivicLedger Portal</span>
          </div>
          <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
            Transparent Local Governance &amp; Participatory Budgeting Platform. Empowering citizens to inspect public budgets, track expenditures, submit proposals, and vote on neighborhood priorities.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-300 bg-navy-900 px-3 py-1.5 rounded-lg border border-navy-800">
            <ShieldCheck className="w-4 h-4" />
            <span>Sample Demonstration Dataset — No Real Public Funds Represented</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Public Access</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/dashboard" className="hover:text-white transition">Public Budget Dashboard</Link></li>
            <li><Link to="/spending" className="hover:text-white transition">Spending Tracker</Link></li>
            <li><Link to="/projects" className="hover:text-white transition">Development Projects</Link></li>
            <li><Link to="/reports" className="hover:text-white transition">Financial Reports &amp; CSV</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Citizen Participation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/proposals" className="hover:text-white transition">Browse Proposals</Link></li>
            <li><Link to="/proposals/new" className="hover:text-white transition">Submit Proposal</Link></li>
            <li><Link to="/voting" className="hover:text-white transition">Participatory Voting</Link></li>
            <li><Link to="/feedback" className="hover:text-white transition">Contact &amp; Feedback</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-900 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CivicLedger — Transparent Local Governance &amp; Budgeting. Built with MERN Stack.
      </div>
    </footer>
  );
}
