import React from 'react';
import { classNames } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div
    className={classNames(
      'inline-block animate-spin rounded-full border-4 border-gray-300 border-t-blue-600',
      sizeClasses[size],
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

Spinner.displayName = 'Spinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, children }) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
        <Spinner size="md" />
      </div>
    )}
  </div>
);

LoadingOverlay.displayName = 'LoadingOverlay';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  count = 1,
  className,
  ...props
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'w-10 h-10 rounded-full',
    rectangular: 'h-20 rounded',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={classNames(baseClasses, variantClasses[variant], className)}
          {...props}
        />
      ))}
    </>
  );
};

Skeleton.displayName = 'Skeleton';
