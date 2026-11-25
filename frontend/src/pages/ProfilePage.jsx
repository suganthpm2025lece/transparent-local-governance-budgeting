import { useState } from 'react';
import { User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { ErrorBanner } from '../components/UI';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    ward: user?.ward || '',
    address: user?.address || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [error, setError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      await refreshProfile();
      showToast('Profile information updated.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setError('New passwords do not match.');
    }
    setSavingPw(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Account Profile &amp; Security</h1>
          <p className="text-sm text-slate-600">Manage your civic profile details and account credentials</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-navy-900 text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {user?.role} Role
        </span>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleProfileSubmit} className="gov-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-navy-950 font-bold">
            <User className="w-5 h-5 text-civic-green" />
            <h2>Personal Details</h2>
          </div>

          <div>
            <label className="gov-label">Email Address</label>
            <input value={user?.email || ''} disabled className="gov-input bg-slate-100 text-slate-500" />
          </div>
          <div>
            <label className="gov-label">Full Name</label>
            <input
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
              className="gov-input"
            />
          </div>
          <div>
            <label className="gov-label">Phone</label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
              className="gov-input"
            />
          </div>
          <div>
            <label className="gov-label">Ward / District</label>
            <input
              value={profileForm.ward}
              onChange={(e) => setProfileForm((f) => ({ ...f, ward: e.target.value }))}
              className="gov-input"
            />
          </div>
          <div>
            <label className="gov-label">Address</label>
            <input
              value={profileForm.address}
              onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
              className="gov-input"
            />
          </div>

          <button type="submit" disabled={savingProfile} className="gov-btn-primary w-full">
            {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Profile
          </button>
        </form>

        <form onSubmit={handlePwSubmit} className="gov-card p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-navy-950 font-bold">
            <Lock className="w-5 h-5 text-navy-700" />
            <h2>Change Password</h2>
          </div>

          <div>
            <label className="gov-label">Current Password</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className="gov-input"
            />
          </div>
          <div>
            <label className="gov-label">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className="gov-input"
            />
          </div>
          <div>
            <label className="gov-label">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className="gov-input"
            />
          </div>

          <button type="submit" disabled={savingPw} className="gov-btn-green w-full">
            {savingPw && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
