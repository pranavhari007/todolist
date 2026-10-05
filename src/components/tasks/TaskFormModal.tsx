import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Task, Priority, RecurrenceType, ReminderItem } from '../../types';
import { Trash2, Calendar, Clock, Bell, Repeat, FileText, X } from 'lucide-react';
import { time12To24, time24To12, formatTimeString } from '../../utils/dateUtils';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REMINDER_OFFSETS = [
  { label: 'At due time', minutes: 0 },
  { label: '5 min before', minutes: 5 },
  { label: '10 min before', minutes: 10 },
  { label: '15 min before', minutes: 15 },
  { label: '30 min before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '1 day before', minutes: 1440 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a reminder offset + optional due time into a human readable summary */
function formatReminderSummary(offsetMinutes: number, dueTime24?: string): string {
  const offsetLabel =
    REMINDER_OFFSETS.find((r) => r.minutes === offsetMinutes)?.label ?? `${offsetMinutes} min before`;

  if (!dueTime24) return offsetLabel;

  const [h, m] = dueTime24.split(':').map(Number);
  const dueMs = h * 60 + m;
  const reminderMs = dueMs - offsetMinutes;
  const adjustedH = Math.floor(((reminderMs % 1440) + 1440) % 1440 / 60);
  const adjustedM = ((reminderMs % 1440) + 1440) % 1440 % 60;
  const reminderTime24 = `${String(adjustedH).padStart(2, '0')}:${String(adjustedM).padStart(2, '0')}`;
  const reminderTime12 = formatTimeString(reminderTime24);

  if (offsetMinutes === 0) return `At due time (${reminderTime12})`;
  return `${offsetLabel}, at ${reminderTime12}`;
}

/**
 * Try to compute a valid 24-hour HH:mm string from 12-hour text inputs.
 * Returns '' if the inputs don't form a complete, valid time.
 */
function computeDueTime(hourStr: string, minuteStr: string, ap: 'AM' | 'PM'): string {
  if (hourStr === '' || minuteStr === '') return '';
  const h = parseInt(hourStr, 10);
  const m = parseInt(minuteStr, 10);
  if (isNaN(h) || isNaN(m)) return '';
  if (h < 1 || h > 12 || m < 0 || m > 59) return '';
  return time12To24(h, m, ap);
}

// ─── Component ────────────────────────────────────────────────────────────────
export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
}) => {
  const { addTask, updateTask, categories } = useApp();

  // Core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Due Time — simple inline inputs, blank by default
  const [hourInput, setHourInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [dueTime, setDueTime] = useState(''); // computed 24h HH:mm or ''

  // Reminder
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedReminderOffsets, setSelectedReminderOffsets] = useState<number[]>([]);

  // Priority / Category
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState<string>('');

  // Subtasks
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

  // ── Time sync ─────────────────────────────────────────────────────────────
  /** Recompute dueTime whenever any of the 3 time inputs change */
  const syncDueTime = useCallback(
    (h: string, m: string, ap: 'AM' | 'PM') => {
      setDueTime(computeDueTime(h, m, ap));
    },
    []
  );

  const clearTime = useCallback(() => {
    setHourInput('');
    setMinuteInput('');
    setAmpm('AM');
    setDueTime('');
  }, []);

  // ── Input handlers (digits-only, max 2 chars) ────────────────────────────
  const handleHourChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setHourInput(digits);
    syncDueTime(digits, minuteInput, ampm);
  };

  const handleMinuteChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2);
    setMinuteInput(digits);
    syncDueTime(hourInput, digits, ampm);
  };

  /** On blur: validate range and auto-pad, or clear if invalid */
  const handleHourBlur = () => {
    if (hourInput === '') return;
    const n = parseInt(hourInput, 10);
    if (isNaN(n) || n < 1 || n > 12) {
      setHourInput('');
      setDueTime('');
      return;
    }
    const padded = String(n).padStart(2, '0');
    setHourInput(padded);
    syncDueTime(padded, minuteInput, ampm);
  };

  const handleMinuteBlur = () => {
    if (minuteInput === '') return;
    const n = parseInt(minuteInput, 10);
    if (isNaN(n) || n < 0 || n > 59) {
      setMinuteInput('');
      setDueTime('');
      return;
    }
    const padded = String(n).padStart(2, '0');
    setMinuteInput(padded);
    syncDueTime(hourInput, padded, ampm);
  };

  const handleAmpmChange = (ap: 'AM' | 'PM') => {
    setAmpm(ap);
    syncDueTime(hourInput, minuteInput, ap);
  };

  // ── Reset / populate form ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setNotes(taskToEdit.notes || '');
      setDueDate(taskToEdit.dueDate || '');
      setPriority(taskToEdit.priority);
      setCategoryId(taskToEdit.categoryId || '');
      setSubtasks(taskToEdit.subtasks || []);

      const existingTime = taskToEdit.dueTime || '';
      if (existingTime) {
        const { hour, minute, ampm: ap } = time24To12(existingTime);
        setHourInput(String(hour).padStart(2, '0'));
        setMinuteInput(String(minute).padStart(2, '0'));
        setAmpm(ap);
        setDueTime(existingTime);
      } else {
        setHourInput('');
        setMinuteInput('');
        setAmpm('AM');
        setDueTime('');
      }

      const existingReminders = taskToEdit.reminders || [];
      if (existingReminders.length > 0) {
        setReminderEnabled(true);
        setSelectedReminderOffsets(existingReminders.map((r) => r.offsetMinutes));
      } else {
        setReminderEnabled(false);
        setSelectedReminderOffsets([]);
      }

      if (taskToEdit.recurrence) {
        setIsRecurring(true);
        setRecurrenceType(taskToEdit.recurrence.type);
        setRecurrenceInterval(taskToEdit.recurrence.interval || 1);
        setSelectedDaysOfWeek(taskToEdit.recurrence.daysOfWeek || []);
        setRecurrenceEndDate(taskToEdit.recurrence.endDate || '');
      } else {
        setIsRecurring(false);
        setRecurrenceType('daily');
        setRecurrenceInterval(1);
        setSelectedDaysOfWeek([]);
        setRecurrenceEndDate('');
      }
    } else {
      // New task — everything blank / default
      setTitle('');
      setDescription('');
      setNotes('');
      setDueDate(initialDate || '');
      setHourInput('');
      setMinuteInput('');
      setAmpm('AM');
      setDueTime('');
      setPriority('medium');
      setCategoryId('');
      setSubtasks([]);
      setReminderEnabled(false);
      setSelectedReminderOffsets([]);
      setIsRecurring(false);
      setRecurrenceType('daily');
      setRecurrenceInterval(1);
      setSelectedDaysOfWeek([]);
      setRecurrenceEndDate('');
    }
  }, [isOpen, taskToEdit, initialDate]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub-temp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const toggleReminderOffset = (offset: number) => {
    setSelectedReminderOffsets((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedReminders: ReminderItem[] = reminderEnabled
      ? selectedReminderOffsets.map((offset) => ({
          id: `rem-${Math.random().toString(36).substring(2, 7)}`,
          offsetMinutes: offset,
          reminderTime: '',
          enabled: true,
          triggered: false,
        }))
      : [];

    const recurrenceConfig = isRecurring
      ? {
          type: recurrenceType,
          interval: recurrenceInterval,
          daysOfWeek: recurrenceType === 'weekly' ? selectedDaysOfWeek : undefined,
          endDate: recurrenceEndDate || undefined,
          behavior: 'create_next' as const,
        }
      : undefined;

    // dueTime is non-empty only when both hour & minute are valid
    const finalDueTime = dueTime || undefined;

    const payload = {
      title: title.trim().substring(0, 200),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: finalDueTime,
      priority,
      categoryId: categoryId || undefined,
      subtasks,
      reminders: formattedReminders,
      recurrence: recurrenceConfig,
    };

    if (taskToEdit) {
      updateTask(taskToEdit.id, payload);
    } else {
      addTask(payload);
    }

    onClose();
  };

  // ── Shared CSS ────────────────────────────────────────────────────────────
  const inputCls =
    'w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5';
  const sectionCls = 'p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600/80';

  const hasTime = dueTime !== '';

  // Reminder summary string
  const reminderSummary =
    reminderEnabled && selectedReminderOffsets.length > 0
      ? selectedReminderOffsets
          .map((o) => formatReminderSummary(o, hasTime ? dueTime : undefined))
          .join('; ')
      : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Add Task'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="task-form">
        {/* ── 1. Task Title ─────────────────────────────────────────────── */}
        <div>
          <label className={labelCls}>
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={200}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            autoFocus
            data-testid="task-title-input"
          />
        </div>

        {/* ── 2. Description ────────────────────────────────────────────── */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={2}
            placeholder="Brief description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── 3. Due Date ───────────────────────────────────────────────── */}
        <div>
          <label className={`${labelCls} flex items-center gap-1.5`}>
            <Calendar className="w-3.5 h-3.5" /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
            data-testid="due-date-input"
          />
        </div>

        {/* ── 4. Time (simple inline input) ─────────────────────────────── */}
        <div data-testid="due-time-section">
          <label className={`${labelCls} flex items-center gap-1.5`}>
            <Clock className="w-3.5 h-3.5" /> Time
          </label>

          <div className="flex items-center gap-2">
            {/* Hour input */}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="hh"
              maxLength={2}
              value={hourInput}
              onChange={(e) => handleHourChange(e.target.value)}
              onBlur={handleHourBlur}
              aria-label="Hour"
              data-testid="hour-input"
              className="w-14 text-center px-2 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <span className="text-gray-400 dark:text-gray-500 font-bold text-lg select-none">:</span>

            {/* Minute input */}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="mm"
              maxLength={2}
              value={minuteInput}
              onChange={(e) => handleMinuteChange(e.target.value)}
              onBlur={handleMinuteBlur}
              aria-label="Minute"
              data-testid="minute-input"
              className="w-14 text-center px-2 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* AM / PM segmented toggle */}
            <div
              className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0"
              data-testid="ampm-toggle"
              role="radiogroup"
              aria-label="AM or PM"
            >
              {(['AM', 'PM'] as const).map((ap) => (
                <button
                  key={ap}
                  type="button"
                  role="radio"
                  aria-checked={ampm === ap}
                  onClick={() => handleAmpmChange(ap)}
                  data-testid={`ampm-${ap}`}
                  className={`px-3.5 py-2.5 text-xs font-bold transition-colors ${
                    ampm === ap
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {ap}
                </button>
              ))}
            </div>

            {/* Clear time button — only visible when there's something to clear */}
            {(hourInput || minuteInput) && (
              <button
                type="button"
                onClick={clearTime}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Clear time"
                aria-label="Clear time"
                data-testid="clear-time"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Validation hint */}
          {hourInput !== '' && minuteInput !== '' && !hasTime && (
            <p className="mt-1.5 text-xs text-rose-500" data-testid="time-error">
              Invalid time. Hour must be 1–12, minute 0–59.
            </p>
          )}

          {/* Confirmed time preview */}
          {hasTime && (
            <p
              className="mt-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
              data-testid="time-preview"
            >
              ⏰ {formatTimeString(dueTime)}
            </p>
          )}
        </div>

        {/* ── 5. Reminder ───────────────────────────────────────────────── */}
        <div className={sectionCls} data-testid="reminder-section">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" /> Reminder
              {reminderSummary && (
                <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold normal-case text-xs">
                  — {reminderSummary}
                </span>
              )}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              onClick={() => {
                const next = !reminderEnabled;
                setReminderEnabled(next);
                if (next && selectedReminderOffsets.length === 0) {
                  setSelectedReminderOffsets([0]);
                }
              }}
              data-testid="reminder-toggle"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                reminderEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {reminderEnabled && (
            <div className="mt-3 space-y-2" data-testid="reminder-options">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select when to be reminded:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_OFFSETS.map((option) => {
                  const isSelected = selectedReminderOffsets.includes(option.minutes);
                  return (
                    <button
                      key={option.minutes}
                      type="button"
                      onClick={() => toggleReminderOffset(option.minutes)}
                      data-testid={`reminder-offset-${option.minutes}`}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-amber-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {!hasTime && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Set a due time for precise reminder scheduling. Without a time, reminders
                  fire at 9:00 AM on the due date.
                </p>
              )}

              {reminderSummary && (
                <p
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800"
                  data-testid="reminder-summary"
                >
                  🔔 {reminderSummary}
                </p>
              )}
            </div>
          )}

          {!reminderEnabled && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Enable to get notified before this task is due.
            </p>
          )}
        </div>

        {/* ── 6. Priority & Category ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Priority</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  data-testid={`priority-${p}`}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    priority === p
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 7. Subtasks ───────────────────────────────────────────────── */}
        <div>
          <label className={labelCls}>Subtasks</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add a subtask…"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Add
            </button>
          </div>

          {subtasks.length > 0 && (
            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-xs border border-gray-100 dark:border-gray-700"
                >
                  <span className="truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks((prev) => prev.filter((s) => s.id !== st.id))
                    }
                    className="text-gray-400 hover:text-rose-500 ml-2 flex-shrink-0"
                    aria-label="Remove subtask"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 8. Recurrence ─────────────────────────────────────────────── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Recurring Task
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring((p) => !p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                isRecurring ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isRecurring && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Frequency
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Every N {recurrenceType}
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 9. Additional Notes ───────────────────────────────────────── */}
        <div>
          <label className={`${labelCls} flex items-center gap-1.5`}>
            <FileText className="w-3.5 h-3.5" /> Additional Notes
          </label>
          <textarea
            rows={2}
            placeholder="Links, references, extra context…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── 10. Action Buttons ────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            data-testid="submit-button"
          >
            {taskToEdit ? 'Save Changes' : 'Save Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
