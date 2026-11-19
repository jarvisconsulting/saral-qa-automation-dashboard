import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div
        className={`${sizeMap[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {text && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{text}</span>}
    </div>
  );
};
