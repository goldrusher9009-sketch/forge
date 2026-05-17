import React from 'react';
import { classNames } from '@/lib/utils';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table
      ref={ref}
      className={classNames(
        'w-full border-collapse text-sm',
        className
      )}
      {...props}
    />
  </div>
));

Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={classNames(
      'bg-gray-50 border-b border-gray-200',
      className
    )}
    {...props}
  />
));

TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={classNames(
      'divide-y divide-gray-200',
      className
    )}
    {...props}
  />
));

TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={classNames(
      'hover:bg-gray-50 transition-colors',
      className
    )}
    {...props}
  />
));

TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={classNames(
      'px-6 py-3 text-left font-semibold text-gray-900',
      className
    )}
    {...props}
  />
));

TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={classNames(
      'px-6 py-4 text-gray-700',
      className
    )}
    {...props}
  />
));

TableCell.displayName = 'TableCell';
