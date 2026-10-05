import { describe, it, expect } from 'vitest';
import {
  isTaskOverdue,
  calculateNextOccurrence,
  calculateReminderTime,
  combineDateAndTime,
  time12To24,
  time24To12,
  formatTimeString,
} from '../utils/dateUtils';
import { RecurrenceConfig } from '../types';

// ─── Date Utilities & Recurrence Logic ────────────────────────────────────────
describe('Date Utilities & Recurrence Logic', () => {
  it('correctly identifies overdue tasks and ignores tasks without due dates', () => {
    expect(isTaskOverdue(undefined, undefined, 'pending')).toBe(false);
    expect(isTaskOverdue('2020-01-01', '10:00', 'completed')).toBe(false);
    expect(isTaskOverdue('2020-01-01', '10:00', 'pending')).toBe(true);
    expect(isTaskOverdue('2099-12-31', '10:00', 'pending')).toBe(false);
  });

  it('date-only task is NOT overdue during its due date (only after end of day)', () => {
    expect(isTaskOverdue('2099-12-31', undefined, 'pending')).toBe(false);
    expect(isTaskOverdue('2020-06-15', undefined, 'pending')).toBe(true);
  });

  it('unscheduled task (no date, no time) is never overdue', () => {
    expect(isTaskOverdue(undefined, undefined, 'pending')).toBe(false);
    expect(isTaskOverdue(undefined, undefined, 'completed')).toBe(false);
  });

  it('calculates daily recurrence correctly', () => {
    const config: RecurrenceConfig = {
      type: 'daily',
      interval: 1,
      behavior: 'create_next',
    };
    const next = calculateNextOccurrence('2026-05-10', '14:00', config);
    expect(next?.nextDueDate).toBe('2026-05-11');
    expect(next?.nextDueTime).toBe('14:00');
  });

  it('handles month-end and leap-year recurrence calculations safely', () => {
    const config: RecurrenceConfig = {
      type: 'monthly',
      interval: 1,
      behavior: 'create_next',
    };
    const jan31 = calculateNextOccurrence('2026-01-31', '09:00', config);
    expect(jan31?.nextDueDate).toMatch(/^2026-02-2[89]$/);
  });

  it('calculates reminder timestamp based on offset minutes', () => {
    const reminderIso = calculateReminderTime('2026-10-15', '12:00', 30);
    expect(reminderIso).not.toBeNull();
    const date = new Date(reminderIso!);
    expect(date.getHours()).toBe(11);
    expect(date.getMinutes()).toBe(30);
  });

  it('calculates reminder at-due-time (offset=0)', () => {
    const reminderIso = calculateReminderTime('2026-10-15', '09:00', 0);
    expect(reminderIso).not.toBeNull();
    const date = new Date(reminderIso!);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
  });

  it('reminder offsets calculate correctly for all standard intervals', () => {
    const offsets = [5, 10, 15, 30, 60, 1440];
    const base = '2026-11-01';
    const time = '14:00';

    offsets.forEach((offset) => {
      const iso = calculateReminderTime(base, time, offset);
      expect(iso).not.toBeNull();
      const fired = new Date(iso!);
      const dueMs = new Date(`${base}T${time}`).getTime();
      const diffMin = (dueMs - fired.getTime()) / 60000;
      expect(Math.round(diffMin)).toBe(offset);
    });
  });
});

// ─── 12-hour ↔ 24-hour time conversion ────────────────────────────────────────
describe('12-hour ↔ 24-hour time conversion', () => {
  it('9:30 AM → 09:30', () => {
    expect(time12To24(9, 30, 'AM')).toBe('09:30');
  });

  it('6:45 PM → 18:45', () => {
    expect(time12To24(6, 45, 'PM')).toBe('18:45');
  });

  it('12:00 AM (midnight) → 00:00', () => {
    expect(time12To24(12, 0, 'AM')).toBe('00:00');
    expect(time12To24(12, 30, 'AM')).toBe('00:30');
  });

  it('12:00 PM (noon) → 12:00', () => {
    expect(time12To24(12, 0, 'PM')).toBe('12:00');
    expect(time12To24(12, 59, 'PM')).toBe('12:59');
  });

  it('2:30 PM → 14:30', () => {
    expect(time12To24(2, 30, 'PM')).toBe('14:30');
  });

  it('9:15 AM → 09:15', () => {
    expect(time12To24(9, 15, 'AM')).toBe('09:15');
  });

  it('converts standard AM times correctly', () => {
    expect(time12To24(9, 0, 'AM')).toBe('09:00');
    expect(time12To24(11, 45, 'AM')).toBe('11:45');
    expect(time12To24(1, 5, 'AM')).toBe('01:05');
  });

  it('converts standard PM times correctly', () => {
    expect(time12To24(2, 30, 'PM')).toBe('14:30');
    expect(time12To24(6, 0, 'PM')).toBe('18:00');
    expect(time12To24(11, 59, 'PM')).toBe('23:59');
  });

  it('parses 09:00 → hour 9, minute 0, AM', () => {
    expect(time24To12('09:00')).toEqual({ hour: 9, minute: 0, ampm: 'AM' });
  });

  it('parses 14:30 → hour 2, minute 30, PM', () => {
    expect(time24To12('14:30')).toEqual({ hour: 2, minute: 30, ampm: 'PM' });
  });

  it('parses 00:00 (midnight) → 12:00 AM', () => {
    expect(time24To12('00:00')).toEqual({ hour: 12, minute: 0, ampm: 'AM' });
  });

  it('parses 12:00 (noon) → 12:00 PM', () => {
    expect(time24To12('12:00')).toEqual({ hour: 12, minute: 0, ampm: 'PM' });
  });

  it('round-trips correctly (12→24→12)', () => {
    const cases: Array<[number, number, 'AM' | 'PM']> = [
      [12, 0, 'AM'],
      [12, 0, 'PM'],
      [1, 15, 'AM'],
      [11, 59, 'PM'],
      [6, 30, 'PM'],
      [9, 0, 'AM'],
      [2, 30, 'PM'],
    ];
    cases.forEach(([h, m, ap]) => {
      const str24 = time12To24(h, m, ap);
      const back = time24To12(str24);
      expect(back.hour).toBe(h);
      expect(back.minute).toBe(m);
      expect(back.ampm).toBe(ap);
    });
  });
});

// ─── Time input validation (simulates computeDueTime logic) ───────────────────
describe('Time input validation', () => {
  // Mirrors the computeDueTime helper from TaskFormModal
  function computeDueTime(hourStr: string, minuteStr: string, ap: 'AM' | 'PM'): string {
    if (hourStr === '' || minuteStr === '') return '';
    const h = parseInt(hourStr, 10);
    const m = parseInt(minuteStr, 10);
    if (isNaN(h) || isNaN(m)) return '';
    if (h < 1 || h > 12 || m < 0 || m > 59) return '';
    return time12To24(h, m, ap);
  }

  it('blank inputs produce no due time', () => {
    expect(computeDueTime('', '', 'AM')).toBe('');
    expect(computeDueTime('09', '', 'AM')).toBe('');
    expect(computeDueTime('', '30', 'AM')).toBe('');
  });

  it('valid inputs produce correct 24h time', () => {
    expect(computeDueTime('02', '30', 'PM')).toBe('14:30');
    expect(computeDueTime('9', '0', 'AM')).toBe('09:00');
    expect(computeDueTime('12', '00', 'AM')).toBe('00:00');
    expect(computeDueTime('12', '00', 'PM')).toBe('12:00');
  });

  it('rejects out-of-range hour (0, 13, 99)', () => {
    expect(computeDueTime('0', '30', 'AM')).toBe('');
    expect(computeDueTime('13', '30', 'AM')).toBe('');
    expect(computeDueTime('99', '00', 'PM')).toBe('');
  });

  it('rejects out-of-range minute (60, 99)', () => {
    expect(computeDueTime('09', '60', 'AM')).toBe('');
    expect(computeDueTime('09', '99', 'AM')).toBe('');
  });

  it('rejects non-numeric input', () => {
    expect(computeDueTime('ab', '30', 'AM')).toBe('');
    expect(computeDueTime('09', 'xy', 'AM')).toBe('');
  });
});

// ─── Reminder scheduling behavior ────────────────────────────────────────────
describe('Reminder scheduling behavior', () => {
  it('snooze offsets: 5, 10, 15 minutes all produce valid timestamps', () => {
    const now = new Date().toISOString().split('T')[0];
    const futureHour = (new Date().getHours() + 2) % 24;
    const futureTime = `${String(futureHour).padStart(2, '0')}:00`;

    [5, 10, 15].forEach((snooze) => {
      const iso = calculateReminderTime(now, futureTime, 0);
      expect(iso).not.toBeNull();
      const reminderForSnooze = calculateReminderTime(now, futureTime, snooze);
      expect(reminderForSnooze).not.toBeNull();
      // at-due-time fires later than the earlier (offset) reminder, so diff > 0
      const diff =
        (new Date(iso!).getTime() - new Date(reminderForSnooze!).getTime()) / 60000;
      expect(Math.round(diff)).toBe(snooze);
    });
  });

  it('reminder with no due time falls back to 09:00 default', () => {
    const isoWithDefault = calculateReminderTime('2026-12-01', undefined, 0);
    const isoExplicit = calculateReminderTime('2026-12-01', '09:00', 0);
    expect(isoWithDefault).toBe(isoExplicit);
  });

  it('due-time distinct from reminder time: 10 min before fires at different time', () => {
    const dueLso = calculateReminderTime('2026-10-20', '14:00', 0);
    const reminderIso = calculateReminderTime('2026-10-20', '14:00', 10);
    expect(dueLso).not.toBe(reminderIso);
    const diffMin =
      (new Date(dueLso!).getTime() - new Date(reminderIso!).getTime()) / 60000;
    expect(Math.round(diffMin)).toBe(10);
  });

  it('formatTimeString converts 24h to 12h display correctly', () => {
    expect(formatTimeString('09:00')).toBe('9:00 AM');
    expect(formatTimeString('14:30')).toBe('2:30 PM');
    expect(formatTimeString('00:00')).toBe('12:00 AM');
    expect(formatTimeString('12:00')).toBe('12:00 PM');
    expect(formatTimeString('')).toBe('');
    expect(formatTimeString(undefined)).toBe('');
  });
});
