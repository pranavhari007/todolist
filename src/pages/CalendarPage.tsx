import React from 'react';
import { CalendarView } from '../components/calendar/CalendarView';

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Visualize your upcoming schedule and click any date to add tasks.
        </p>
      </div>

      <CalendarView />
    </div>
  );
};
