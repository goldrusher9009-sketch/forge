import React from 'react';
import { classNames } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-cyan-100 text-cyan-800',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-sm font-medium',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      className={classNames(
        'inline-flex items-center rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
}

const statusVariants = {
  queued: 'info',
  running: 'primary',
  completed: 'success',
  failed: 'danger',
  cancelled: 'warning',
} as const;

const statusLabels = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={statusVariants[status] as any}
      {...props}
    >
      {statusLabels[status]}
    </Badge>
  )
);

StatusBadge.displayName = 'StatusBadge';
