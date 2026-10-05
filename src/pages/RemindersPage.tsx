import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications/notificationService';
import { soundService } from '../services/audio/soundService';
import { formatDateString } from '../utils/dateUtils';
import {
  Bell,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Play,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const { tasks, settings, updateSettings } = useApp();
  const [permissionStatus, setPermissionStatus] = useState<string>(
    notificationService.getPermissionStatus()
  );

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
    if (status === 'granted') {
      updateSettings({ notificationsEnabled: true });
    }
  };

  const handleTestSound = () => {
    soundService.playTone(settings.alarmSound, settings.alarmVolume);
  };

  // Collect active reminders from pending tasks
  const activeReminders = tasks
    .filter((t) => !t.archived && t.status === 'pending')
    .flatMap((t) =>
      t.reminders
        .filter((r) => r.enabled && !r.triggered)
        .map((r) => ({ task: t, reminder: r }))
    )
    .sort(
      (a, b) =>
        new Date(a.reminder.reminderTime).getTime() -
        new Date(b.reminder.reminderTime).getTime()
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-500" /> Reminders & Notifications
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage upcoming local alarms, sound alerts, and browser permissions.
        </p>
      </div>

      {/* Browser Notification Permission Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Browser Notification Permission
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current status: <span className="font-bold uppercase">{permissionStatus}</span>
            </p>
          </div>
        </div>

        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
          >
            Enable Notifications
          </button>
        )}
      </div>

      {/* Sound Settings & Preview Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-indigo-500" /> Alarm Sound & Volume Preview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Alarm Sound Tone
            </label>
            <select
              value={settings.alarmSound}
              onChange={(e) => updateSettings({ alarmSound: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold"
            >
              <option value="chime">Gentle Chime</option>
              <option value="digital">Digital Beep</option>
              <option value="soft_bell">Soft Bell</option>
              <option value="marimba">Marimba</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Volume ({Math.round(settings.alarmVolume * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.alarmVolume}
              onChange={(e) => updateSettings({ alarmVolume: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer mt-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestSound}
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800"
            >
              <Play className="w-4 h-4" /> Test Sound Tone
            </button>
          </div>
        </div>
      </div>

      {/* Technical Limitations Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
          <Info className="w-5 h-5 shrink-0" /> Local Offline Architecture Notice
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          ToDoList is an offline-first client application. Reminders and Web Audio alarm sounds trigger
          reliably while the web app tab is active in your browser. Modern operating systems and browser
          background power-saver policies throttle background timers when the tab or device is asleep. No
          cloud servers or remote tracking push servers are used.
        </p>
      </div>

      {/* Active Upcoming Reminders List */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          Active Scheduled Reminders ({activeReminders.length})
        </h3>

        {activeReminders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No active reminders currently scheduled. Create a task with a due date & time to set reminders.
          </p>
        ) : (
          <div className="space-y-3">
            {activeReminders.map(({ task, reminder }) => (
              <div
                key={`${task.id}-${reminder.id}`}
                className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {task.title}
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                    Scheduled for: {formatDateString(reminder.reminderTime.split('T')[0])} at{' '}
                    {reminder.reminderTime.split('T')[1]?.substring(0, 5) || 'due time'}
                  </p>
                </div>

                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
