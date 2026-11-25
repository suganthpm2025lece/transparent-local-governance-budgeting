import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Eye, Scale, FileSpreadsheet, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="gov-card p-8 sm:p-10 bg-gradient-to-br from-navy-950 to-navy-800 text-white border-0">
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
          About CivicLedger
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Building Public Trust Through Open Municipal Finance
        </h1>
        <p className="mt-4 text-slate-300 max-w-3xl text-base leading-relaxed">
          CivicLedger is a full-stack Transparent Local Governance &amp; Participatory Budgeting platform designed to bridge the gap between municipal administrations and everyday citizens. By publishing real-time department allocations, transaction-level expenditures, project progress, and citizen voting results in one accessible portal, communities gain verifiable accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Eye,
            title: 'Radical Budget Visibility',
            text: 'No login required to inspect published annual budgets, department spending percentages, or ongoing infrastructure progress.',
          },
          {
            icon: Users,
            title: 'Participatory Democracy',
            text: 'Registered citizens propose neighborhood improvements and vote on approved initiatives with database-enforced one-vote-per-proposal integrity.',
          },
          {
            icon: Scale,
            title: 'Role-Based Accountability',
            text: 'Strict separation between public visitors, citizens, and authenticated municipal administrators with full audit timestamps.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="gov-card p-6">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-civic-green flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-navy-950">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          );
        })}
      </div>

      <div className="gov-card p-8 space-y-6">
        <h2 className="text-2xl font-bold text-navy-950">Access Levels &amp; Governance Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="font-bold text-navy-900">Public Visitor</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>View published annual budgets</li>
              <li>Inspect department-wise spending</li>
              <li>Monitor ongoing &amp; completed projects</li>
              <li>Download CSV &amp; printable reports</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <h3 className="font-bold text-emerald-900">Registered Citizen</h3>
            <ul className="mt-3 space-y-2 text-sm text-emerald-950/80 list-disc list-inside">
              <li>Submit community proposals with budgets</li>
              <li>Vote once per approved proposal</li>
              <li>Track personal proposal review status</li>
              <li>Submit complaints &amp; receive responses</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-navy-50/70 border border-navy-200">
            <h3 className="font-bold text-navy-950">Government Administrator</h3>
            <ul className="mt-3 space-y-2 text-sm text-navy-900/80 list-disc list-inside">
              <li>Create &amp; publish annual budgets</li>
              <li>Allocate funds across departments</li>
              <li>Approve/reject proposals &amp; launch projects</li>
              <li>Record expenditures &amp; update milestones</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-5 h-5 text-civic-green" />
            <span>Note: Sample datasets in this environment are clearly labeled for demonstration only.</span>
          </div>
          <Link to="/dashboard" className="gov-btn-primary">
            <FileSpreadsheet className="w-4 h-4" />
            Open Public Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
