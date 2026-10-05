import { AppData, Task, ReminderItem, TriggeredReminderAlert } from '../../types';
import { storageService } from '../storage/localStorageService';
import { soundService } from '../audio/soundService';
import { notificationService } from '../notifications/notificationService';

type ReminderListener = (alert: TriggeredReminderAlert) => void;

class ReminderScheduler {
  private activeTimers: Map<string, number> = new Map();
  private listeners: Set<ReminderListener> = new Set();
  private currentAppData: AppData | null = null;

  public subscribe(listener: ReminderListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(alert: TriggeredReminderAlert): void {
    this.listeners.forEach((fn) => fn(alert));
  }

  /**
   * Clear all active timers.
   */
  public clearAllTimers(): void {
    this.activeTimers.forEach((timerId) => window.clearTimeout(timerId));
    this.activeTimers.clear();
  }

  /**
   * Re-evaluate and schedule all untriggered reminders for pending tasks.
   */
  public syncAndSchedule(appData: AppData): void {
    this.currentAppData = appData;
    this.clearAllTimers();

    const now = Date.now();

    appData.tasks.forEach((task) => {
      // Rule: Completed or deleted tasks MUST NOT generate active reminders
      if (task.status === 'completed' || task.archived) return;

      task.reminders.forEach((reminder) => {
        if (!reminder.enabled || reminder.triggered) return;

        const reminderTimeMs = new Date(reminder.reminderTime).getTime();
        if (isNaN(reminderTimeMs)) return;

        const timeUntilTrigger = reminderTimeMs - now;

        if (timeUntilTrigger <= 0) {
          // Overdue or due right now (within past 2 hours, trigger immediately)
          if (timeUntilTrigger > -2 * 60 * 60 * 1000) {
            this.triggerReminder(task, reminder);
          } else {
            // Expired long ago, mark as triggered to avoid endless popping
            this.markReminderTriggered(task.id, reminder.id);
          }
        } else {
          // Schedule timer
          const key = `${task.id}:${reminder.id}`;
          const timerId = window.setTimeout(() => {
            this.triggerReminder(task, reminder);
          }, Math.min(timeUntilTrigger, 2147483647)); // Cap to max 32-bit int ms

          this.activeTimers.set(key, timerId);
        }
      });
    });
  }

  /**
   * Fire a reminder
   */
  private triggerReminder(task: Task, reminder: ReminderItem): void {
    const data = storageService.loadData();
    const settings = data.settings;

    // Check task hasn't been completed/deleted in the meantime
    const currentTask = data.tasks.find((t) => t.id === task.id);
    if (!currentTask || currentTask.status === 'completed' || currentTask.archived) {
      return;
    }

    // 1. Play sound
    if (settings.alarmVolume > 0) {
      soundService.startAlarmLoop(settings.alarmSound, settings.alarmVolume);
    }

    // 2. Send browser notification if permitted & enabled
    if (settings.notificationsEnabled) {
      const title = `Reminder: ${task.title}`;
      const body = task.description || `Task due ${task.dueDate ? task.dueDate : 'soon'}`;
      notificationService.sendNotification(title, {
        body,
        tag: `reminder-${task.id}`,
      });
    }

    // 3. Mark triggered in storage
    this.markReminderTriggered(task.id, reminder.id);

    // 4. Dispatch in-app alert event to UI
    this.notifyListeners({ task: currentTask, reminder });
  }

  /**
   * Mark reminder triggered in local storage
   */
  private markReminderTriggered(taskId: string, reminderId: string): void {
    const data = storageService.loadData();
    let updated = false;

    data.tasks = data.tasks.map((task) => {
      if (task.id === taskId) {
        const updatedReminders = task.reminders.map((r) => {
          if (r.id === reminderId) {
            updated = true;
            return { ...r, triggered: true };
          }
          return r;
        });
        return { ...task, reminders: updatedReminders };
      }
      return task;
    });

    if (updated) {
      storageService.saveData(data);
    }
  }

  /**
   * Snooze a triggered reminder for durationMinutes.
   */
  public snoozeReminder(taskId: string, reminderId: string, durationMinutes: number): void {
    soundService.stopAlarmLoop();

    const data = storageService.loadData();
    const snoozeTimeMs = Date.now() + durationMinutes * 60 * 1000;
    const newReminderTime = new Date(snoozeTimeMs).toISOString();

    data.tasks = data.tasks.map((task) => {
      if (task.id === taskId) {
        const updatedReminders = task.reminders.map((r) => {
          if (r.id === reminderId) {
            return {
              ...r,
              reminderTime: newReminderTime,
              triggered: false,
              enabled: true,
              customOffsetLabel: `Snoozed ${durationMinutes}m`,
            };
          }
          return r;
        });
        return { ...task, reminders: updatedReminders };
      }
      return task;
    });

    storageService.saveData(data);
    this.syncAndSchedule(data);
  }

  /**
   * Dismiss a triggered reminder.
   */
  public dismissReminder(taskId: string, reminderId: string): void {
    soundService.stopAlarmLoop();
    this.markReminderTriggered(taskId, reminderId);
  }
}

export const reminderScheduler = new ReminderScheduler();
