import { ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  onClick?: () => void;
  emphasis?: 'default' | 'dark';
}

export function MetricCard({
  label,
  value,
  helper,
  onClick,
  emphasis = 'default',
}: MetricCardProps) {
  const isDark = emphasis === 'dark';
  const baseClasses = `group relative flex flex-col justify-between rounded-md border p-4 text-left transition-colors duration-150 ${
    isDark
      ? 'border-neutral-900 bg-neutral-950 text-white'
      : 'border-neutral-200 bg-white text-neutral-950'
  } ${
    onClick
      ? isDark
        ? 'cursor-pointer hover:bg-neutral-900'
        : 'cursor-pointer hover:border-neutral-400 hover:bg-neutral-50/60'
      : ''
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs font-medium ${
            isDark ? 'text-neutral-300' : 'text-neutral-500'
          }`}
        >
          {label}
        </span>
        {onClick && (
          <ArrowUpRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
              isDark ? 'text-neutral-400' : 'text-neutral-400 group-hover:text-neutral-900'
            }`}
            strokeWidth={1.75}
          />
        )}
      </div>
      <div className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {helper && (
        <div
          className={`mt-1 text-xs ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}
        >
          {helper}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
