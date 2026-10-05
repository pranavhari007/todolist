import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface WeeklyActivityChartProps {
  data: { week: string; completed: number; created: number }[];
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              borderRadius: '0.75rem',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="created" name="Created Tasks" fill="#818cf8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="completed" name="Completed Tasks" fill="#10b981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
