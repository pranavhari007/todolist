import React, { useState } from 'react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { isTaskOverdue, formatDateString, formatTimeString } from '../../utils/dateUtils';
import {
  Check,
  Calendar,
  Clock,
  Bell,
  Repeat,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  ListTodo,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  selected?: boolean;
  onSelectToggle?: (taskId: string) => void;
  showSelection?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  selected = false,
  onSelectToggle,
  showSelection = false,
}) => {
  const { completeTask, restoreTask, deleteTask, toggleSubtask, categories } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const category = categories.find((c) => c.id === task.categoryId);
  const isOverdue = isTaskOverdue(task.dueDate, task.dueTime, task.status);
  const isCompleted = task.status === 'completed';

  const subtasksCount = task.subtasks.length;
  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = subtasksCount > 0 ? Math.round((completedSubtasksCount / subtasksCount) * 100) : 0;

  const activeRemindersCount = task.reminders.filter((r) => r.enabled && !r.triggered).length;

  return (
    <>
      <div
        className={`group bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
          isCompleted
            ? 'border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 opacity-80'
            : isOverdue
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
        } ${selected ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Checkbox or Bulk Selection */}
          <div className="flex items-center gap-2 pt-0.5">
            {showSelection && onSelectToggle && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectToggle(task.id)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            )}

            <button
              onClick={() => (isCompleted ? restoreTask(task.id) : completeTask(task.id))}
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-gray-700'
              }`}
              title={isCompleted ? 'Mark pending' : 'Mark completed'}
              aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-semibold text-base text-gray-900 dark:text-gray-100 break-words leading-tight ${
                  isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
                }`}
              >
                {task.title}
              </h3>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {isCompleted ? (
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Restore task"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                ) : (
                  onEdit && (
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )
                )}

                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Preview */}
            {task.description && !isExpanded && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Metadata Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {/* Priority */}
              <Badge variant="priority" priority={task.priority} />

              {/* Category */}
              {category && <Badge variant="category" color={category.color}>{category.name}</Badge>}

              {/* Due Date & Time */}
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                    isOverdue
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {formatDateString(task.dueDate)}
                  {task.dueTime && (
                    <span className="flex items-center gap-0.5 ml-1">
                      <Clock className="w-3 h-3 inline" />
                      {formatTimeString(task.dueTime)}
                    </span>
                  )}
                  {isOverdue && ' (Overdue)'}
                </span>
              )}

              {/* Subtask Progress */}
              {subtasksCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                  <ListTodo className="w-3 h-3" />
                  {completedSubtasksCount}/{subtasksCount}
                </span>
              )}

              {/* Recurrence */}
              {task.recurrence && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium capitalize"
                  title={`Recurring ${task.recurrence.type}`}
                >
                  <Repeat className="w-3 h-3" />
                  {task.recurrence.type}
                </span>
              )}

              {/* Reminders Indicator */}
              {activeRemindersCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium"
                  title={`${activeRemindersCount} active reminder(s)`}
                >
                  <Bell className="w-3 h-3" />
                  {activeRemindersCount}
                </span>
              )}

              {/* Completion Timestamp */}
              {isCompleted && task.completedAt && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Done {formatDateString(task.completedAt.split('T')[0])}
                </span>
              )}
            </div>

            {/* Expand Toggle */}
            {(task.description || task.notes || subtasksCount > 0) && (
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Details & Subtasks
                  </>
                )}
              </button>
            )}

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/80 space-y-3">
                {task.description && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                      Description
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-line">
                      {task.description}
                    </p>
                  </div>
                )}

                {task.notes && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Notes
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl whitespace-pre-line border border-gray-100 dark:border-gray-700">
                      {task.notes}
                    </p>
                  </div>
                )}

                {/* Subtasks Checklist */}
                {subtasksCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">
                      <span>Subtasks</span>
                      <span>
                        {completedSubtasksCount} / {subtasksCount} ({subtaskProgress}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>

                    <ul className="space-y-1.5">
                      {task.subtasks.map((subtask) => (
                        <li key={subtask.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(task.id, subtask.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span
                            className={
                              subtask.completed
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-gray-700 dark:text-gray-300'
                            }
                          >
                            {subtask.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteTask(task.id)}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}"?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};
