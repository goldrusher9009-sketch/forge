import React from 'react';
import '../styles/Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className = '',
  ...props
}) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
      {helper && <span className="input-helper">{helper}</span>}
    </div>
  );
};
