import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus2, Upload, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { PROPOSAL_CATEGORIES } from '../utils/formatters';
import { ErrorBanner } from '../components/UI';

export default function ProposalSubmissionPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    category: PROPOSAL_CATEGORIES[0],
    location: '',
    estimatedBudget: '',
    description: '',
    attachmentName: '',
    attachmentUrl: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('location', form.location);
      formData.append('estimatedBudget', form.estimatedBudget);
      formData.append('description', form.description);
      if (form.attachmentUrl.trim()) {
        formData.append('attachmentUrl', form.attachmentUrl.trim());
        formData.append('attachmentName', form.attachmentName.trim() || 'Supporting Document');
      }
      for (const file of files) {
        formData.append('attachments', file);
      }

      await api.post('/proposals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Proposal submitted! It is now visible in the Administrator review queue.', 'success');
      navigate('/proposals');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="gov-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-civic-green flex items-center justify-center">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy-950">Submit Community Proposal</h1>
            <p className="text-sm text-slate-600">
              Propose a neighborhood development initiative for review and participatory citizen voting.
            </p>
          </div>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label htmlFor="title" className="gov-label">Proposal Title *</label>
            <input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={160}
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Solar Pedestrian Crosswalk Near Northside Elementary"
              className="gov-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="gov-label">Development Category *</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} className="gov-input">
                {PROPOSAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="estimatedBudget" className="gov-label">Estimated Budget (USD) *</label>
              <input
                id="estimatedBudget"
                name="estimatedBudget"
                type="number"
                required
                min={100}
                value={form.estimatedBudget}
                onChange={handleChange}
                placeholder="e.g., 85000"
                className="gov-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="gov-label">Neighborhood / Ward / Exact Location *</label>
            <input
              id="location"
              name="location"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Ward 3 - Northside Elementary Crossing"
              className="gov-input"
            />
          </div>

          <div>
            <label htmlFor="description" className="gov-label">Detailed Description &amp; Public Benefit *</label>
            <textarea
              id="description"
              name="description"
              required
              minLength={20}
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the problem, proposed solution, affected residents, and expected community impact (at least 20 characters)..."
              className="gov-input"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Upload className="w-4 h-4 text-civic-green" />
              <span>Supporting Documents or Site Photos (Optional)</span>
            </div>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-800 file:text-white hover:file:bg-navy-900"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <input
                name="attachmentName"
                value={form.attachmentName}
                onChange={handleChange}
                placeholder="External doc title (optional)"
                className="gov-input text-xs"
              />
              <input
                name="attachmentUrl"
                type="url"
                value={form.attachmentUrl}
                onChange={handleChange}
                placeholder="https://... supporting link (optional)"
                className="gov-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="gov-btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="gov-btn-green px-6">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
