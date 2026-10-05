import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CheckCircle2, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  onClearSelection,
}) => {
  const { bulkCompleteTasks, bulkDeleteTasks } = useApp();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-in border border-gray-700">
        <span className="text-sm font-bold bg-indigo-600 px-2.5 py-0.5 rounded-full">
          {selectedIds.length} Selected
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              bulkCompleteTasks(selectedIds);
              onClearSelection();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </button>

          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Deselect all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          bulkDeleteTasks(selectedIds);
          onClearSelection();
        }}
        title="Bulk Delete Tasks"
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected tasks?`}
        confirmText={`Delete ${selectedIds.length} Tasks`}
        confirmVariant="danger"
      />
    </>
  );
};
