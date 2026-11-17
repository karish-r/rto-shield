import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AttentionIndicator } from '../components/ui/AttentionIndicator';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import {
  calculateAttentionAssessment,
  formatINR,
  getDetectedProblemsSummary,
  getRecommendedAction,
  hasAddressIssues,
  validateIndianPhone,
  validatePinCode,
} from '../utils/verification';

type QueueTab =
  | 'all-pending'
  | 'address-issues'
  | 'confirmation-pending'
  | 'high-attention'
  | 'ready-to-dispatch';

export function VerificationQueuePage() {
  const { orders, seller, openOrderDetails, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<QueueTab>('all-pending');

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const assessment = calculateAttentionAssessment(
        order,
        seller.highValueThreshold
      );
      const recommended = getRecommendedAction(order, assessment);
      const problems = getDetectedProblemsSummary(order);
      const addressProblem =
        hasAddressIssues(order) ||
        !validatePinCode(order.pinCode).isValid ||
        !validateIndianPhone(order.phone).isValid;

      return {
        order,
        assessment,
        recommended,
        problems,
        addressProblem,
      };
    });
  }, [orders, seller.highValueThreshold]);

  const tabCounts = useMemo(() => {
    const activeOrders = enrichedOrders.filter(
      ({ order }) => !['Delivered', 'RTO', 'Cancelled', 'Dispatched'].includes(order.status)
    );

    return {
      'all-pending': activeOrders.filter(({ order }) =>
        [
          'Verification Pending',
          'Awaiting Customer Response',
          'Address Correction Required',
        ].includes(order.status)
      ).length,
      'address-issues': activeOrders.filter(
        ({ order, addressProblem }) =>
          order.status !== 'Ready to Dispatch' && addressProblem
      ).length,
      'confirmation-pending': activeOrders.filter(
        ({ order }) =>
          !order.customerConfirmed &&
          ['Verification Pending', 'Awaiting Customer Response'].includes(order.status)
      ).length,
      'high-attention': activeOrders.filter(
        ({ assessment }) => assessment.level === 'High'
      ).length,
      'ready-to-dispatch': enrichedOrders.filter(
        ({ order }) => order.status === 'Ready to Dispatch'
      ).length,
    };
  }, [enrichedOrders]);

  const filteredItems = useMemo(() => {
    const activeOrders = enrichedOrders.filter(
      ({ order }) => !['Delivered', 'RTO', 'Cancelled', 'Dispatched'].includes(order.status)
    );

    let list = activeOrders;
    if (activeTab === 'all-pending') {
      list = activeOrders.filter(({ order }) =>
        [
          'Verification Pending',
          'Awaiting Customer Response',
          'Address Correction Required',
        ].includes(order.status)
      );
    } else if (activeTab === 'address-issues') {
      list = activeOrders.filter(
        ({ order, addressProblem }) =>
          order.status !== 'Ready to Dispatch' && addressProblem
      );
    } else if (activeTab === 'confirmation-pending') {
      list = activeOrders.filter(
        ({ order }) =>
          !order.customerConfirmed &&
          ['Verification Pending', 'Awaiting Customer Response'].includes(order.status)
      );
    } else if (activeTab === 'high-attention') {
      list = activeOrders.filter(
        ({ assessment }) => assessment.level === 'High'
      );
    } else if (activeTab === 'ready-to-dispatch') {
      list = enrichedOrders.filter(
        ({ order }) => order.status === 'Ready to Dispatch'
      );
    }

    return [...list].sort((a, b) => b.assessment.score - a.assessment.score);
  }, [activeTab, enrichedOrders]);

  const TABS: { id: QueueTab; label: string }[] = [
    { id: 'all-pending', label: 'All Pending' },
    { id: 'address-issues', label: 'Address Issues' },
    { id: 'confirmation-pending', label: 'Confirmation Pending' },
    { id: 'high-attention', label: 'High Attention' },
    { id: 'ready-to-dispatch', label: 'Ready to Dispatch' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
            Verification Queue
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Focused pre-dispatch queue highlighting detected address, contact, and confirmation gaps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('add-order')}
          className="rounded bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap self-start sm:self-auto"
        >
          Add New Order
        </button>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 p-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-700 hover:bg-white hover:text-neutral-950'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  isActive ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-6 py-14 text-center">
          <CheckCircle2 className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-neutral-950">
            No orders in this queue view
          </p>
          <p className="mt-1 max-w-sm text-xs text-neutral-500">
            Switch to another queue tab or add a new order to begin verification.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-500">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Problem Detected</th>
                <th className="px-4 py-3">Attention Score</th>
                <th className="px-4 py-3">Recommended Next Action</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredItems.map(({ order, assessment, recommended, problems }) => (
                <tr
                  key={order.id}
                  onClick={() => openOrderDetails(order.id)}
                  className="cursor-pointer transition-colors hover:bg-neutral-50"
                >
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-neutral-950 tabular-nums whitespace-nowrap">
                    <div>{order.id}</div>
                    <div className="mt-0.5 font-sans text-[11px] font-normal text-neutral-500">
                      {formatINR(order.orderValue)} · {order.paymentType}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-xs font-semibold text-neutral-950">
                      {order.customerName}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-neutral-500 tabular-nums">
                      {order.phone || 'Missing phone'} · {order.city}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-700 max-w-xs">
                    {problems.length > 0 ? (
                      <span>{problems.join(' · ')}</span>
                    ) : (
                      <span className="text-emerald-800">
                        All format &amp; address checks passed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <AttentionIndicator
                      level={assessment.level}
                      score={assessment.score}
                      showScore
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-neutral-900 whitespace-nowrap">
                    {recommended.action}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrderDetails(order.id);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-neutral-900 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
