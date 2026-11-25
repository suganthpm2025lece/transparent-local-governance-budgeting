export function formatCurrency(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDeadlineCountdown(deadline) {
  if (!deadline) return 'No deadline set';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Voting closed';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export const PROPOSAL_CATEGORIES = [
  'Roads and transportation',
  'Education',
  'Healthcare',
  'Drinking water',
  'Sanitation',
  'Parks and public facilities',
];

export const PROPOSAL_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'];

export const PROJECT_STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed'];

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'Approved':
    case 'Completed':
    case 'Resolved':
    case 'published':
    case 'verified':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
    case 'Under Review':
    case 'In Review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Pending':
    case 'Planned':
    case 'Open':
    case 'draft':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Rejected':
    case 'On Hold':
    case 'archived':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
