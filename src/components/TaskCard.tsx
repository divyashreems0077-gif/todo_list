import { Check, CheckCircle2, Circle, Loader2, Pencil, Trash2 } from 'lucide-react';
import type { Task } from '../types/todo';

interface TaskCardProps {
  task: Task;
  toggling: boolean;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function TaskCard({
  task,
  toggling,
  onToggleComplete,
  onEdit,
  onRequestDelete,
}: TaskCardProps) {
  return (
    <article
      className={`group bg-white border rounded-xl p-5 transition-colors duration-150 ${
        task.completed
          ? 'border-[#ECE7F6] bg-[#FCFBFE]'
          : 'border-[#E6E0F4] hover:border-[#C9BCEE]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          disabled={toggling}
          onClick={() => onToggleComplete(task)}
          aria-label={task.completed ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
          className={`mt-0.5 h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA] ${
            task.completed
              ? 'bg-[#623CEA] border-[#623CEA] text-white hover:bg-[#512ED6]'
              : 'bg-white border-[#C9BCEE] text-transparent hover:border-[#623CEA]'
          } disabled:opacity-60`}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`text-base font-semibold leading-snug break-words ${
                task.completed ? 'line-through text-[#7B7394]' : 'text-[#1E1B2E]'
              }`}
            >
              {task.title}
            </h3>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#6E6784] hover:bg-[#F4F1FA] hover:text-[#4C2CE0] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#623CEA]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(task)}
                aria-label={`Delete "${task.title}"`}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#6E6784] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#623CEA]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {task.description ? (
            <p
              className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                task.completed ? 'text-[#8F88A6]' : 'text-[#5B5470]'
              }`}
            >
              {task.description}
            </p>
          ) : (
            <p className="mt-1.5 text-sm italic text-[#9A93B0]">No description added</p>
          )}

          <div className="mt-4 pt-3 border-t border-[#F1ECFA] flex flex-wrap items-center gap-2 text-xs text-[#6E6784]">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                task.completed ? 'text-emerald-700' : 'text-[#5B38E8]'
              }`}
            >
              {task.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{task.completed ? 'Completed' : 'Pending'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Updated {formatDate(task.updatedAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
