import { describe, it, expect, beforeEach } from 'vitest';
import { backupService } from '../services/backup/backupService';
import { storageService } from '../services/storage/localStorageService';
import { AppData } from '../types';

describe('Backup Export & Import Service', () => {
  beforeEach(() => {
    localStorage.clear();
    storageService.invalidateCache();
  });

  it('rejects malformed JSON strings during validation', () => {
    const { preview, parsedData } = backupService.validateBackupJSON('invalid json string');
    expect(preview.isValid).toBe(false);
    expect(parsedData).toBeNull();
  });

  it('validates correct JSON backup payloads', () => {
    const validPayload: AppData = {
      version: '1.0.0',
      tasks: [
        {
          id: 'task-1',
          title: 'Sample Task',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reminders: [],
          subtasks: [],
        },
      ],
      categories: [],
      settings: storageService.loadData().settings,
    };

    const { preview, parsedData } = backupService.validateBackupJSON(
      JSON.stringify(validPayload)
    );
    expect(preview.isValid).toBe(true);
    expect(preview.taskCount).toBe(1);
    expect(parsedData).not.toBeNull();
  });

  it('merges incoming backup without overwriting duplicate IDs', () => {
    const initial = storageService.loadData();
    initial.tasks = [
      {
        id: 'task-1',
        title: 'Original Task',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminders: [],
        subtasks: [],
      },
    ];
    storageService.saveData(initial);

    const incoming: AppData = {
      version: '1.0.0',
      tasks: [
        {
          id: 'task-1', // Duplicate ID
          title: 'Incoming Duplicate Task',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reminders: [],
          subtasks: [],
        },
      ],
      categories: [],
      settings: initial.settings,
    };

    backupService.importBackup(incoming, 'merge');
    const result = storageService.loadData();
    expect(result.tasks.length).toBe(2);
    expect(result.tasks.map((t) => t.title)).toContain('Original Task');
    expect(result.tasks.map((t) => t.title)).toContain('Incoming Duplicate Task');
  });
});
