import SearchBar from '../ui/SearchBar';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';

export default function Header() {
  const { filters, setSearchQuery } = useTaskStore();
  const { activeView, openModal } = useUIStore();

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeView === 'tasks' && 'My Tasks'}
            {activeView === 'pomodoro' && 'Pomodoro Timer'}
            {activeView === 'statistics' && 'Statistics'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {activeView === 'tasks' && 'Stay organized, get things done'}
            {activeView === 'pomodoro' && 'Focus with the Pomodoro technique'}
            {activeView === 'statistics' && 'Track your productivity journey'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeView === 'tasks' && (
            <>
              <SearchBar
                value={filters.searchQuery}
                onChange={setSearchQuery}
                className="hidden sm:block w-64"
              />
              <Button
                onClick={() => openModal('addTask')}
                icon={<Plus size={18} />}
                size="md"
              >
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {activeView === 'tasks' && (
        <div className="sm:hidden px-6 pb-3">
          <SearchBar
            value={filters.searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      )}
    </header>
  );
}
