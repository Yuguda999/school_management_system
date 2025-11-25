import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-primary-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]}`}
      />
    </div>
  );
};

export default LoadingSpinner;
