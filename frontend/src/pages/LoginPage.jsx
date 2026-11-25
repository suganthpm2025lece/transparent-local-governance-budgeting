import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorBanner } from '../components/UI';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      showToast(`Signed in as ${user.name}`, 'success');
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/citizen', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@civicledger.demo');
      setPassword('AdminPassword123!');
    } else {
      setEmail('citizen@civicledger.demo');
      setPassword('CitizenPassword123!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="gov-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950">Portal Sign In</h1>
          <p className="mt-1 text-sm text-slate-600">
            Access your citizen dashboard or municipal administrator console.
          </p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="gov-label">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.org"
              className="gov-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="gov-label">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="gov-input"
            />
          </div>

          <button type="submit" disabled={submitting} className="gov-btn-primary w-full py-3">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>

        {/* Demo Account Quick-Fill for Evaluators */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
            Demonstration Accounts (Live MongoDB Auth)
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('citizen')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Fill Demo Citizen
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-navy-200 bg-navy-50 text-navy-800 text-xs font-semibold hover:bg-navy-100 transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Fill Demo Admin
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          New resident?{' '}
          <Link to="/register" className="font-semibold text-civic-green hover:underline">
            Register a Citizen Account
          </Link>
        </p>
      </div>
    </div>
  );
}
