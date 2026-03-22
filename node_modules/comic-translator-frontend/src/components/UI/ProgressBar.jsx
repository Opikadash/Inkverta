import React from 'react';
import clsx from 'clsx';

const ProgressBar = ({ steps, currentStep, className }) => {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStep),
  );

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex || step.completed;
          return (
            <div key={step.id} className="flex-1">
              <div
                className={clsx(
                  'h-2 w-full rounded-full transition-colors',
                  isDone ? 'bg-blue-600' : isActive ? 'bg-blue-300' : 'bg-gray-200',
                )}
              />
              <div className="mt-2 text-xs text-gray-600 text-center">{step.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;

