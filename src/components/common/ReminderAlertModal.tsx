import React from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { Badge } from './Badge';
import { formatTimeString } from '../../utils/dateUtils';

const SNOOZE_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
] as const;

export const ReminderAlertModal: React.FC = () => {
  const {
    activeReminderAlert,
    dismissReminderAlert,
    snoozeReminderAlert,
    completeTaskFromAlert,
  } = useApp();

  if (!activeReminderAlert) return null;

  const { task } = activeReminderAlert;

  return (
    <Modal isOpen={!!activeReminderAlert} onClose={dismissReminderAlert} maxWidth="md">
      <div className="flex flex-col items-center text-center">
        {/* Animated bell icon */}
        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/80 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 animate-bounce">
          <Bell className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 mb-1">
          Reminder Alert
        </span>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-h-24 overflow-y-auto">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="priority" priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Due: {task.dueDate}
              {task.dueTime ? ` at ${formatTimeString(task.dueTime)}` : ''}
            </span>
          )}
        </div>

        {/* Snooze options — 3 discrete buttons */}
        <div className="w-full mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Snooze for…
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SNOOZE_OPTIONS.map(({ label, minutes }) => (
              <button
                key={minutes}
                onClick={() => snoozeReminderAlert(minutes)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl font-semibold text-sm transition-colors border border-amber-200 dark:border-amber-800"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Complete & Dismiss */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={completeTaskFromAlert}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete Task
          </button>

          <button
            onClick={dismissReminderAlert}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  );
};
