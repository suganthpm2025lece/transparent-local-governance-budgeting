import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FilePlus2,
  Landmark,
  ShieldCheck,
  Vote,
  Wallet,
  HardHat,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { ProgressBar, StatusBadge } from '../components/UI';

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [ballot, setBallot] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/budgets/dashboard').catch(() => ({ data: null })),
      api.get('/projects').catch(() => ({ data: { projects: [] } })),
      api.get('/votes/ballot').catch(() => ({ data: { proposals: [] } })),
    ]).then(([dashRes, projRes, ballotRes]) => {
      if (dashRes.data) setDashboard(dashRes.data);
      setProjects((projRes.data?.projects || []).slice(0, 3));
      setBallot((ballotRes.data?.proposals || []).slice(0, 3));
    });
  }, []);

  const summary = dashboard?.summary;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Open Civic Finance &amp; Participatory Democracy</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Every Public Dollar Tracked.{' '}
              <span className="text-emerald-400">Every Citizen Heard.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              CivicLedger gives residents open visibility into municipal budgets, real-time department expenditures, development project milestones, and participatory voting on neighborhood proposals.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/dashboard" className="gov-btn-green px-6 py-3 text-base">
                Explore Budget Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/proposals/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition"
              >
                <FilePlus2 className="w-4 h-4" />
                Submit a Proposal
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Live Snapshot (Sample Demo Data)
                </span>
                <span className="text-xs text-slate-300">
                  FY {dashboard?.budget?.fiscalYear || '2026'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-navy-950/50 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300">Total Budget</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {summary ? formatCurrency(summary.totalAllocatedBudget) : '$12,000,000'}
                  </p>
                </div>
                <div className="bg-navy-950/50 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300">Public Spent</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">
                    {summary ? formatCurrency(summary.totalSpent) : 'Loading...'}
                  </p>
                </div>
                <div className="bg-navy-950/50 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300">Active Projects</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {summary ? summary.activeProjectsCount : '—'}
                  </p>
                </div>
                <div className="bg-navy-950/50 rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300">Citizen Votes</p>
                  <p className="mt-1 text-xl font-bold text-emerald-400">
                    {summary ? summary.totalVotesCast : '—'}
                  </p>
                </div>
              </div>
              <Link
                to="/voting"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-navy-950 font-bold text-sm transition"
              >
                <Vote className="w-4 h-4" />
                Cast Your Participatory Vote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-950">How Civic Transparency Works</h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Four connected workflows bringing accountability from annual budget drafting to completed neighborhood infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Wallet,
              title: '1. Open Budget Allocation',
              desc: 'Inspect published municipal budgets and see exact allocations across Roads, Education, Healthcare, Water, Sanitation, and Parks.',
              link: '/dashboard',
            },
            {
              icon: FilePlus2,
              title: '2. Citizen Proposals',
              desc: 'Residents submit community improvement ideas with estimated budgets, locations, and supporting documents.',
              link: '/proposals',
            },
            {
              icon: Vote,
              title: '3. Democratic Voting',
              desc: 'Approved proposals enter the public ballot where verified citizens cast one tamper-resistant vote per initiative.',
              link: '/voting',
            },
            {
              icon: HardHat,
              title: '4. Live Project & Spend Tracking',
              desc: 'Follow contractor milestones, completion percentages, and line-item expenditures from start to finish.',
              link: '/projects',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="gov-card p-6 hover:border-navy-300 hover:shadow-md transition group"
              >
                <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center mb-4 group-hover:bg-navy-800 group-hover:text-white transition">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-navy-950">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{card.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Active Projects & Top Voted Proposals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-navy-950">Featured Public Projects</h3>
              <p className="text-xs text-slate-500">Live progress from municipal departments</p>
            </div>
            <Link to="/projects" className="text-sm font-semibold text-civic-green hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">Connecting to municipal project ledger...</p>
            ) : (
              projects.map((p) => (
                <div key={p._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-navy-950">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.department?.name} • {p.location}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <ProgressBar value={p.completionPercentage} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="gov-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-navy-950">Top Voted Citizen Proposals</h3>
              <p className="text-xs text-slate-500">Approved community ideas open for ballot</p>
            </div>
            <Link to="/voting" className="text-sm font-semibold text-civic-green hover:underline">
              Vote Now →
            </Link>
          </div>
          <div className="space-y-4">
            {ballot.length === 0 ? (
              <p className="text-sm text-slate-500">Loading active ballot proposals...</p>
            ) : (
              ballot.map((prop, idx) => (
                <div key={prop._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-navy-800 text-white">#{idx + 1}</span>
                      <span className="text-xs font-medium text-civic-green">{prop.category}</span>
                    </div>
                    <p className="font-semibold text-sm text-navy-950 mt-1 truncate">{prop.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Est. Budget: {formatCurrency(prop.estimatedBudget)} • {prop.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-extrabold text-navy-900">{prop.voteCount}</p>
                    <p className="text-[11px] text-slate-500">votes</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="rounded-2xl bg-navy-900 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>Civic Participation</span>
            </div>
            <h3 className="text-2xl font-bold">Ready to shape your local budget?</h3>
            <p className="text-sm text-slate-300">
              Create a free citizen account to submit neighborhood proposals, vote on funded initiatives, and download official transparency reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to="/register" className="gov-btn-green px-5 py-3">
              <CheckCircle2 className="w-4 h-4" />
              Register as Citizen
            </Link>
            <Link to="/reports" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-navy-950 font-semibold text-sm hover:bg-slate-100 transition">
              <BarChart3 className="w-4 h-4" />
              Download Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
