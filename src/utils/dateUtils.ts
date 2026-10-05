import {
  format,
  parseISO,
  isBefore,
  isToday,
  isPast,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  setDay,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDaysInMonth,
} from 'date-fns';
import { RecurrenceConfig } from '../types';

/**
 * Combine local date string (YYYY-MM-DD) and optional time string (HH:mm) into a JS Date object.
 */
export function combineDateAndTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    // Default to end of day if time is omitted when checking overdue, or start of day depending on context
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

/**
 * Format date string into human readable string e.g. "Oct 15, 2026"
 */
export function formatDateString(dateStr?: string, formatPattern = 'MMM d, yyyy'): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, formatPattern);
}

/**
 * Format time string e.g. "14:30" -> "2:30 PM" (12h) or "14:30" (24h)
 */
export function formatTimeString(timeStr?: string, format24h = false): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return format(date, format24h ? 'HH:mm' : 'h:mm a');
}

/**
 * Convert 12-hour time components to 24-hour HH:mm string.
 * Handles midnight (12 AM → "00:xx") and noon (12 PM → "12:xx") correctly.
 */
export function time12To24(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour % 12; // normalise: 12 → 0
  if (ampm === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Parse a 24-hour HH:mm string into 12-hour components.
 * Returns { hour: 1-12, minute: 0-59, ampm: 'AM'|'PM' }
 */
export function time24To12(timeStr: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: m, ampm };
}

/**
 * Check if a task with due date/time is overdue.
 * Crucial rule: Tasks without due dates are NEVER overdue.
 */
export function isTaskOverdue(dueDate?: string, dueTime?: string, status = 'pending'): boolean {
  if (status === 'completed' || !dueDate) return false;
  
  const targetDate = combineDateAndTime(dueDate, dueTime);
  if (!targetDate) return false;

  const now = new Date();

  // If due time is explicitly set, check exact past minute
  if (dueTime) {
    return targetDate < now;
  }

  // If due time is NOT set, task is overdue only after the due date ends (i.e. starting next day)
  const endOfDueDate = endOfDay(targetDate);
  return now > endOfDueDate;
}

/**
 * Check if date is today
 */
export function isTaskDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return isToday(date);
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get current time in HH:mm
 */
export function getCurrentTimeString(): string {
  return format(new Date(), 'HH:mm');
}

/**
 * Calculate the next occurrence date for a recurring task when completed.
 */
export function calculateNextOccurrence(
  currentDueDate: string,
  dueTime: string | undefined,
  config: RecurrenceConfig
): { nextDueDate: string; nextDueTime?: string } | null {
  const [year, month, day] = currentDueDate.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);
  let nextDate: Date;

  const interval = Math.max(1, config.interval || 1);

  switch (config.type) {
    case 'daily': {
      nextDate = addDays(baseDate, interval);
      break;
    }
    case 'weekly': {
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        // Find next day in the list after baseDate
        let candidate = addDays(baseDate, 1);
        let found = false;
        // Search up to 4 weeks out
        for (let i = 0; i < 28; i++) {
          const dayOfWeek = candidate.getDay();
          if (config.daysOfWeek.includes(dayOfWeek)) {
            found = true;
            break;
          }
          candidate = addDays(candidate, 1);
        }
        nextDate = found ? candidate : addWeeks(baseDate, interval);
      } else {
        nextDate = addWeeks(baseDate, interval);
      }
      break;
    }
    case 'monthly': {
      // Safely handles month ends (Jan 31 -> Feb 28/29) via date-fns addMonths
      nextDate = addMonths(baseDate, interval);
      break;
    }
    case 'custom': {
      nextDate = addDays(baseDate, interval);
      break;
    }
    default:
      nextDate = addDays(baseDate, 1);
  }

  const nextDueDateStr = format(nextDate, 'yyyy-MM-dd');

  // Check if exceeds end date
  if (config.endDate && nextDueDateStr > config.endDate) {
    return null;
  }

  return {
    nextDueDate: nextDueDateStr,
    nextDueTime: dueTime,
  };
}

/**
 * Calculate ISO timestamp for a reminder given task due date, time, and offset minutes
 */
export function calculateReminderTime(
  dueDate: string,
  dueTime: string | undefined,
  offsetMinutes: number
): string | null {
  const taskDateTime = combineDateAndTime(dueDate, dueTime || '09:00');
  if (!taskDateTime) return null;

  const reminderMs = taskDateTime.getTime() - offsetMinutes * 60 * 1000;
  return new Date(reminderMs).toISOString();
}

/**
 * Get greeting string based on local time
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
