/**
 * Status Badge Component
 * Displays status with visual indicators
 */

import { AlertCircle, CheckCircle, Clock, Loader, XCircle } from 'lucide-react';
import React from 'react';

export type StatusType = 'success' | 'pending' | 'warning' | 'error' | 'loading' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<StatusType, { bg: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: <Clock className="w-4 h-4" />,
  },
  warning: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <XCircle className="w-4 h-4" />,
  },
  loading: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Loader className="w-4 h-4 animate-spin" />,
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium rounded-full ${config.bg} ${config.text} ${sizeConfig[size]}`}
    >
      {showIcon && config.icon}
      {label}
    </span>
  );
};

// Event-specific status badge
export const EventStatusBadge: React.FC<{ isActive: boolean; isUpcoming: boolean; isPast: boolean }> = ({
  isActive,
  isUpcoming,
  isPast,
}) => {
  if (isActive) {
    return <StatusBadge status="success" label="Active" />;
  }
  if (isUpcoming) {
    return <StatusBadge status="pending" label="Upcoming" />;
  }
  if (isPast) {
    return <StatusBadge status="info" label="Past" />;
  }
  return <StatusBadge status="warning" label="Inactive" />;
};

// Attendance status badge
export const AttendanceStatusBadge: React.FC<{ attended: boolean }> = ({ attended }) => {
  return (
    <StatusBadge
      status={attended ? 'success' : 'pending'}
      label={attended ? 'Attended' : 'Pending'}
      size="sm"
    />
  );
};

export default StatusBadge;
