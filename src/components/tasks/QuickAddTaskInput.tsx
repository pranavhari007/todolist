import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Calendar, Flag } from 'lucide-react';
import { Priority } from '../../types';

export const QuickAddTaskInput: React.FC<{ placeholder?: string }> = ({
  placeholder = 'Add a quick task (Press Enter to save)...',
}) => {
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
      reminders: [{ id: `rem-${Date.now()}`, offsetMinutes: 0, reminderTime: '', enabled: true, triggered: false }],
      subtasks: [],
    });

    setTitle('');
    setDueDate('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-wrap items-center gap-2"
    >
      <div className="flex-1 flex items-center gap-2 min-w-[200px] px-2">
        <Plus className="w-5 h-5 text-indigo-500 shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-semibold capitalize text-gray-700 dark:text-gray-200 focus:outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button
          type="submit"
          disabled={!title.trim()}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
        >
          Add
        </button>
      </div>
    </form>
  );
};
