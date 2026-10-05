import { useState, useMemo } from 'react';
import { Task, Priority } from '../types';
import { isTaskOverdue } from '../utils/dateUtils';

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title' | 'completedAt';
export type SortOrder = 'asc' | 'desc';

export interface TaskFilterOptions {
  searchQuery: string;
  status: 'all' | 'pending' | 'completed' | 'overdue';
  priority: 'all' | Priority;
  categoryId: 'all' | 'none' | string;
  dueDateFilter: 'all' | 'today' | 'upcoming' | 'overdue' | 'no_date';
  sortField: SortField;
  sortOrder: SortOrder;
}

const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useTaskFilters(tasks: Task[]) {
  const [filters, setFilters] = useState<TaskFilterOptions>({
    searchQuery: '',
    status: 'all',
    priority: 'all',
    categoryId: 'all',
    dueDateFilter: 'all',
    sortField: 'dueDate',
    sortOrder: 'asc',
  });

  const setFilter = <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      priority: 'all',
      categoryId: 'all',
      dueDateFilter: 'all',
      sortField: 'dueDate',
      sortOrder: 'asc',
    });
  };

  const filteredTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return tasks.filter((task) => {
      // Exclude archived tasks from standard list view
      if (task.archived) return false;

      // 1. Search Query (title, description, notes)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const inTitle = task.title.toLowerCase().includes(query);
        const inDesc = task.description?.toLowerCase().includes(query);
        const inNotes = task.notes?.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inNotes) return false;
      }

      // 2. Status
      if (filters.status === 'pending' && task.status !== 'pending') return false;
      if (filters.status === 'completed' && task.status !== 'completed') return false;
      if (filters.status === 'overdue') {
        if (!isTaskOverdue(task.dueDate, task.dueTime, task.status)) return false;
      }

      // 3. Priority
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

      // 4. Category
      if (filters.categoryId !== 'all') {
        if (filters.categoryId === 'none' && task.categoryId) return false;
        if (filters.categoryId !== 'none' && task.categoryId !== filters.categoryId) return false;
      }

      // 5. Due Date Filter
      if (filters.dueDateFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (filters.dueDateFilter === 'upcoming') {
        if (!task.dueDate || task.dueDate <= todayStr) return false;
      } else if (filters.dueDateFilter === 'overdue') {
        if (!isTaskOverdue(task.dueDate, task.dueTime, task.status)) return false;
      } else if (filters.dueDateFilter === 'no_date') {
        if (task.dueDate) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (filters.sortField) {
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1; // no due date goes last
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.localeCompare(b.dueDate);
          break;
        }
        case 'priority': {
          comparison = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]; // Default highest priority first
          break;
        }
        case 'createdAt': {
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
        }
        case 'title': {
          comparison = a.title.localeCompare(b.title);
          break;
        }
        case 'completedAt': {
          const timeA = a.completedAt || '';
          const timeB = b.completedAt || '';
          comparison = timeA.localeCompare(timeB);
          break;
        }
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTasks, filters.sortField, filters.sortOrder]);

  return {
    filters,
    setFilter,
    resetFilters,
    filteredTasks: sortedTasks,
    totalCount: tasks.length,
    filteredCount: sortedTasks.length,
  };
}
