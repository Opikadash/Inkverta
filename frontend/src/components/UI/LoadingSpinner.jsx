import React from 'react';
import clsx from 'clsx';

const sizeToClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
};

const LoadingSpinner = ({ size = 'md', className }) => {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-blue-600 border-t-transparent',
        sizeToClass[size] || sizeToClass.md,
        className,
      )}
    />
  );
};

export default LoadingSpinner;

