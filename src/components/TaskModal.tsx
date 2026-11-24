import { AlertCircle, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Task } from '../types/todo';

interface TaskModalProps {
  open: boolean;
  editingTask: Task | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: { title: string; description: string }) => Promise<void>;
}

export function TaskModal({
  open,
  editingTask,
  saving,
  error,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(editingTask?.title ?? '');
      setDescription(editingTask?.description ?? '');
      setLocalError(null);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [open, editingTask]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError('Please enter a task title.');
      titleInputRef.current?.focus();
      return;
    }
    setLocalError(null);
    await onSave({
      title: trimmedTitle,
      description: description.trim(),
    });
  };

  const displayError = localError || error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-[#E6E0F4] rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE7F6]">
          <h2 id="task-modal-title" className="text-lg font-semibold text-[#1E1B2E]">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close modal"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#6E6784] hover:bg-[#F4F1FA] hover:text-[#1E1B2E] cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {displayError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="task-title" className="block text-sm font-medium text-[#1E1B2E]">
                Title
              </label>
              <span className="text-xs font-mono tabular-nums text-[#7B7394]">
                {title.length}/160
              </span>
            </div>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              maxLength={160}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare Q3 product roadmap review"
              className="mt-1.5 block w-full rounded-lg border border-[#DCD5EE] bg-white px-3.5 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="task-description"
                className="block text-sm font-medium text-[#1E1B2E]"
              >
                Description
              </label>
              <span className="text-xs font-mono tabular-nums text-[#7B7394]">
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="task-description"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful context, steps, or notes..."
              className="mt-1.5 block w-full rounded-lg border border-[#DCD5EE] bg-white px-3.5 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20 resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#DCD5EE] bg-white text-[#453E5C] hover:bg-[#FAF9FC] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#623CEA] text-white hover:bg-[#512ED6] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingTask ? (saving ? 'Saving...' : 'Save changes') : saving ? 'Adding...' : 'Add task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
