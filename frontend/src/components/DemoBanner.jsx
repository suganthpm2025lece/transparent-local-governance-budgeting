import { ShieldAlert } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-navy-950 text-slate-200 text-xs py-1.5 px-4 border-b border-navy-800 no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white font-semibold">Demonstration Portal:</strong> Financial figures shown are clearly labeled sample municipal data for CivicLedger evaluation.
          </span>
        </div>
        <span className="text-emerald-300 font-medium hidden sm:inline">
          Open Municipal Transparency Standard
        </span>
      </div>
    </div>
  );
}
