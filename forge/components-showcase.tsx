/**
 * Forge AI - Component Showcase & Design System
 * This file demonstrates all available components and their variations
 */

import React from 'react';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const COLORS = {
  primary: {
    50: '#F0F9FF',
    500: '#8B5CF6',
    900: '#0F172A',
  },
  accent: {
    50: '#F5F3FF',
    500: '#8B5CF6',
    900: '#5B21B6',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    600: '#4B5563',
    900: '#111827',
  },
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

export const TYPOGRAPHY = {
  heading: {
    h1: { size: '48px', weight: 700, lineHeight: '56px' },
    h2: { size: '32px', weight: 700, lineHeight: '40px' },
    h3: { size: '24px', weight: 700, lineHeight: '32px' },
    h4: { size: '20px', weight: 600, lineHeight: '28px' },
  },
  body: {
    lg: { size: '18px', weight: 400, lineHeight: '28px' },
    base: { size: '16px', weight: 400, lineHeight: '24px' },
    sm: { size: '14px', weight: 400, lineHeight: '20px' },
    xs: { size: '12px', weight: 400, lineHeight: '16px' },
  },
  code: {
    size: '14px',
    family: 'JetBrains Mono',
    weight: 400,
  },
} as const;

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  onClick,
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300',
    ghost: 'text-blue-600 hover:bg-blue-50 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
};

// ============================================================================
// CARD COMPONENTS
// ============================================================================

interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  hoverable?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  hoverable = false,
  interactive = false,
}) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 ${
        hoverable ? 'hover:shadow-lg hover:border-blue-300 transition-all duration-200' : ''
      } ${interactive ? 'cursor-pointer' : ''}`}
    >
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
};

// ============================================================================
// FORM COMPONENTS
// ============================================================================

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
  required = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-600 focus:ring-red-500' : 'border-gray-300'
        }`}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
};

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  onChange,
  rows = 4,
  label,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-900">{label}</label>}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

interface SelectProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-900">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  closeable?: boolean;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  closeable = true,
  onClose,
}) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {closeable && (
          <button
            onClick={onClose}
            className="ml-4 text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
    />
  );
};

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
  };

  return (
    <div
      className={`${bgColor[type]} text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-up`}
    >
      {message}
    </div>
  );
};

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================

interface TableProps {
  columns: { key: string; header: string }[];
  data: Record<string, any>[];
  sortable?: boolean;
  onSort?: (column: string) => void;
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  sortable = false,
  onSort,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                onClick={() => sortable && onSort?.(col.key)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// ============================================================================
// COMPONENT SHOWCASE PAGE
// ============================================================================

export const ComponentShowcase: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white">
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Forge Design System</h1>

      {/* Buttons Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button size="lg">Large Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button isLoading>Loading Button</Button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Hover Card" description="This card has hover effects" hoverable>
            <p className="text-gray-700">Interactive card content goes here.</p>
          </Card>
          <Card title="Regular Card">
            <p className="text-gray-700">Standard card without special effects.</p>
          </Card>
        </div>
      </section>

      {/* Forms Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Form Components</h2>
        <div className="space-y-4 max-w-md">
          <Input label="Email Address" type="email" placeholder="your@email.com" required />
          <Input label="Password" type="password" placeholder="••••••••" error="Password is too weak" />
          <Textarea label="Message" placeholder="Type your message here..." />
          <Select
            label="Select an option"
            options={[
              { value: '1', label: 'Option 1' },
              { value: '2', label: 'Option 2' },
              { value: '3', label: 'Option 3' },
            ]}
          />
        </div>
      </section>

      {/* Alerts Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Alerts & Feedback</h2>
        <div className="space-y-4">
          <Alert type="success" title="Success!" message="Your action completed successfully." />
          <Alert type="error" title="Error" message="Something went wrong. Please try again." />
          <Alert type="warning" title="Warning" message="Please review this information carefully." />
          <Alert type="info" message="This is informational content." />
        </div>
      </section>

      {/* Badges Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      {/* Table Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Tables</h2>
        <Table
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'status', header: 'Status' },
            { key: 'date', header: 'Date' },
          ]}
          data={[
            { name: 'Project Alpha', status: 'Active', date: '2026-05-04' },
            { name: 'Project Beta', status: 'Pending', date: '2026-04-28' },
            { name: 'Project Gamma', status: 'Completed', date: '2026-04-15' },
          ]}
        />
      </section>
    </div>
  );
};

export default ComponentShowcase;
