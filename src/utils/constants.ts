import { Category, AppSettings, DashboardWidgetId } from '../types';

export const CURRENT_SCHEMA_VERSION = '1.0.0';
export const LOCAL_STORAGE_KEY = 'todolist_app_data_v1';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work', color: '#4f46e5', icon: 'Briefcase', isDefault: true },
  { id: 'cat-personal', name: 'Personal', color: '#10b981', icon: 'User', isDefault: true },
  { id: 'cat-study', name: 'Study', color: '#f59e0b', icon: 'BookOpen', isDefault: true },
  { id: 'cat-health', name: 'Health', color: '#ec4899', icon: 'Heart', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', color: '#8b5cf6', icon: 'ShoppingCart', isDefault: true },
];

export const DEFAULT_DASHBOARD_WIDGETS: Record<DashboardWidgetId, boolean> = {
  stats: true,
  today_tasks: true,
  upcoming_reminders: true,
  weekly_summary: true,
  category_breakdown: true,
  productivity_streak: true,
  completion_chart: true,
};

export const DEFAULT_DASHBOARD_WIDGET_ORDER: DashboardWidgetId[] = [
  'stats',
  'today_tasks',
  'upcoming_reminders',
  'weekly_summary',
  'category_breakdown',
  'productivity_streak',
  'completion_chart',
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  accentColor: 'indigo',
  density: 'comfortable',
  weekStartDay: 1, // Monday
  defaultCalendarView: 'month',
  timeFormat: '12h',
  notificationsEnabled: true,
  defaultReminderOffsets: [0, 15, 60], // 0 min (at due time), 15 min, 1 hr
  alarmSound: 'chime',
  alarmVolume: 0.7,
  snoozeDurationMinutes: 10,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  dashboardWidgetOrder: DEFAULT_DASHBOARD_WIDGET_ORDER,
};

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeColor: 'bg-emerald-500',
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badgeColor: 'bg-amber-500',
  },
  high: {
    label: 'High',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    badgeColor: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    color: '#ef4444',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    badgeColor: 'bg-rose-500',
  },
};
