import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ReminderAlertModal } from '../common/ReminderAlertModal';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { InstallPrompt } from '../common/InstallPrompt';
import { Task } from '../../types';


interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialDateForTask, setInitialDateForTask] = useState<string | undefined>(undefined);

  const handleOpenCreateTask = (initialDate?: string) => {
    setEditingTask(null);
    setInitialDateForTask(initialDate);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setInitialDateForTask(undefined);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased">
      {/* Sidebar (Desktop) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <Header onOpenQuickAdd={() => handleOpenCreateTask()} />

        {/* Page Main Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* In-App Reminder Alert Dialog */}
      <ReminderAlertModal />

      {/* Shared Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setInitialDateForTask(undefined);
        }}
        taskToEdit={editingTask}
        initialDate={initialDateForTask}
      />

      {/* PWA Install Prompt — separate from notification permission */}
      <InstallPrompt />
    </div>
  );
};
