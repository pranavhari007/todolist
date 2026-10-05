import { useMemo } from 'react';
import { Task, Category, Priority } from '../types';
import { isTaskOverdue } from '../utils/dateUtils';
import { PRIORITY_CONFIG } from '../utils/constants';
import { subDays, format, parseISO, differenceInHours } from 'date-fns';

export interface AnalyticsSummary {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number; // 0-100
  currentStreak: number;
  longestStreak: number;
  avgCompletionTimeHours: number | null;
  dailyCompletionCounts: { date: string; label: string; count: number }[];
  weeklyTrends: { week: string; completed: number; created: number }[];
  categoryDistribution: { name: string; color: string; count: number; completed: number }[];
  priorityDistribution: { priority: Priority; label: string; color: string; count: number }[];
}

export function useTaskAnalytics(tasks: Task[], categories: Category[]): AnalyticsSummary {
  return useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived);

    const totalTasks = activeTasks.length;
    const pendingTasks = activeTasks.filter((t) => t.status === 'pending').length;
    const completedTasks = activeTasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t.dueDate, t.dueTime, t.status)).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Daily Completion Counts for last 14 days
    const today = new Date();
    const dailyCompletionCounts: { date: string; label: string; count: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const labelStr = format(d, 'MMM d');

      const count = activeTasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(dateStr)
      ).length;

      dailyCompletionCounts.push({ date: dateStr, label: labelStr, count });
    }

    // Weekly Trends for past 4 weeks
    const weeklyTrends: { week: string; completed: number; created: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = subDays(today, w * 7 + 6);
      const end = subDays(today, w * 7);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const label = `W${4 - w} (${format(start, 'MMM d')})`;

      const created = activeTasks.filter((t) => {
        const cDate = t.createdAt.split('T')[0];
        return cDate >= startStr && cDate <= endStr;
      }).length;

      const completed = activeTasks.filter((t) => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const compDate = t.completedAt.split('T')[0];
        return compDate >= startStr && compDate <= endStr;
      }).length;

      weeklyTrends.push({ week: label, completed, created });
    }

    // Category Distribution
    const catMap = new Map<string, { name: string; color: string; count: number; completed: number }>();

    // Add default category structures
    categories.forEach((cat) => {
      catMap.set(cat.id, { name: cat.name, color: cat.color, count: 0, completed: 0 });
    });
    catMap.set('uncategorized', { name: 'Uncategorized', color: '#9ca3af', count: 0, completed: 0 });

    activeTasks.forEach((t) => {
      const catId = t.categoryId || 'uncategorized';
      const entry = catMap.get(catId) || { name: 'Uncategorized', color: '#9ca3af', count: 0, completed: 0 };
      entry.count += 1;
      if (t.status === 'completed') {
        entry.completed += 1;
      }
      catMap.set(catId, entry);
    });

    const categoryDistribution = Array.from(catMap.values()).filter((c) => c.count > 0);

    // Priority Distribution
    const priorityCounts: Record<Priority, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    activeTasks.forEach((t) => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    const priorityDistribution = (['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => ({
      priority: p,
      label: PRIORITY_CONFIG[p].label,
      color: PRIORITY_CONFIG[p].color,
      count: priorityCounts[p],
    }));

    // Streak Calculation
    const completedDatesSet = new Set<string>();
    activeTasks.forEach((t) => {
      if (t.status === 'completed' && t.completedAt) {
        completedDatesSet.add(t.completedAt.split('T')[0]);
      }
    });

    let currentStreak = 0;
    let checkDate = new Date();
    const todayStr = format(checkDate, 'yyyy-MM-dd');

    // If no tasks completed today, check yesterday as starting point for ongoing streak
    if (!completedDatesSet.has(todayStr)) {
      checkDate = subDays(checkDate, 1);
    }

    while (completedDatesSet.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak += 1;
      checkDate = subDays(checkDate, 1);
    }

    // Longest Streak
    const sortedCompletedDates = Array.from(completedDatesSet).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    sortedCompletedDates.forEach((dateStr) => {
      const curr = parseISO(dateStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curr;
    });

    // Average Completion Time in Hours
    let totalCompletionHours = 0;
    let completedWithDatesCount = 0;

    activeTasks.forEach((t) => {
      if (t.status === 'completed' && t.completedAt && t.createdAt) {
        try {
          const created = parseISO(t.createdAt);
          const completed = parseISO(t.completedAt);
          const diff = differenceInHours(completed, created);
          if (diff >= 0) {
            totalCompletionHours += diff;
            completedWithDatesCount += 1;
          }
        } catch (e) {
          // ignore invalid dates
        }
      }
    });

    const avgCompletionTimeHours =
      completedWithDatesCount > 0 ? Math.round((totalCompletionHours / completedWithDatesCount) * 10) / 10 : null;

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      currentStreak,
      longestStreak,
      avgCompletionTimeHours,
      dailyCompletionCounts,
      weeklyTrends,
      categoryDistribution,
      priorityDistribution,
    };
  }, [tasks, categories]);
}
