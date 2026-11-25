import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  FileCheck2,
  HardHat,
  Users,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  Landmark,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import DemoBanner from '../components/DemoBanner';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin', label: 'Overview & Review', icon: LayoutDashboard, end: true },
  { to: '/admin/budgets', label: 'Budget Allocation', icon: Wallet },
  { to: '/spending', label: 'Department Spending', icon: Receipt },
  { to: '/proposals', label: 'Citizen Proposals', icon: FileCheck2 },
  { to: '/projects', label: 'Project Tracking', icon: HardHat },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/feedback', label: 'Feedback Desk', icon: MessageSquare },
  { to: '/admin/users', label: 'Citizen Accounts', icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <div className="flex-1 flex">
        {/* Desktop & Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-950 text-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 no-print ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-16 px-5 flex items-center justify-between border-b border-navy-800">
            <Link to="/" className="flex items-center gap-2.5 text-white">
              <Landmark className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold tracking-tight">CivicLedger Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-civic-green text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-navy-800 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-navy-900 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              View Public Portal
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/60 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out ({user?.name?.split(' ')[0]})
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-navy-950">
                  Government Administration Console
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Manage municipal budgets, citizen proposals, public projects &amp; expenditures
                </p>
              </div>
            </div>
            <Link to="/profile" className="text-xs font-semibold text-navy-800 hover:underline">
              {user?.name} (Admin)
            </Link>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
