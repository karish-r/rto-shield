import { ArrowRight } from 'lucide-react';
import { Order } from '../../types/order';
import {
  calculateAttentionAssessment,
  formatINR,
} from '../../utils/verification';
import { AttentionIndicator } from '../ui/AttentionIndicator';
import { StatusBadge } from '../ui/StatusBadge';

interface OrderTableProps {
  orders: Order[];
  highValueThreshold: number;
  onSelectOrder: (orderId: string) => void;
  compact?: boolean;
  showScore?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function OrderTable({
  orders,
  highValueThreshold,
  onSelectOrder,
  compact = false,
  showScore = false,
  emptyTitle = 'No orders found',
  emptyDescription = 'Try adjusting your search or filter criteria.',
  emptyActionLabel,
  onEmptyAction,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-neutral-900">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          {emptyDescription}
        </p>
        {emptyActionLabel && onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="mt-4 rounded border border-neutral-900 bg-neutral-950 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-500">
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Customer</th>
            {!compact && <th className="px-4 py-3">Phone</th>}
            <th className="px-4 py-3 text-right">Order Value</th>
            <th className="px-4 py-3">Payment Type</th>
            <th className="px-4 py-3">
              {showScore ? 'Attention Score' : 'Attention Level'}
            </th>
            <th className="px-4 py-3">Order Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {orders.map((order) => {
            const assessment = calculateAttentionAssessment(
              order,
              highValueThreshold
            );

            return (
              <tr
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="cursor-pointer transition-colors hover:bg-neutral-50"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-950 tabular-nums whitespace-nowrap">
                  <div>{order.id}</div>
                  {!compact && (
                    <div className="mt-0.5 font-sans text-[11px] font-normal text-neutral-500 tabular-nums">
                      {order.orderDate}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-950">
                    {order.customerName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {order.city}, {order.state}
                  </div>
                </td>
                {!compact && (
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700 tabular-nums whitespace-nowrap">
                    {order.phone || 'Missing'}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono text-xs font-medium text-neutral-950 tabular-nums whitespace-nowrap">
                  {formatINR(order.orderValue)}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-700 whitespace-nowrap">
                  <span className="font-medium text-neutral-900">
                    {order.paymentType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AttentionIndicator
                    level={assessment.level}
                    score={assessment.score}
                    showScore={showScore}
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrder(order.id);
                    }}
                    className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-950 hover:text-white whitespace-nowrap"
                  >
                    <span>Review</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
