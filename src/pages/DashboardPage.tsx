import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTaskAnalytics } from '../hooks/useTaskAnalytics';
import { DashboardWidgetId } from '../types';
import { getTimeBasedGreeting, formatDateString, isTaskDueToday } from '../utils/dateUtils';
import { QuickAddTaskInput } from '../components/tasks/QuickAddTaskInput';
import { TaskCard } from '../components/tasks/TaskCard';
import { WeeklyActivityChart } from '../components/charts/WeeklyActivityChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  TrendingUp,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { tasks, categories, settings, toggleWidget } = useApp();
  const analytics = useTaskAnalytics(tasks, categories);
  const [showWidgetCustomizer, setShowWidgetCustomizer] = useState(false);

  const todayTasks = tasks.filter(
    (t) => !t.archived && t.status === 'pending' && isTaskDueToday(t.dueDate)
  );

  const upcomingReminders = tasks
    .filter((t) => !t.archived && t.status === 'pending')
    .flatMap((t) =>
      t.reminders
        .filter((r) => r.enabled && !r.triggered)
        .map((r) => ({ task: t, reminder: r }))
    )
    .sort(
      (a, b) =>
        new Date(a.reminder.reminderTime).getTime() -
        new Date(b.reminder.reminderTime).getTime()
    )
    .slice(0, 5);

  const greeting = getTimeBasedGreeting();
  const currentDateStr = formatDateString(new Date().toISOString().split('T')[0], 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Top Greeting Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-bold opacity-80">
            {currentDateStr}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">{greeting}!</h2>
          <p className="text-sm opacity-90 mt-1 max-w-md">
            You have <span className="font-bold">{analytics.pendingTasks}</span> pending tasks and{' '}
            <span className="font-bold">{todayTasks.length}</span> scheduled for today.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {/* Productivity Streak Pill */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-300 animate-bounce" />
            <div>
              <div className="text-xs font-medium text-indigo-100">Streak</div>
              <div className="text-lg font-extrabold">{analytics.currentStreak} Days</div>
            </div>
          </div>

          <button
            onClick={() => setShowWidgetCustomizer((prev) => !prev)}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-colors"
            title="Customize Dashboard Widgets"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Widget Customizer Dropdown Panel */}
      {showWidgetCustomizer && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-2 animate-fadeIn">
          <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
            Visible Dashboard Widgets
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'stats', label: 'Stat Cards' },
              { id: 'today_tasks', label: "Today's Tasks" },
              { id: 'upcoming_reminders', label: 'Upcoming Reminders' },
              { id: 'weekly_summary', label: 'Weekly Summary Chart' },
              { id: 'category_breakdown', label: 'Category Breakdown' },
              { id: 'productivity_streak', label: 'Streak Card' },
            ].map((widget) => {
              const widgetKey = widget.id as DashboardWidgetId;
              const active = settings.dashboardWidgets[widgetKey] ?? true;
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widgetKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {widget.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Bar */}
      <QuickAddTaskInput />

      {/* Stat Cards Grid */}
      {(settings.dashboardWidgets.stats ?? true) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="text-xs font-bold uppercase">Total Tasks</span>
              <ListTodo className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {analytics.totalTasks}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="text-xs font-bold uppercase">Pending</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {analytics.pendingTasks}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="text-xs font-bold uppercase">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2 text-gray-900 dark:text-white">
              {analytics.completedTasks}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="text-xs font-bold uppercase">Overdue</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-2 text-rose-600 dark:text-rose-400">
              {analytics.overdueTasks}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Today's Tasks & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        {(settings.dashboardWidgets.today_tasks ?? true) && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Today's Tasks</h3>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  No tasks due today!
                </p>
                <p className="text-xs text-gray-400 mt-1">Enjoy your free time or add a new task above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Reminders */}
        {(settings.dashboardWidgets.upcoming_reminders ?? true) && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Upcoming Reminders
                </h3>
              </div>
              <Link
                to="/reminders"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All
              </Link>
            </div>

            {upcomingReminders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No pending reminders scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingReminders.map(({ task, reminder }) => (
                  <div
                    key={`${task.id}-${reminder.id}`}
                    className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 text-xs"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {task.title}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                      {formatDateString(reminder.reminderTime.split('T')[0])}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(settings.dashboardWidgets.weekly_summary ?? true) && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Weekly Activity
              </h3>
            </div>
            <WeeklyActivityChart data={analytics.weeklyTrends} />
          </div>
        )}

        {(settings.dashboardWidgets.category_breakdown ?? true) && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
              Category Breakdown
            </h3>
            <CategoryPieChart data={analytics.categoryDistribution} />
          </div>
        )}
      </div>
    </div>
  );
};
