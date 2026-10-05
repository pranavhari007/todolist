import { AppData, Task, Category } from '../../types';
import { storageService } from '../storage/localStorageService';
import { CURRENT_SCHEMA_VERSION } from '../../utils/constants';

export interface BackupPreviewInfo {
  version: string;
  exportTimestamp?: string;
  taskCount: number;
  completedTaskCount: number;
  categoryCount: number;
  isValid: boolean;
  errors: string[];
}

class BackupService {
  /**
   * Export all application data to a JSON blob file download
   */
  public exportBackup(): void {
    const data = storageService.loadData();
    data.lastBackupAt = new Date().toISOString();
    storageService.saveData(data);

    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `todolist-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Inspect and validate uploaded backup JSON file
   */
  public validateBackupJSON(jsonString: string): { preview: BackupPreviewInfo; parsedData: AppData | null } {
    const errors: string[] = [];
    let parsed: any = null;

    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      errors.push('File content is not valid JSON.');
      return {
        preview: {
          version: 'unknown',
          taskCount: 0,
          completedTaskCount: 0,
          categoryCount: 0,
          isValid: false,
          errors,
        },
        parsedData: null,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      errors.push('Backup content must be a JSON object.');
    }

    if (!Array.isArray(parsed.tasks)) {
      errors.push('Missing or invalid "tasks" array in backup data.');
    }

    if (!Array.isArray(parsed.categories)) {
      errors.push('Missing or invalid "categories" array in backup data.');
    }

    const tasks: Task[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const categories: Category[] = Array.isArray(parsed.categories) ? parsed.categories : [];
    const completedCount = tasks.filter((t) => t.status === 'completed').length;

    const preview: BackupPreviewInfo = {
      version: parsed.version || '1.0.0',
      exportTimestamp: parsed.lastBackupAt,
      taskCount: tasks.length,
      completedTaskCount: completedCount,
      categoryCount: categories.length,
      isValid: errors.length === 0,
      errors,
    };

    return {
      preview,
      parsedData: errors.length === 0 ? (parsed as AppData) : null,
    };
  }

  /**
   * Import validated backup data using specified mode ('replace' | 'merge')
   */
  public importBackup(incomingData: AppData, mode: 'replace' | 'merge' = 'replace'): boolean {
    const current = storageService.loadData();

    if (mode === 'replace') {
      const success = storageService.saveData({
        ...incomingData,
        version: CURRENT_SCHEMA_VERSION,
        lastBackupAt: new Date().toISOString(),
      });
      return success;
    }

    // Merge mode: preserve existing items, append non-duplicate incoming items
    const existingTaskIds = new Set(current.tasks.map((t) => t.id));
    const mergedTasks = [...current.tasks];

    incomingData.tasks.forEach((inTask) => {
      let finalTask = { ...inTask };
      if (existingTaskIds.has(inTask.id)) {
        // Generate new unique ID for duplicate task
        finalTask.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      mergedTasks.push(finalTask);
    });

    const existingCatIds = new Set(current.categories.map((c) => c.id));
    const mergedCategories = [...current.categories];

    incomingData.categories.forEach((inCat) => {
      if (!existingCatIds.has(inCat.id)) {
        mergedCategories.push(inCat);
      }
    });

    const mergedData: AppData = {
      version: CURRENT_SCHEMA_VERSION,
      tasks: mergedTasks,
      categories: mergedCategories,
      settings: { ...current.settings, ...incomingData.settings },
      lastBackupAt: new Date().toISOString(),
    };

    return storageService.saveData(mergedData);
  }
}

export const backupService = new BackupService();
