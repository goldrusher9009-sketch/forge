import React from 'react';
import '../styles/Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  className = '',
  hover = true,
}) => {
  return (
    <div className={`card ${hover ? 'hoverable' : ''} ${className}`}>
      {title && <div className="card-header"><h3>{title}</h3></div>}
      <div className="card-body">
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};
