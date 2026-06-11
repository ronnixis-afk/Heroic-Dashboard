import React from 'react';
import { cn } from '../../lib/utils';

interface FilterTabsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function FilterTabs({ options, value, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('filter-group', className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn('filter-pill', value === option && 'filter-pill-active')}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
