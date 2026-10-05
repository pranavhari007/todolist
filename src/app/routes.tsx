import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { CalendarPage } from '../pages/CalendarPage';
import { RemindersPage } from '../pages/RemindersPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { CompletedPage } from '../pages/CompletedPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/reminders" element={<RemindersPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/completed" element={<CompletedPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<DashboardPage />} />
    </Routes>
  );
};
