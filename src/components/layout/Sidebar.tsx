import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Bell,
  BarChart3,
  CheckCircle,
  Folder,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { tasks, categories } = useApp();

  const pendingCount = tasks.filter((t) => t.status === 'pending' && !t.archived).length;
  const completedCount = tasks.filter((t) => t.status === 'completed' && !t.archived).length;
  const remindersCount = tasks.filter(
    (t) => t.status === 'pending' && !t.archived && t.reminders.some((r) => r.enabled && !r.triggered)
  ).length;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'All Tasks', path: '/tasks', icon: CheckSquare, badge: pendingCount },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Reminders', path: '/reminders', icon: Bell, badge: remindersCount },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Completed', path: '/completed', icon: CheckCircle, badge: completedCount },
    { label: 'Categories', path: '/categories', icon: Folder, badge: categories.length },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 relative ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              ToDoList
            </span>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center">
          ToDoList v1.0 • Offline First
        </div>
      )}
    </aside>
  );
};
