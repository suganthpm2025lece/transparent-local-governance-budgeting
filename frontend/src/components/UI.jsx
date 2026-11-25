import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { getStatusBadgeClass } from '../utils/formatters';

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, accent = 'navy' }) {
  const accentMap = {
    navy: 'bg-navy-50 text-navy-800 border-navy-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
  };

  return (
    <div className="gov-card p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight truncate">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border shrink-0 ${accentMap[accent] || accentMap.navy}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value = 0, colorClass = 'bg-civic-green', showLabel = true }) {
  const clamped = Math.min(100, Math.max(0, Number(value || 0)));
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-end text-xs font-semibold text-slate-600">{clamped}%</div>
      )}
    </div>
  );
}

export function LoadingState({ message = 'Loading municipal records...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3 text-rose-900">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold underline hover:text-rose-700 shrink-0">
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No records found', description, action }) {
  return (
    <div className="gov-card p-10 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
