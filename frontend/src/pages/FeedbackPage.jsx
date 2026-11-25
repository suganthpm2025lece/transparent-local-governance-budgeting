import { useEffect, useState } from 'react';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { ErrorBanner, LoadingState, StatusBadge } from '../components/UI';

export default function FeedbackPage() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    senderName: user?.name || '',
    senderEmail: user?.email || '',
    type: 'Suggestion',
    departmentId: '',
    projectId: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [respondTarget, setRespondTarget] = useState(null);
  const [respondForm, setRespondForm] = useState({ status: 'Resolved', adminResponse: '' });

  const loadData = async () => {
    try {
      const [deptRes, projRes] = await Promise.all([api.get('/departments'), api.get('/projects')]);
      setDepartments(deptRes.data.departments || []);
      setProjects(projRes.data.projects || []);
      if (isAuthenticated) {
        setLoadingList(true);
        const fbRes = await api.get('/feedback');
        setFeedbackList(fbRes.data.feedback || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        ...form,
        departmentId: form.departmentId || undefined,
        projectId: form.projectId || undefined,
      });
      showToast('Thank you! Your feedback has been logged with the municipality.', 'success');
      setForm((f) => ({ ...f, subject: '', message: '' }));
      if (isAuthenticated) loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!respondTarget) return;
    try {
      await api.patch(`/feedback/${respondTarget._id}/respond`, respondForm);
      showToast('Official response saved.', 'success');
      setRespondTarget(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Contact, Complaints &amp; Feedback</h1>
        <p className="text-sm text-slate-600">
          Report service issues, ask budget questions, or suggest governance improvements directly to municipal staff.
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="gov-card p-6 lg:col-span-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-navy-950 font-bold">
            <MessageSquare className="w-5 h-5 text-civic-green" />
            <h2>Submit Feedback or Complaint</h2>
          </div>

          {!isAuthenticated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="gov-label">Your Name *</label>
                <input
                  required
                  value={form.senderName}
                  onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
                  className="gov-input"
                />
              </div>
              <div>
                <label className="gov-label">Your Email *</label>
                <input
                  type="email"
                  required
                  value={form.senderEmail}
                  onChange={(e) => setForm((f) => ({ ...f, senderEmail: e.target.value }))}
                  className="gov-input"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="gov-label">Feedback Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="gov-input">
                <option value="Suggestion">Suggestion</option>
                <option value="Complaint">Complaint</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Appreciation">Appreciation</option>
              </select>
            </div>
            <div>
              <label className="gov-label">Related Department</label>
              <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="gov-input">
                <option value="">General / Municipality</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="gov-label">Related Project (Optional)</label>
            <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="gov-input">
              <option value="">None</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="gov-label">Subject *</label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief summary of your feedback"
              className="gov-input"
            />
          </div>

          <div>
            <label className="gov-label">Message *</label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Provide details, locations, or project references..."
              className="gov-input"
            />
          </div>

          <button type="submit" disabled={submitting} className="gov-btn-green w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Feedback
          </button>
        </form>

        {/* Feedback History / Admin Desk */}
        <div className="gov-card p-6 lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-navy-950">
            {isAdmin ? 'All Citizen Feedback & Complaints' : 'My Submitted Feedback & Responses'}
          </h2>

          {!isAuthenticated ? (
            <p className="text-sm text-slate-600">
              Sign in to track status updates and official municipal responses to your submitted complaints or inquiries.
            </p>
          ) : loadingList ? (
            <LoadingState message="Loading feedback tickets..." />
          ) : feedbackList.length === 0 ? (
            <p className="text-sm text-slate-500">No feedback submissions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedbackList.map((fb) => (
                <div key={fb._id} className="py-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded mr-2">
                        {fb.type}
                      </span>
                      <span className="font-bold text-sm text-navy-950">{fb.subject}</span>
                    </div>
                    <StatusBadge status={fb.status} />
                  </div>
                  <p className="text-sm text-slate-700">{fb.message}</p>
                  <p className="text-xs text-slate-400">
                    {isAdmin && `From: ${fb.senderName} (${fb.senderEmail}) • `}
                    Submitted {formatDate(fb.createdAt)}
                    {fb.department?.name ? ` • ${fb.department.name}` : ''}
                  </p>
                  {fb.adminResponse && (
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950">
                      <strong>Official Response:</strong> {fb.adminResponse}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setRespondTarget(fb);
                          setRespondForm({ status: fb.status, adminResponse: fb.adminResponse || '' });
                        }}
                        className="gov-btn-outline py-1 px-3 text-xs"
                      >
                        Respond / Update Status
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {respondTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-950">Respond to Feedback</h3>
              <button onClick={() => setRespondTarget(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-sm font-semibold text-slate-700">{respondTarget.subject}</p>
            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label className="gov-label">Ticket Status</label>
                <select value={respondForm.status} onChange={(e) => setRespondForm((f) => ({ ...f, status: e.target.value }))} className="gov-input">
                  {['Open', 'In Review', 'Resolved', 'Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="gov-label">Official Response</label>
                <textarea
                  required
                  rows={3}
                  value={respondForm.adminResponse}
                  onChange={(e) => setRespondForm((f) => ({ ...f, adminResponse: e.target.value }))}
                  className="gov-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRespondTarget(null)} className="gov-btn-outline">Cancel</button>
                <button type="submit" className="gov-btn-primary">Save Response</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
