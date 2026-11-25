import { useEffect, useState } from 'react';
import { Search, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { ErrorBanner, LoadingState, StatusBadge } from '../components/UI';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const { data } = await api.get(`/users${q}`);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleActive = async (target) => {
    try {
      await api.patch(`/users/${target._id}/status`, { isActive: !target.isActive });
      showToast(`Account ${!target.isActive ? 'activated' : 'suspended'}.`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950">Citizen &amp; Staff Accounts</h1>
          <p className="text-sm text-slate-600">Manage registered residents and municipal portal access.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadUsers();
          }}
          className="flex gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, ward..."
              className="gov-input pl-9 w-64"
            />
          </div>
          <button type="submit" className="gov-btn-primary">Search</button>
        </form>
      </div>

      <ErrorBanner message={error} onRetry={loadUsers} />

      {loading ? (
        <LoadingState message="Loading registered accounts..." />
      ) : (
        <div className="gov-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-navy-950">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600">{u.ward}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold ${u.isActive ? 'text-civic-green' : 'text-rose-600'}`}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    {u._id !== currentUser?._id && (
                      <button
                        onClick={() => toggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          u.isActive
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
