import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppData,
  Task,
  Category,
  AppSettings,
  Priority,
  RecurrenceConfig,
  Subtask,
  ReminderItem,
  DashboardWidgetId,
  TriggeredReminderAlert,
} from '../types';
import { storageService } from '../services/storage/localStorageService';
import { reminderScheduler } from '../services/scheduler/reminderScheduler';
import { soundService } from '../services/audio/soundService';
import { calculateNextOccurrence, calculateReminderTime, isTaskOverdue } from '../utils/dateUtils';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface AppContextType {
  data: AppData;
  tasks: Task[];
  categories: Category[];
  settings: AppSettings;

  // Task Actions
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  bulkCompleteTasks: (taskIds: string[]) => void;
  bulkDeleteTasks: (taskIds: string[]) => void;

  // Subtasks Actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  reorderSubtasks: (taskId: string, subtasks: Subtask[]) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleWidget: (widgetId: DashboardWidgetId) => void;
  reorderWidgets: (newOrder: DashboardWidgetId[]) => void;

  // In-App Reminder Alert Modal
  activeReminderAlert: TriggeredReminderAlert | null;
  dismissReminderAlert: () => void;
  snoozeReminderAlert: (minutes: number) => void;
  completeTaskFromAlert: () => void;

  // Backup & Storage
  reloadFromStorage: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appData, setAppData] = useState<AppData>(() => storageService.loadData());
  const [activeReminderAlert, setActiveReminderAlert] = useState<TriggeredReminderAlert | null>(null);

  // Sync state to LocalStorage and reminder scheduler
  const updateAppDataState = useCallback((newData: AppData) => {
    setAppData(newData);
    storageService.saveData(newData);
    reminderScheduler.syncAndSchedule(newData);
  }, []);

  // Initialize scheduler and apply theme on mount
  useEffect(() => {
    reminderScheduler.syncAndSchedule(appData);

    const unsubscribe = reminderScheduler.subscribe((alert) => {
      setActiveReminderAlert(alert);
    });

    return () => {
      unsubscribe();
      reminderScheduler.clearAllTimers();
    };
  }, []);

  // Theme application side effect
  useEffect(() => {
    const root = document.documentElement;
    const theme = appData.settings.theme;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [appData.settings.theme]);

  // Task Actions
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Task => {
      const now = new Date().toISOString();
      const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Calculate initial reminder times if reminders attached
      const formattedReminders: ReminderItem[] = (taskData.reminders || []).map((r) => {
        const reminderTime = calculateReminderTime(taskData.dueDate || '', taskData.dueTime, r.offsetMinutes);
        return {
          id: r.id || `rem-${Math.random().toString(36).substring(2, 7)}`,
          offsetMinutes: r.offsetMinutes,
          reminderTime: reminderTime || now,
          enabled: r.enabled ?? true,
          triggered: false,
        };
      });

      const newTask: Task = {
        ...taskData,
        id: newId,
        title: taskData.title.trim().substring(0, 200),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        subtasks: taskData.subtasks || [],
        reminders: formattedReminders,
      };

      const updatedData = {
        ...appData,
        tasks: [newTask, ...appData.tasks],
      };

      updateAppDataState(updatedData);
      return newTask;
    },
    [appData, updateAppDataState]
  );

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      const now = new Date().toISOString();
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          const dueDate = updates.dueDate !== undefined ? updates.dueDate : task.dueDate;
          const dueTime = updates.dueTime !== undefined ? updates.dueTime : task.dueTime;
          const reminders = updates.reminders !== undefined ? updates.reminders : task.reminders;

          // Re-calculate reminder times if due date/time changed
          const recalculatedReminders = reminders.map((r) => {
            if (dueDate) {
              const computedTime = calculateReminderTime(dueDate, dueTime, r.offsetMinutes);
              return {
                ...r,
                reminderTime: computedTime || r.reminderTime,
                triggered: false, // reset triggered status on date edit
              };
            }
            return r;
          });

          return {
            ...task,
            ...updates,
            reminders: recalculatedReminders,
            updatedAt: now,
          };
        }
        return task;
      });

      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const updatedTasks = appData.tasks.filter((t) => t.id !== taskId);
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const completeTask = useCallback(
    (taskId: string) => {
      const now = new Date().toISOString();
      const taskToComplete = appData.tasks.find((t) => t.id === taskId);
      if (!taskToComplete || taskToComplete.status === 'completed') return;

      let newTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          // Mark completed, set timestamp, complete subtasks, cancel pending reminders
          return {
            ...task,
            status: 'completed' as const,
            completedAt: now,
            updatedAt: now,
            subtasks: task.subtasks.map((s) => ({ ...s, completed: true })),
            reminders: task.reminders.map((r) => ({ ...r, enabled: false })),
          };
        }
        return task;
      });

      // Handle Recurring Task creation
      if (taskToComplete.recurrence && taskToComplete.dueDate) {
        const nextOccurrence = calculateNextOccurrence(
          taskToComplete.dueDate,
          taskToComplete.dueTime,
          taskToComplete.recurrence
        );

        if (nextOccurrence) {
          const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const newReminders: ReminderItem[] = taskToComplete.reminders.map((r) => ({
            ...r,
            id: `rem-${Math.random().toString(36).substring(2, 7)}`,
            reminderTime:
              calculateReminderTime(nextOccurrence.nextDueDate, nextOccurrence.nextDueTime, r.offsetMinutes) ||
              now,
            triggered: false,
            enabled: true,
          }));

          const nextTask: Task = {
            ...taskToComplete,
            id: newId,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            dueDate: nextOccurrence.nextDueDate,
            dueTime: nextOccurrence.nextDueTime,
            subtasks: taskToComplete.subtasks.map((s) => ({
              ...s,
              id: `sub-${Math.random().toString(36).substring(2, 7)}`,
              completed: false,
            })),
            reminders: newReminders,
          };

          // Insert next occurrence into tasks list
          newTasks = [nextTask, ...newTasks];
        }
      }

      updateAppDataState({ ...appData, tasks: newTasks });
    },
    [appData, updateAppDataState]
  );

  const restoreTask = useCallback(
    (taskId: string) => {
      const now = new Date().toISOString();
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            status: 'pending' as const,
            completedAt: null,
            updatedAt: now,
            reminders: task.reminders.map((r) => ({ ...r, enabled: true, triggered: false })),
          };
        }
        return task;
      });

      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const bulkCompleteTasks = useCallback(
    (taskIds: string[]) => {
      const setIds = new Set(taskIds);
      taskIds.forEach((id) => completeTask(id));
    },
    [completeTask]
  );

  const bulkDeleteTasks = useCallback(
    (taskIds: string[]) => {
      const setIds = new Set(taskIds);
      const updatedTasks = appData.tasks.filter((t) => !setIds.has(t.id));
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  // Subtasks Actions
  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      if (!title.trim()) return;
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          const newSubtask: Subtask = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            title: title.trim(),
            completed: false,
          };
          return { ...task, subtasks: [...task.subtasks, newSubtask] };
        }
        return task;
      });
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s));
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const deleteSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId) };
        }
        return task;
      });
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  const reorderSubtasks = useCallback(
    (taskId: string, subtasks: Subtask[]) => {
      const updatedTasks = appData.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, subtasks };
        }
        return task;
      });
      updateAppDataState({ ...appData, tasks: updatedTasks });
    },
    [appData, updateAppDataState]
  );

  // Category Actions
  const addCategory = useCallback(
    (category: Omit<Category, 'id'>): Category => {
      const newCat: Category = {
        ...category,
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      };
      const updatedCategories = [...appData.categories, newCat];
      updateAppDataState({ ...appData, categories: updatedCategories });
      return newCat;
    },
    [appData, updateAppDataState]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      const updatedCategories = appData.categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      updateAppDataState({ ...appData, categories: updatedCategories });
    },
    [appData, updateAppDataState]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      // Unset categoryId on tasks using this category
      const updatedTasks = appData.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t));
      const updatedCategories = appData.categories.filter((c) => c.id !== id);
      updateAppDataState({ ...appData, tasks: updatedTasks, categories: updatedCategories });
    },
    [appData, updateAppDataState]
  );

  // Settings Actions
  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      const newSettings = { ...appData.settings, ...updates };
      updateAppDataState({ ...appData, settings: newSettings });
    },
    [appData, updateAppDataState]
  );

  const toggleWidget = useCallback(
    (widgetId: DashboardWidgetId) => {
      const currentVal = appData.settings.dashboardWidgets[widgetId] ?? true;
      const updatedWidgets = {
        ...appData.settings.dashboardWidgets,
        [widgetId]: !currentVal,
      };
      updateSettings({ dashboardWidgets: updatedWidgets });
    },
    [appData.settings.dashboardWidgets, updateSettings]
  );

  const reorderWidgets = useCallback(
    (newOrder: DashboardWidgetId[]) => {
      updateSettings({ dashboardWidgetOrder: newOrder });
    },
    [updateSettings]
  );

  // Reminder Alert Modal Handlers
  const dismissReminderAlert = useCallback(() => {
    soundService.stopAlarmLoop();
    if (activeReminderAlert) {
      reminderScheduler.dismissReminder(activeReminderAlert.task.id, activeReminderAlert.reminder.id);
    }
    setActiveReminderAlert(null);
  }, [activeReminderAlert]);

  const snoozeReminderAlert = useCallback(
    (minutes: number) => {
      soundService.stopAlarmLoop();
      if (activeReminderAlert) {
        reminderScheduler.snoozeReminder(
          activeReminderAlert.task.id,
          activeReminderAlert.reminder.id,
          minutes
        );
      }
      setActiveReminderAlert(null);
    },
    [activeReminderAlert]
  );

  const completeTaskFromAlert = useCallback(() => {
    soundService.stopAlarmLoop();
    if (activeReminderAlert) {
      completeTask(activeReminderAlert.task.id);
    }
    setActiveReminderAlert(null);
  }, [activeReminderAlert, completeTask]);

  const reloadFromStorage = useCallback(() => {
    const loaded = storageService.loadData();
    setAppData(loaded);
    reminderScheduler.syncAndSchedule(loaded);
  }, []);

  const clearAllData = useCallback(() => {
    storageService.clearData();
    const fresh = storageService.loadData();
    setAppData(fresh);
    reminderScheduler.syncAndSchedule(fresh);
  }, []);

  return (
    <AppContext.Provider
      value={{
        data: appData,
        tasks: appData.tasks,
        categories: appData.categories,
        settings: appData.settings,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        restoreTask,
        bulkCompleteTasks,
        bulkDeleteTasks,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        reorderSubtasks,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        toggleWidget,
        reorderWidgets,
        activeReminderAlert,
        dismissReminderAlert,
        snoozeReminderAlert,
        completeTaskFromAlert,
        reloadFromStorage,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
