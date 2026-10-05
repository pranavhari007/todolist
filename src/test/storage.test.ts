import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/storage/localStorageService';
import { LOCAL_STORAGE_KEY } from '../utils/constants';

describe('LocalStorage Service & Data Migration', () => {
  beforeEach(() => {
    localStorage.clear();
    storageService.invalidateCache();
  });

  it('loads initial default data when local storage is empty', () => {
    const data = storageService.loadData();
    expect(data.version).toBe('1.0.0');
    expect(data.tasks).toEqual([]);
    expect(data.categories.length).toBeGreaterThan(0);
  });

  it('gracefully handles corrupted JSON in localStorage without crashing', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, '{ malformed json string ...');
    const data = storageService.loadData();
    expect(data.version).toBe('1.0.0');
    expect(data.tasks).toEqual([]);
  });

  it('atomically saves and persists task changes across reloads', () => {
    const data = storageService.loadData();
    data.tasks.push({
      id: 'task-test-1',
      title: 'Test Persisted Task',
      priority: 'high',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reminders: [],
      subtasks: [],
    });

    storageService.saveData(data);
    storageService.invalidateCache();

    const reloaded = storageService.loadData();
    expect(reloaded.tasks.length).toBe(1);
    expect(reloaded.tasks[0].title).toBe('Test Persisted Task');
  });
});
