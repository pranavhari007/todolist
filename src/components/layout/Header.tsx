import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Moon,
  Laptop,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd, title }) => {
  const { settings, updateSettings, tasks } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingRemindersCount = tasks.filter(
    (t) => t.status === 'pending' && !t.archived && t.reminders.some((r) => r.enabled && !r.triggered)
  ).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cycleTheme = () => {
    const current = settings.theme;
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    updateSettings({ theme: next });
  };

  const getThemeIcon = () => {
    if (settings.theme === 'light') return <Sun className="w-5 h-5 text-amber-500" />;
    if (settings.theme === 'dark') return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Laptop className="w-5 h-5 text-gray-500" />;
  };

  const getPageTitle = () => {
    if (title) return title;
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/tasks':
        return 'All Tasks';
      case '/calendar':
        return 'Calendar';
      case '/reminders':
        return 'Reminders';
      case '/analytics':
        return 'Analytics';
      case '/completed':
        return 'Completed Tasks';
      case '/categories':
        return 'Categories';
      case '/settings':
        return 'Settings';
      default:
        return 'ToDoList';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Page Title & Mobile Brand */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks, descriptions, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100 placeholder-gray-400 transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Offline Status Badge */}
        {!isOnline ? (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
            title="App running offline mode"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Offline
          </span>
        ) : (
          <span
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 dark:border-emerald-800"
            title="Online"
          >
            <Wifi className="w-3.5 h-3.5" />
            Online
          </span>
        )}

        {/* Reminders Bell Link */}
        <button
          onClick={() => navigate('/reminders')}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl relative transition-colors"
          title="Reminders"
        >
          <Bell className="w-5 h-5" />
          {pendingRemindersCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title={`Theme: ${settings.theme} (Click to switch)`}
        >
          {getThemeIcon()}
        </button>

        {/* Quick Add Task Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>
    </header>
  );
};
