import {
  CheckSquare,
  ListTodo,
  Timer,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Grid2x2,
  Target,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { getCurrentLevel, getLevelProgress } from '../../utils/constants';

interface SidebarProps {
  userXP?: number;
}

export default function Sidebar({ userXP = 0 }: SidebarProps) {
  const { profile, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, sidebarOpen, toggleSidebar, activeView, setActiveView } =
    useUIStore();

  const level = getCurrentLevel(userXP);
  const progress = getLevelProgress(userXP);

  const navItems = [
    { id: 'tasks' as const, label: 'My Tasks', icon: ListTodo },
    { id: 'eisenhower' as const, label: 'Eisenhower', icon: Grid2x2 },
    { id: 'habits' as const, label: 'Habits', icon: Target },
    { id: 'pomodoro' as const, label: 'Pomodoro', icon: Timer },
    { id: 'statistics' as const, label: 'Statistics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 transition-all duration-300',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'lg:justify-center lg:w-full')}>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <h1 className="text-lg font-bold bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
                TickFlow
              </h1>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-hover text-gray-400 lg:hidden"
          >
            <X size={18} />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-hover text-gray-400"
          >
            <ChevronLeft size={16} className={cn('transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* User profile card */}
        <div className={cn('px-4 py-4', !sidebarOpen && 'lg:px-2')}>
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-surface-dark-hover',
            !sidebarOpen && 'lg:justify-center lg:p-2'
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {profile?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{level.badge}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{level.title}</span>
                </div>
                {/* XP Progress */}
                <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: level.color }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover hover:text-gray-900 dark:hover:text-white',
                  !sidebarOpen && 'lg:justify-center lg:px-2'
                )}
              >
                <Icon size={20} className={cn(isActive && 'text-brand-500')} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 space-y-1 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={toggleDarkMode}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors',
              !sidebarOpen && 'lg:justify-center lg:px-2'
            )}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors',
              !sidebarOpen && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-4 left-4 z-30 lg:hidden p-3 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
