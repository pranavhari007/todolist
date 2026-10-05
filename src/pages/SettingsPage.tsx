import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { backupService, BackupPreviewInfo } from '../services/backup/backupService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Calendar as CalendarIcon,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, clearAllData, reloadFromStorage } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [importPreview, setImportPreview] = useState<BackupPreviewInfo | null>(null);
  const [parsedImportData, setParsedImportData] = useState<any>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleExportBackup = () => {
    backupService.exportBackup();
    setFeedbackMessage('Backup file downloaded successfully!');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { preview, parsedData } = backupService.validateBackupJSON(content);
      setImportPreview(preview);
      setParsedImportData(parsedData);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleApplyImport = () => {
    if (!parsedImportData) return;
    const success = backupService.importBackup(parsedImportData, importMode);
    setIsImportModalOpen(false);

    if (success) {
      reloadFromStorage();
      setFeedbackMessage(
        `Successfully ${importMode === 'replace' ? 'restored' : 'merged'} backup data!`
      );
    } else {
      setFeedbackMessage('Failed to apply backup.');
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Settings & Preferences
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personalize themes, calendar, data backups, and offline PWA settings.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-sm rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
          {feedbackMessage}
        </div>
      )}

      {/* Appearance & Theme Section */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Appearance & Density</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { mode: 'light', label: 'Light Theme', icon: Sun, color: 'text-amber-500' },
            { mode: 'dark', label: 'Dark Theme', icon: Moon, color: 'text-indigo-400' },
            { mode: 'system', label: 'System Theme', icon: Laptop, color: 'text-gray-500' },
          ].map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = settings.theme === themeOption.mode;
            return (
              <button
                key={themeOption.mode}
                onClick={() => updateSettings({ theme: themeOption.mode as any })}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${themeOption.color}`} />
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {themeOption.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Settings */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" /> Calendar Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Start Week On
            </label>
            <select
              value={settings.weekStartDay}
              onChange={(e) => updateSettings({ weekStartDay: Number(e.target.value) as any })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold"
            >
              <option value={1}>Monday (ISO Standard)</option>
              <option value={0}>Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Default Calendar View
            </label>
            <select
              value={settings.defaultCalendarView}
              onChange={(e) => updateSettings({ defaultCalendarView: e.target.value as any })}
              className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold"
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management & Backup Section */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          Data Management & Offline Backups
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          All data is exclusively stored in your browser Local Storage. Generate JSON backups to preserve
          or transfer your tasks across browsers.
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Export */}
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Export JSON Backup
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold text-xs rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" /> Import Backup JSON
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Clear Data */}
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-semibold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" /> Clear All Local Data
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Reference */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" /> Keyboard Shortcuts Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl flex items-center justify-between">
            <span>Close Modal / Dialogs</span>
            <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded font-mono font-bold">
              Esc
            </kbd>
          </div>
          <div className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl flex items-center justify-between">
            <span>Submit Forms / Create Subtask</span>
            <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded font-mono font-bold">
              Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* PWA Info */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-2">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-500" /> Progressive Web App (PWA) Status
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          ToDoList is fully PWA installable. On desktop, click the Install icon in your browser address
          bar. On iOS/Android, select "Add to Home Screen" from your browser share menu to use it like a
          native offline app.
        </p>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Preview Backup File"
        maxWidth="md"
      >
        {importPreview ? (
          <div className="space-y-4 text-xs">
            {!importPreview.isValid ? (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
                Invalid backup file: {importPreview.errors.join(', ')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl font-medium">
                  <div>Tasks in backup: <span className="font-bold">{importPreview.taskCount}</span></div>
                  <div>Categories: <span className="font-bold">{importPreview.categoryCount}</span></div>
                  <div>Schema Version: <span className="font-bold">{importPreview.version}</span></div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Import Strategy
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Merge with existing local tasks (prevents overwriting)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        Replace all existing local data
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyImport}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold"
                  >
                    Apply Import
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Application Data"
        message="This operation is completely destructive and will erase all tasks, categories, and settings stored in this browser. We recommend exporting a JSON backup first."
        confirmText="Erase All Data"
        confirmVariant="danger"
      />
    </div>
  );
};
