export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'completed';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number; // e.g. every N days/weeks/months
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat (for weekly)
  endDate?: string; // YYYY-MM-DD
  behavior: 'create_next';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ReminderItem {
  id: string;
  offsetMinutes: number; // minutes before due date/time (0 = at due time)
  customOffsetLabel?: string;
  reminderTime: string; // ISO string calculated from task due date + time - offset
  enabled: boolean;
  triggered: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  categoryId?: string;
  color?: string;
  status: TaskStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  completedAt?: string | null; // ISO string
  reminders: ReminderItem[];
  recurrence?: RecurrenceConfig;
  subtasks: Subtask[];
  archived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // e.g. '#6366f1' or color name
  icon?: string;
  isDefault?: boolean;
}

export type DashboardWidgetId =
  | 'stats'
  | 'today_tasks'
  | 'upcoming_reminders'
  | 'weekly_summary'
  | 'category_breakdown'
  | 'productivity_streak'
  | 'completion_chart';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber' | 'sky';
  density: 'comfortable' | 'compact';
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  defaultCalendarView: 'month' | 'week' | 'day';
  timeFormat: '12h' | '24h';
  notificationsEnabled: boolean;
  defaultReminderOffsets: number[]; // e.g. [0, 15, 60]
  alarmSound: 'chime' | 'digital' | 'soft_bell' | 'marimba';
  alarmVolume: number; // 0 to 1
  snoozeDurationMinutes: number; // 5, 10, 15
  dashboardWidgets: Record<DashboardWidgetId, boolean>;
  dashboardWidgetOrder: DashboardWidgetId[];
}

export interface AppData {
  version: string; // "1.0.0"
  tasks: Task[];
  categories: Category[];
  settings: AppSettings;
  lastBackupAt?: string;
}

export interface TriggeredReminderAlert {
  task: Task;
  reminder: ReminderItem;
}
