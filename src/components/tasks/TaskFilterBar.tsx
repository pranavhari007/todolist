import React from 'react';
import { TaskFilterOptions, SortField, SortOrder } from '../../hooks/useTaskFilters';
import { Priority, Category } from '../../types';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

interface TaskFilterBarProps {
  filters: TaskFilterOptions;
  onSetFilter: <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => void;
  onResetFilters: () => void;
  categories: Category[];
  totalTasksCount: number;
  filteredTasksCount: number;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  onSetFilter,
  onResetFilters,
  categories,
  totalTasksCount,
  filteredTasksCount,
}) => {
  const isFiltered =
    filters.searchQuery ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.dueDateFilter !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.searchQuery}
            onChange={(e) => onSetFilter('searchQuery', e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onSetFilter('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">
            Sort by:
          </label>
          <select
            value={filters.sortField}
            onChange={(e) => onSetFilter('sortField', e.target.value as SortField)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            <option value="completedAt">Completed Date</option>
          </select>

          <button
            onClick={() => onSetFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onSetFilter('status', e.target.value as any)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Only</option>
          <option value="completed">Completed Only</option>
          <option value="overdue">Overdue Only</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onSetFilter('priority', e.target.value as any)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent Priority</option>
        </select>

        {/* Category Filter */}
        <select
          value={filters.categoryId}
          onChange={(e) => onSetFilter('categoryId', e.target.value)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium"
        >
          <option value="all">All Categories</option>
          <option value="none">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.dueDateFilter}
          onChange={(e) => onSetFilter('dueDateFilter', e.target.value as any)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium"
        >
          <option value="all">All Dates</option>
          <option value="today">Due Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="no_date">No Due Date</option>
        </select>

        {/* Reset Button */}
        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}

        <span className="text-gray-400 dark:text-gray-500 ml-auto">
          Showing {filteredTasksCount} of {totalTasksCount} tasks
        </span>
      </div>
    </div>
  );
};
