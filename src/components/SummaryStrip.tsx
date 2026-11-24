import type { TaskSummary } from '../types/todo';

interface SummaryStripProps {
  summary: TaskSummary;
  loading: boolean;
}

export function SummaryStrip({ summary, loading }: SummaryStripProps) {
  const completionRate =
    summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <section aria-label="Task summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white border border-[#E6E0F4] rounded-xl px-5 py-4">
        <p className="text-xs font-medium text-[#6E6784]">Total Tasks</p>
        <div className="mt-2 flex items-baseline justify-between">
          {loading ? (
            <div className="h-8 w-12 rounded bg-[#F1ECFF] animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-[#1E1B2E] font-mono tabular-nums">
              {summary.total}
            </p>
          )}
          <span className="text-xs text-[#6E6784] font-mono tabular-nums">
            {completionRate}% done
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#F1ECFF] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#623CEA] transition-transform duration-200 origin-left"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-[#E6E0F4] rounded-xl px-5 py-4">
        <p className="text-xs font-medium text-[#6E6784]">Pending Tasks</p>
        <div className="mt-2 flex items-baseline justify-between">
          {loading ? (
            <div className="h-8 w-12 rounded bg-[#F1ECFF] animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-[#1E1B2E] font-mono tabular-nums">
              {summary.pending}
            </p>
          )}
          <span className="text-xs text-[#5B5470]">Active queue</span>
        </div>
        <p className="mt-3 text-xs text-[#6E6784]">
          {summary.pending === 0 ? 'All caught up' : 'Ready for focus'}
        </p>
      </div>

      <div className="bg-white border border-[#E6E0F4] rounded-xl px-5 py-4">
        <p className="text-xs font-medium text-[#6E6784]">Completed Tasks</p>
        <div className="mt-2 flex items-baseline justify-between">
          {loading ? (
            <div className="h-8 w-12 rounded bg-[#F1ECFF] animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-[#1E1B2E] font-mono tabular-nums">
              {summary.completed}
            </p>
          )}
          <span className="text-xs text-emerald-700 font-medium">Finished</span>
        </div>
        <p className="mt-3 text-xs text-[#6E6784]">
          {summary.completed === 0 ? 'No tasks finished yet' : 'Marked as done'}
        </p>
      </div>
    </section>
  );
}
