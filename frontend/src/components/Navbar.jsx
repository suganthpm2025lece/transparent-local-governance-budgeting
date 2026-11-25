import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Menu,
  X,
  Bell,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Budget Dashboard' },
  { to: '/spending', label: 'Spending' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/voting', label: 'Voting' },
  { to: '/projects', label: 'Projects' },
  { to: '/reports', label: 'Reports' },
  { to: '/about', label: 'About' },
  { to: '/feedback', label: 'Feedback' },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, unreadNotifications, setUnreadNotifications, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !notifOpen) return;
    api
      .get('/users/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications || []);
        setUnreadNotifications(data.unreadCount || 0);
      })
      .catch(() => {});
  }, [isAuthenticated, notifOpen, setUnreadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/users/notifications/all/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center shadow-sm">
              <Landmark className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-extrabold text-navy-950 tracking-tight">CivicLedger</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-civic-green">
                Local Governance
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-navy-50 text-navy-900 font-semibold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen((o) => !o);
                      setMenuOpen(false);
                    }}
                    className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-navy-900 transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-civic-green text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-navy-950">Notifications</span>
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-civic-green hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-xs text-slate-500 text-center">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n._id}
                              to={n.link || '/'}
                              onClick={() => setNotifOpen(false)}
                              className={`block p-3.5 hover:bg-slate-50 transition ${!n.isRead ? 'bg-navy-50/40' : ''}`}
                            >
                              <p className="text-xs font-semibold text-navy-950">{n.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setMenuOpen((o) => !o);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-navy-900 transition"
                  >
                    <span className="w-6 h-6 rounded-full bg-navy-800 text-white text-xs flex items-center justify-center font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-navy-950 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role} Account</p>
                      </div>
                      <Link
                        to="/citizen"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-navy-700" />
                        Citizen Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-emerald-700 font-semibold hover:bg-emerald-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Control Panel
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="gov-btn-outline py-2 px-3.5">
                  Sign In
                </Link>
                <Link to="/register" className="gov-btn-green py-2 px-3.5">
                  Register
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-navy-50 text-navy-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {!isAuthenticated && (
            <div className="pt-2 flex gap-2 border-t border-slate-100">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="gov-btn-outline flex-1">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="gov-btn-green flex-1">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
