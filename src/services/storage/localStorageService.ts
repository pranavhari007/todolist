import { AppData, Task, Category, AppSettings } from '../../types';
import {
  CURRENT_SCHEMA_VERSION,
  LOCAL_STORAGE_KEY,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
} from '../../utils/constants';

/**
 * Creates initial default AppData object.
 */
export function createInitialAppData(): AppData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    tasks: [],
    categories: DEFAULT_CATEGORIES,
    settings: DEFAULT_SETTINGS,
  };
}

/**
 * Validates and migrates stored payload if needed.
 */
function validateAndMigrateData(raw: any): AppData {
  if (!raw || typeof raw !== 'object') {
    return createInitialAppData();
  }

  const tasks: Task[] = Array.isArray(raw.tasks)
    ? raw.tasks.map((t: any) => ({
        id: String(t.id || `task-${Date.now()}-${Math.random()}`),
        title: String(t.title || 'Untitled Task').substring(0, 200),
        description: t.description ? String(t.description) : undefined,
        notes: t.notes ? String(t.notes) : undefined,
        dueDate: t.dueDate ? String(t.dueDate) : undefined,
        dueTime: t.dueTime ? String(t.dueTime) : undefined,
        priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
        categoryId: t.categoryId ? String(t.categoryId) : undefined,
        color: t.color ? String(t.color) : undefined,
        status: t.status === 'completed' ? 'completed' : 'pending',
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
        completedAt: t.completedAt || null,
        reminders: Array.isArray(t.reminders) ? t.reminders : [],
        recurrence: t.recurrence || undefined,
        subtasks: Array.isArray(t.subtasks)
          ? t.subtasks.map((s: any) => ({
              id: String(s.id || `sub-${Math.random()}`),
              title: String(s.title || ''),
              completed: Boolean(s.completed),
            }))
          : [],
        archived: Boolean(t.archived),
      }))
    : [];

  const categories: Category[] = Array.isArray(raw.categories) && raw.categories.length > 0
    ? raw.categories.map((c: any) => ({
        id: String(c.id),
        name: String(c.name || 'Category'),
        color: String(c.color || '#6366f1'),
        icon: c.icon ? String(c.icon) : undefined,
        isDefault: Boolean(c.isDefault),
      }))
    : DEFAULT_CATEGORIES;

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}),
  };

  return {
    version: CURRENT_SCHEMA_VERSION,
    tasks,
    categories,
    settings,
    lastBackupAt: raw.lastBackupAt ? String(raw.lastBackupAt) : undefined,
  };
}

class LocalStorageService {
  private memoryCache: AppData | null = null;

  /**
   * Load application data from Local Storage.
   */
  public loadData(): AppData {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!serialized) {
        const initial = createInitialAppData();
        this.saveData(initial);
        return initial;
      }

      const parsed = JSON.parse(serialized);
      const validated = validateAndMigrateData(parsed);
      this.memoryCache = validated;
      return validated;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      const fallback = createInitialAppData();
      this.memoryCache = fallback;
      return fallback;
    }
  }

  /**
   * Save application data atomically to Local Storage.
   */
  public saveData(data: AppData): boolean {
    try {
      data.version = CURRENT_SCHEMA_VERSION;
      const serialized = JSON.stringify(data);
      localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
      this.memoryCache = data;
      return true;
    } catch (error) {
      console.error('LocalStorage quota or access error:', error);
      return false;
    }
  }

  /**
   * Completely clear application data.
   */
  public clearData(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      this.memoryCache = createInitialAppData();
      this.saveData(this.memoryCache);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Invalidate memory cache to force fresh read from disk.
   */
  public invalidateCache(): void {
    this.memoryCache = null;
  }
}

export const storageService = new LocalStorageService();
