import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AttentionLevel } from '../../types/order';

interface AttentionIndicatorProps {
  level: AttentionLevel;
  score?: number;
  showScore?: boolean;
}

const LEVEL_STYLES: Record<
  AttentionLevel,
  { textClass: string; borderClass: string; Icon: typeof ShieldCheck }
> = {
  Low: {
    textClass: 'text-neutral-700',
    borderClass: 'border-neutral-200 bg-neutral-50',
    Icon: ShieldCheck,
  },
  Medium: {
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300 bg-amber-50/60',
    Icon: AlertCircle,
  },
  High: {
    textClass: 'text-red-900',
    borderClass: 'border-red-300 bg-red-50/70',
    Icon: AlertTriangle,
  },
};

export function AttentionIndicator({
  level,
  score,
  showScore = false,
}: AttentionIndicatorProps) {
  const { textClass, borderClass, Icon } = LEVEL_STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${borderClass} ${textClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span>{level}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[11px] tabular-nums opacity-80">
          · {score}/100
        </span>
      )}
    </span>
  );
}
