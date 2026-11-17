import { ArrowRight, PlusSquare } from 'lucide-react';
import { useMemo } from 'react';
import {
  CodVsPrepaidChart,
  OrderPerformanceChart,
} from '../components/charts/DashboardCharts';
import { OrderTable } from '../components/orders/OrderTable';
import { AttentionIndicator } from '../components/ui/AttentionIndicator';
import { MetricCard } from '../components/ui/MetricCard';
import { useApp } from '../context/AppContext';
import {
  calculateAttentionAssessment,
  formatINR,
  getDetectedProblemsSummary,
} from '../utils/verification';

export function DashboardPage() {
  const { orders, seller, navigateTo, openOrderDetails } = useApp();

  const stats = useMemo(() => {
    const assessed = orders.map((order) => ({
      order,
      assessment: calculateAttentionAssessment(order, seller.highValueThreshold),
      problems: getDetectedProblemsSummary(order),
    }));

    const pendingVerification = orders.filter((o) =>
      [
        'Verification Pending',
        'Awaiting Customer Response',
        'Address Correction Required',
      ].includes(o.status)
    ).length;

    const needsAttention = assessed.filter(
      ({ order, assessment }) =>
        !['Delivered', 'RTO', 'Cancelled', 'Dispatched'].includes(order.status) &&
        (assessment.level === 'Medium' || assessment.level === 'High')
    ).length;

    const readyToDispatch = orders.filter(
      (o) => o.status === 'Ready to Dispatch'
    ).length;
    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const rto = orders.filter((o) => o.status === 'RTO').length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;

    const attentionCounts = {
      Low: assessed.filter((a) => a.assessment.level === 'Low').length,
      Medium: assessed.filter((a) => a.assessment.level === 'Medium').length,
      High: assessed.filter((a) => a.assessment.level === 'High').length,
    };

    const codOrders = orders.filter((o) => o.paymentType === 'COD');
    const prepaidOrders = orders.filter((o) => o.paymentType === 'Prepaid');

    const priorityItems = assessed
      .filter(
        ({ order, problems }) =>
          [
            'Verification Pending',
            'Awaiting Customer Response',
            'Address Correction Required',
          ].includes(order.status) && problems.length > 0
      )
      .sort((a, b) => b.assessment.score - a.assessment.score)
      .slice(0, 5);

    const recentOrders = [...orders]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .slice(0, 6);

    return {
      total: orders.length,
      pendingVerification,
      needsAttention,
      readyToDispatch,
      delivered,
      rto,
      cancelled,
      attentionCounts,
      codSplit: [
        {
          name: 'COD',
          value: codOrders.length,
          amount: codOrders.reduce((s, o) => s + o.orderValue, 0),
        },
        {
          name: 'Prepaid',
          value: prepaidOrders.length,
          amount: prepaidOrders.reduce((s, o) => s + o.orderValue, 0),
        },
      ],
      performanceData: [
        { name: 'Delivered', count: delivered },
        { name: 'RTO', count: rto },
        { name: 'Cancelled', count: cancelled },
      ],
      priorityItems,
      recentOrders,
    };
  }, [orders, seller.highValueThreshold]);

  return (
    <div className="space-y-8">
      {/* Top welcome & primary action */}
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
            Store Verification Overview
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {seller.businessName} · Review flagged orders before courier pickup.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigateTo('verification-queue')}
            className="rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900 whitespace-nowrap"
          >
            Open Verification Queue
          </button>
          <button
            type="button"
            onClick={() => navigateTo('add-order')}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap"
          >
            <PlusSquare className="h-3.5 w-3.5" />
            <span>Add New Order</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <section aria-label="Order summary metrics">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Total Orders"
            value={stats.total}
            helper="All recorded orders"
            onClick={() => navigateTo('orders', { status: 'All', attention: 'All', payment: 'All' })}
          />
          <MetricCard
            label="Pending Verification"
            value={stats.pendingVerification}
            helper="Awaiting review or reply"
            onClick={() => navigateTo('verification-queue')}
          />
          <MetricCard
            label="Needs Attention"
            value={stats.needsAttention}
            helper="Medium or High level"
            onClick={() => navigateTo('orders', { attention: 'High' })}
          />
          <MetricCard
            label="Ready to Dispatch"
            value={stats.readyToDispatch}
            helper="Verified for shipping"
            emphasis="dark"
            onClick={() => navigateTo('orders', { status: 'Ready to Dispatch' })}
          />
          <MetricCard
            label="Delivered"
            value={stats.delivered}
            helper="Completed deliveries"
            onClick={() => navigateTo('orders', { status: 'Delivered' })}
          />
          <MetricCard
            label="RTO Orders"
            value={stats.rto}
            helper="Returned to origin"
            onClick={() => navigateTo('orders', { status: 'RTO' })}
          />
        </div>
      </section>

      {/* A. Order Attention Overview + E. Priority Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* A. Order Attention Overview */}
        <section className="flex flex-col justify-between rounded-md border border-neutral-200 bg-white p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-neutral-950">
                Order Attention Overview
              </h3>
              <button
                type="button"
                onClick={() => navigateTo('orders')}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-950 hover:underline"
              >
                View all
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Distribution of all orders across rule-based attention tiers.
            </p>

            <div className="mt-6 space-y-5">
              {(['Low', 'Medium', 'High'] as const).map((tier) => {
                const count = stats.attentionCounts[tier];
                const pct =
                  stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const barFill =
                  tier === 'High'
                    ? 'bg-neutral-950'
                    : tier === 'Medium'
                      ? 'bg-neutral-500'
                      : 'bg-neutral-300';
                const rangeLabel =
                  tier === 'Low' ? '0–29 pts' : tier === 'Medium' ? '30–59 pts' : '60–100 pts';

                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => navigateTo('orders', { attention: tier })}
                    className="group block w-full text-left"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-900 group-hover:underline">
                        {tier} Attention{' '}
                        <span className="font-normal text-neutral-500">
                          ({rangeLabel})
                        </span>
                      </span>
                      <span className="font-mono font-medium text-neutral-950 tabular-nums">
                        {count} orders · {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-neutral-100">
                      <div
                        className={`h-full transition-all duration-300 ${barFill}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-6 border-t border-neutral-100 pt-3.5 text-[11px] leading-relaxed text-neutral-500">
            Attention scores are rule-based verification heuristics (missing address, phone/PIN format, pending confirmation), not courier delivery predictions.
          </p>
        </section>

        {/* E. Priority Actions */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-neutral-950">
                Priority Actions
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Orders with missing address details, invalid phone/PIN format, or pending confirmation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('verification-queue')}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline whitespace-nowrap"
            >
              <span>Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {stats.priorityItems.length === 0 ? (
            <div className="mt-6 rounded border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-xs text-neutral-600">
              All pending orders look verified. No immediate actions required.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-neutral-200">
              {stats.priorityItems.map(({ order, assessment, problems }) => (
                <div
                  key={order.id}
                  className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-950">
                        {order.id}
                      </span>
                      <span className="text-xs font-medium text-neutral-900">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        · {formatINR(order.orderValue)} · {order.paymentType}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-600">
                      {problems.join(' · ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <AttentionIndicator
                      level={assessment.level}
                      score={assessment.score}
                      showScore
                    />
                    <button
                      type="button"
                      onClick={() => openOrderDetails(order.id)}
                      className="rounded border border-neutral-900 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 whitespace-nowrap"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* B. Order Performance & C. COD vs Prepaid Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-neutral-950">
                Order Performance
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Comparison of Delivered, RTO, and Cancelled orders
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-950 hover:underline"
            >
              Full reports
            </button>
          </div>
          <OrderPerformanceChart data={stats.performanceData} />
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              COD vs Prepaid Distribution
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Payment mode split across all store orders
            </p>
          </div>
          <CodVsPrepaidChart data={stats.codSplit} />
        </section>
      </div>

      {/* D. Recent Orders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Recent Orders
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Latest orders logged into RTO Shield. Click any row to verify details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('orders')}
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline"
          >
            <span>All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <OrderTable
          orders={stats.recentOrders}
          highValueThreshold={seller.highValueThreshold}
          onSelectOrder={openOrderDetails}
          compact
        />
      </section>
    </div>
  );
}
