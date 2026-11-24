import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import type { Task } from '../types/todo';

interface DeleteConfirmModalProps {
  task: Task | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  task,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, deleting, onCancel]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-[#E6E0F4] rounded-2xl shadow-lg p-6">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="delete-modal-title" className="text-base font-semibold text-[#1E1B2E]">
              Delete task?
            </h2>
            <p className="mt-1.5 text-sm text-[#5B5470]">
              Are you sure you want to remove{' '}
              <span className="font-medium text-[#1E1B2E]">"{task.title}"</span>? This action
              cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#DCD5EE] bg-white text-[#453E5C] hover:bg-[#FAF9FC] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{deleting ? 'Deleting...' : 'Delete task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
