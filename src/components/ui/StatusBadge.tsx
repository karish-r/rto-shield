import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  PackageCheck,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import { OrderStatus } from '../../types/order';

interface StatusBadgeProps {
  status: OrderStatus;
}

const STATUS_STYLE_MAP: Record<
  OrderStatus,
  { classes: string; Icon: typeof Clock }
> = {
  'Verification Pending': {
    classes: 'border-neutral-300 bg-neutral-50 text-neutral-800',
    Icon: Clock,
  },
  'Awaiting Customer Response': {
    classes: 'border-neutral-300 bg-white text-neutral-700',
    Icon: HelpCircle,
  },
  'Address Correction Required': {
    classes: 'border-amber-300 bg-amber-50/70 text-amber-900',
    Icon: AlertTriangle,
  },
  'Ready to Dispatch': {
    classes: 'border-neutral-900 bg-neutral-900 text-white',
    Icon: PackageCheck,
  },
  Dispatched: {
    classes: 'border-neutral-300 bg-neutral-100 text-neutral-900',
    Icon: Truck,
  },
  Delivered: {
    classes: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
    Icon: CheckCircle2,
  },
  RTO: {
    classes: 'border-red-300 bg-red-50/70 text-red-900',
    Icon: RotateCcw,
  },
  Cancelled: {
    classes: 'border-neutral-200 bg-neutral-50 text-neutral-500',
    Icon: XCircle,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { classes, Icon } = STATUS_STYLE_MAP[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span>{status}</span>
    </span>
  );
}
