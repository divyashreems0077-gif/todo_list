import { CheckCircle2, Circle, Layers, LogOut, Plus, X } from 'lucide-react';
import type { TaskFilter, TaskSummary, User } from '../types/todo';

interface SidebarProps {
  user: User;
  activeFilter: TaskFilter;
  summary: TaskSummary;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectFilter: (filter: TaskFilter) => void;
  onNewTask: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Sidebar({
  user,
  activeFilter,
  summary,
  mobileOpen,
  onCloseMobile,
  onSelectFilter,
  onNewTask,
  onLogout,
}: SidebarProps) {
  const navItems: Array<{
    id: TaskFilter;
    label: string;
    count: number;
    icon: typeof Layers;
  }> = [
    { id: 'all', label: 'All Tasks', count: summary.total, icon: Layers },
    { id: 'pending', label: 'Pending', count: summary.pending, icon: Circle },
    { id: 'completed', label: 'Completed', count: summary.completed, icon: CheckCircle2 },
  ];

  const handleNavClick = (filter: TaskFilter) => {
    onSelectFilter(filter);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-[#E6E0F4] px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#623CEA] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              L
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#1E1B2E] whitespace-nowrap shrink-0">
              Lila
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-2 rounded-lg text-[#5B5470] hover:bg-[#F4F1FA] hover:text-[#1E1B2E] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onNewTask();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#623CEA] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#512ED6] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA]"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Task</span>
          </button>
        </div>

        <nav aria-label="Task views" className="mt-7 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA] ${
                  isActive
                    ? 'bg-[#F1ECFF] text-[#4C2CE0]'
                    : 'text-[#5B5470] hover:bg-[#FAF9FC] hover:text-[#1E1B2E]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#623CEA]' : 'text-[#7B7394]'}`}
                  />
                  <span>{item.label}</span>
                </span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? 'text-[#4C2CE0]' : 'text-[#7B7394]'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#ECE7F6]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-lg bg-[#EDE7FF] text-[#4C2CE0] font-semibold text-xs flex items-center justify-center shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#1E1B2E] truncate">{user.name}</p>
            <p className="text-xs text-[#6E6784] truncate">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-2 w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#5B5470] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[260px] shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1E1B2E]/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-[272px] max-w-[85vw] h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
