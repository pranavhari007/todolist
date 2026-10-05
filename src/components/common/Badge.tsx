import React from 'react';
import { Priority } from '../../types';
import { PRIORITY_CONFIG } from '../../utils/constants';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'priority' | 'category' | 'status' | 'neutral';
  priority?: Priority;
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  priority,
  color,
  className = '',
}) => {
  if (variant === 'priority' && priority) {
    const config = PRIORITY_CONFIG[priority];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bgColor} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.badgeColor}`} />
        {children || config.label}
      </span>
    );
  }

  if (variant === 'category' && color) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-15 dark:bg-opacity-25 ${className}`}
        style={{
          backgroundColor: `${color}20`,
          color: color,
          borderColor: `${color}40`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
    </span>
  );
};
