import {
  AlertCircle,
  CheckSquare,
  Menu,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, authApi, tasksApi } from './api/client';
import { AuthView } from './components/AuthView';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Sidebar } from './components/Sidebar';
import { SummaryStrip } from './components/SummaryStrip';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import type { Task, TaskFilter, TaskSort, TaskSummary, User } from './types/todo';

function computeSummary(tasks: Task[]): TaskSummary {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total,
    completed,
    pending: total - completed,
  };
}

const FILTER_TITLES: Record<TaskFilter, string> = {
  all: 'All Tasks',
  pending: 'Pending Tasks',
  completed: 'Completed Tasks',
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSort>('newest');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const clearSession = useCallback((reason?: string) => {
    setToken(null);
    setUser(null);
    setTasks([]);
    setFilter('all');
    setSearchQuery('');
    setModalOpen(false);
    setEditingTask(null);
    setTaskToDelete(null);
    setErrorBanner(reason ?? null);
  }, []);

  const loadTasks = useCallback(
    async (activeToken: string) => {
      setLoadingTasks(true);
      setErrorBanner(null);
      try {
        const data = await tasksApi.list(activeToken);
        setTasks(data.tasks);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearSession('Your session expired. Please sign in again.');
          return;
        }
        setErrorBanner(err instanceof Error ? err.message : 'Unable to load your tasks.');
      } finally {
        setLoadingTasks(false);
      }
    },
    [clearSession],
  );

  useEffect(() => {
    if (token) {
      void loadTasks(token);
    }
  }, [token, loadTasks]);

  const handleAuthenticated = (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    setErrorBanner(null);
  };

  const handleLogout = async () => {
    const activeToken = token;
    clearSession();
    if (activeToken) {
      try {
        await authApi.logout(activeToken);
      } catch {
        // Session state is already cleared in memory
      }
    }
  };

  const summary = useMemo(() => computeSummary(tasks), [tasks]);

  const visibleTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (q) {
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDescription = task.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, filter, searchQuery, sortBy]);

  const openCreateModal = () => {
    setEditingTask(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSaveTask = async (values: { title: string; description: string }) => {
    if (!token) return;
    setSavingTask(true);
    setModalError(null);

    try {
      if (editingTask) {
        const { task: updated } = await tasksApi.update(token, editingTask.id, values);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const { task: created } = await tasksApi.create(token, values);
        setTasks((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession('Your session expired. Please sign in again.');
        return;
      }
      setModalError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!token) return;
    setTogglingId(task.id);
    setErrorBanner(null);

    try {
      const { task: updated } = await tasksApi.update(token, task.id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession('Your session expired. Please sign in again.');
        return;
      }
      setErrorBanner(err instanceof Error ? err.message : 'Unable to update task status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !taskToDelete) return;
    setDeletingTask(true);
    setErrorBanner(null);

    try {
      await tasksApi.remove(token, taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession('Your session expired. Please sign in again.');
        return;
      }
      setErrorBanner(err instanceof Error ? err.message : 'Unable to delete task.');
      setTaskToDelete(null);
    } finally {
      setDeletingTask(false);
    }
  };

  if (!token || !user) {
    return (
      <>
        {errorBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800">
            {errorBanner}
          </div>
        )}
        <AuthView onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#1E1B2E] flex">
      <Sidebar
        user={user}
        activeFilter={filter}
        summary={summary}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onSelectFilter={setFilter}
        onNewTask={openCreateModal}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-[#E6E0F4] px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg border border-[#E6E0F4] text-[#453E5C] hover:bg-[#F4F1FA] cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#7B7394] hidden sm:inline whitespace-nowrap">Workspace</span>
              <span className="text-[#C9BCEE] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="text-base sm:text-lg font-semibold text-[#1E1B2E] truncate">
                {FILTER_TITLES[filter]}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#623CEA] px-4 py-2 text-sm font-medium text-white hover:bg-[#512ED6] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA]"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Task</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto space-y-6">
          <SummaryStrip summary={summary} loading={loadingTasks} />

          {errorBanner && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => token && void loadTasks(token)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100/60 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  aria-label="Dismiss error"
                  className="p-1.5 rounded-md text-red-600 hover:bg-red-100/60 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <section
            aria-label="Filter and search tasks"
            className="flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="inline-flex p-1 bg-[#F1ECFA] border border-[#E6E0F4] rounded-lg self-start">
              {(
                [
                  { id: 'all', label: `All (${summary.total})` },
                  { id: 'pending', label: `Pending (${summary.pending})` },
                  { id: 'completed', label: `Completed (${summary.completed})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums focus-visible:outline-2 focus-visible:outline-[#623CEA] ${
                    filter === tab.id
                      ? 'bg-white text-[#1E1B2E] shadow-xs'
                      : 'text-[#5B5470] hover:text-[#1E1B2E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:max-w-md justify-end">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#7B7394] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                  className="w-full rounded-lg border border-[#DCD5EE] bg-white pl-9 pr-3 py-2 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TaskSort)}
                aria-label="Sort tasks"
                className="rounded-lg border border-[#DCD5EE] bg-white px-3 py-2 text-sm text-[#453E5C] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20 cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </section>

          {loadingTasks ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" aria-label="Loading tasks">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#E6E0F4] rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-md bg-[#F1ECFF] animate-pulse" />
                    <div className="h-5 w-2/3 rounded bg-[#F1ECFF] animate-pulse" />
                  </div>
                  <div className="h-4 w-full rounded bg-[#F7F4FC] animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-[#F7F4FC] animate-pulse" />
                </div>
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="bg-white border border-[#E6E0F4] rounded-2xl px-6 py-14 text-center">
              <div className="mx-auto h-11 w-11 rounded-xl bg-[#F3EFFF] text-[#623CEA] flex items-center justify-center">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[#1E1B2E]">
                {searchQuery.trim()
                  ? 'No matching tasks'
                  : filter === 'completed'
                    ? 'No completed tasks yet'
                    : filter === 'pending'
                      ? 'No pending tasks'
                      : 'No tasks yet'}
              </h2>
              <p className="mt-1.5 text-sm text-[#5B5470] max-w-md mx-auto">
                {searchQuery.trim()
                  ? 'Try adjusting your search query or switching your active task filter.'
                  : filter === 'all'
                    ? 'Create your first task to start organizing your work in one calm workspace.'
                    : 'Tasks matching this status will appear here once updated.'}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-[#DCD5EE] bg-white text-[#453E5C] hover:bg-[#FAF9FC] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#623CEA] text-white hover:bg-[#512ED6] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{tasks.length === 0 ? 'Create your first task' : 'New Task'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  toggling={togglingId === task.id}
                  onToggleComplete={handleToggleComplete}
                  onEdit={openEditModal}
                  onRequestDelete={setTaskToDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        editingTask={editingTask}
        saving={savingTask}
        error={modalError}
        onClose={() => {
          if (!savingTask) {
            setModalOpen(false);
            setEditingTask(null);
          }
        }}
        onSave={handleSaveTask}
      />

      <DeleteConfirmModal
        task={taskToDelete}
        deleting={deletingTask}
        onCancel={() => {
          if (!deletingTask) setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
