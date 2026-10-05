import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskCard } from '../components/tasks/TaskCard';
import { QuickAddTaskInput } from '../components/tasks/QuickAddTaskInput';
import { BulkActionBar } from '../components/tasks/BulkActionBar';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Task } from '../types';
import { CheckSquare, Plus, CheckCircle2 } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { tasks, categories } = useApp();
  const location = useLocation();

  const { filters, setFilter, resetFilters, filteredTasks, totalCount, filteredCount } =
    useTaskFilters(tasks);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Sync search query from URL parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) {
      setFilter('searchQuery', q);
    }
  }, [location.search]);

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            All Tasks
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage, filter, and organize your personal tasks.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Quick Add Bar */}
      <QuickAddTaskInput />

      {/* Filter and Search Bar */}
      <TaskFilterBar
        filters={filters}
        onSetFilter={setFilter}
        onResetFilters={resetFilters}
        categories={categories}
        totalTasksCount={totalCount}
        filteredTasksCount={filteredCount}
      />

      {/* Bulk Selection Header */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Select All ({filteredTasks.length})</span>
          </label>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
          <CheckCircle2 className="w-12 h-12 mx-auto text-indigo-400 mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No tasks found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new task to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showSelection={true}
              selected={selectedTaskIds.includes(task.id)}
              onSelectToggle={toggleSelectTask}
              onEdit={(t) => {
                setEditingTask(t);
                setIsTaskModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedTaskIds}
        onClearSelection={() => setSelectedTaskIds([])}
      />

      {/* Form Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
      />
    </div>
  );
};
