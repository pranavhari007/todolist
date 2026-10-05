import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { formatDateString, isTaskOverdue } from '../../utils/dateUtils';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Check } from 'lucide-react';
import { TaskFormModal } from '../tasks/TaskFormModal';

export const CalendarView: React.FC = () => {
  const { tasks, settings, completeTask, restoreTask } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(
    settings.defaultCalendarView || 'month'
  );

  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const weekStartDay = settings.weekStartDay ?? 1; // 1 = Monday, 0 = Sunday

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar day matrix
  const daysInView = React.useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: weekStartDay as any });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: weekStartDay as any });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: weekStartDay as any });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: weekStartDay as any });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      return [currentDate];
    }
  }, [currentDate, viewMode, weekStartDay]);

  const handleDayClick = (date: Date) => {
    const formatted = format(date, 'yyyy-MM-dd');
    setSelectedTaskToEdit(null);
    setSelectedDateForCreate(formatted);
    setIsModalOpen(true);
  };

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTaskToEdit(task);
    setSelectedDateForCreate(null);
    setIsModalOpen(true);
  };

  const dayHeaderLabels = weekStartDay === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Prev/Next Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
        {/* Days of week header (Month & Week view) */}
        {viewMode !== 'day' && (
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
            {dayHeaderLabels.map((dayLabel) => (
              <div
                key={dayLabel}
                className="py-2.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {dayLabel}
              </div>
            ))}
          </div>
        )}

        {/* Days Cells */}
        <div
          className={`grid gap-px bg-gray-200 dark:bg-gray-700 ${
            viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'
          }`}
        >
          {daysInView.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter((t) => !t.archived && t.dueDate === dateKey);
            const isSelectedMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`min-h-[110px] md:min-h-[130px] p-2 bg-white dark:bg-gray-800 flex flex-col justify-start transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30 cursor-pointer ${
                  !isSelectedMonth && viewMode === 'month' ? 'opacity-40' : ''
                }`}
              >
                {/* Date Header Number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                      isCurrentDay
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day Tasks Chips */}
                <div className="space-y-1 overflow-y-auto max-h-[90px] pr-0.5">
                  {dayTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isOverdue = isTaskOverdue(task.dueDate, task.dueTime, task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => handleTaskClick(e, task)}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all truncate border ${
                          isCompleted
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 line-through border-transparent'
                            : isOverdue
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
                        }`}
                        title={task.title}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isCompleted ? restoreTask(task.id) : completeTask(task.id);
                          }}
                          className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-400 hover:border-indigo-500'
                          }`}
                        >
                          {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal for Calendar Task Creation / Editing */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskToEdit(null);
          setSelectedDateForCreate(null);
        }}
        taskToEdit={selectedTaskToEdit}
        initialDate={selectedDateForCreate || undefined}
      />
    </div>
  );
};
