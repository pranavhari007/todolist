import React from 'react';
import { useApp } from '../context/AppContext';
import { useTaskAnalytics } from '../hooks/useTaskAnalytics';
import { WeeklyActivityChart } from '../components/charts/WeeklyActivityChart';
import { CompletionTrendChart } from '../components/charts/CompletionTrendChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { PriorityBarChart } from '../components/charts/PriorityBarChart';
import { BarChart3, Flame, CheckCircle2, Clock, Award, Zap } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { tasks, categories } = useApp();
  const analytics = useTaskAnalytics(tasks, categories);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Analytics & Productivity Insights
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Real metrics derived strictly from your saved task data.
        </p>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
              Current Streak
            </span>
            <Flame className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {analytics.currentStreak} Days
          </div>
          <div className="text-xs text-gray-400 mt-1">Longest: {analytics.longestStreak} Days</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
              Completion Rate
            </span>
            <Award className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {analytics.completionRate}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {analytics.completedTasks} of {analytics.totalTasks} tasks
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
              Completed Tasks
            </span>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {analytics.completedTasks}
          </div>
          <div className="text-xs text-gray-400 mt-1">Active history</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
              Avg Velocity
            </span>
            <Zap className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {analytics.avgCompletionTimeHours !== null
              ? `${analytics.avgCompletionTimeHours}h`
              : 'N/A'}
          </div>
          <div className="text-xs text-gray-400 mt-1">From creation to done</div>
        </div>
      </div>

      {/* Grid of Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            14-Day Completion Trend
          </h3>
          <CompletionTrendChart data={analytics.dailyCompletionCounts} />
        </div>

        {/* Weekly Activity Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Weekly Activity Comparison
          </h3>
          <WeeklyActivityChart data={analytics.weeklyTrends} />
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Task Category Distribution
          </h3>
          <CategoryPieChart data={analytics.categoryDistribution} />
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Priority Level Spread</h3>
          <PriorityBarChart data={analytics.priorityDistribution} />
        </div>
      </div>
    </div>
  );
};
