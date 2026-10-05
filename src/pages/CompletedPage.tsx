import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CheckCircle2, RotateCcw, Trash2, Search } from 'lucide-react';

export const CompletedPage: React.FC = () => {
  const { tasks, restoreTask, deleteTask, bulkDeleteTasks } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const completedTasks = tasks.filter((t) => !t.archived && t.status === 'completed');

  const filteredCompletedTasks = completedTasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Completed Tasks Archive
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View completed tasks, restore them to pending, or permanently clear history.
          </p>
        </div>

        {completedTasks.length > 0 && (
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors border border-rose-200 dark:border-rose-900/60"
          >
            <Trash2 className="w-4 h-4" /> Clear All Completed ({completedTasks.length})
          </button>
        )}
      </div>

      {/* Search Input */}
      {completedTasks.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* List */}
      {filteredCompletedTasks.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            No completed tasks found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete tasks from your dashboard or task list to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCompletedTasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      {/* Confirm Clear Modal */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={() => bulkDeleteTasks(completedTasks.map((t) => t.id))}
        title="Clear Completed Tasks"
        message={`Are you sure you want to permanently delete all ${completedTasks.length} completed tasks? This action cannot be undone.`}
        confirmText={`Delete ${completedTasks.length} Tasks`}
        confirmVariant="danger"
      />
    </div>
  );
};
