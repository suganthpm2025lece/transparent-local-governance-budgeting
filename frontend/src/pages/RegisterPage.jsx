import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ErrorBanner } from '../components/UI';

const WARDS = [
  'Ward 1 - Central',
  'Ward 2 - Oakridge',
  'Ward 3 - Northside',
  'Ward 4 - Riverside',
  'Ward 5 - Westview',
  'Ward 6 - Eastgate',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    ward: WARDS[0],
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        ward: form.ward,
        address: form.address,
      });
      showToast('Citizen account created! Welcome to CivicLedger.', 'success');
      navigate('/citizen');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="gov-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-civic-green flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-950">Citizen Registration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create an account to submit community proposals, vote on initiatives, and track responses.
          </p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="gov-label">Full Name *</label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Jordan Alvarez"
              className="gov-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="gov-label">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.org"
                className="gov-input"
              />
            </div>
            <div>
              <label htmlFor="phone" className="gov-label">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1-555-0199"
                className="gov-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ward" className="gov-label">Neighborhood / Ward</label>
              <select id="ward" name="ward" value={form.ward} onChange={handleChange} className="gov-input">
                {WARDS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="address" className="gov-label">Street Address (Optional)</label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Private — never shown publicly"
                className="gov-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="gov-label">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className="gov-input"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="gov-label">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="gov-input"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Privacy guarantee: Your email, phone, and address are strictly protected and never displayed on public transparency pages.
          </p>

          <button type="submit" disabled={submitting} className="gov-btn-green w-full py-3">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Citizen Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-navy-800 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
