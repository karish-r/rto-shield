import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ReportAttentionDistributionChart,
  ReportCodVsPrepaidChart,
  ReportDeliveredVsRtoChart,
  ReportMonthlyTrendsChart,
} from '../components/charts/ReportCharts';
import { MetricCard } from '../components/ui/MetricCard';
import { useApp } from '../context/AppContext';
import {
  calculateAttentionAssessment,
  formatINR,
} from '../utils/verification';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const REFERENCE_TODAY = new Date('2026-11-17T00:00:00');

function shiftDays(base: Date, daysAgo: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const { orders, seller } = useApp();

  const [preset, setPreset] = useState<DatePreset>('90d');
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState('2026-11-17');

  const dateBounds = useMemo(() => {
    if (preset === '7d') {
      return { start: shiftDays(REFERENCE_TODAY, 7), end: '2026-11-17' };
    }
    if (preset === '30d') {
      return { start: shiftDays(REFERENCE_TODAY, 30), end: '2026-11-17' };
    }
    if (preset === '90d') {
      return { start: shiftDays(REFERENCE_TODAY, 90), end: '2026-11-17' };
    }
    return {
      start: customStart || '2026-01-01',
      end: customEnd || '2026-12-31',
    };
  }, [preset, customStart, customEnd]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) => o.orderDate >= dateBounds.start && o.orderDate <= dateBounds.end
    );
  }, [orders, dateBounds]);

  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const dispatchedOrders = filteredOrders.filter((o) =>
      ['Dispatched', 'Delivered', 'RTO'].includes(o.status)
    );
    const deliveredOrders = filteredOrders.filter(
      (o) => o.status === 'Delivered'
    );
    const rtoOrders = filteredOrders.filter((o) => o.status === 'RTO');
    const cancelledOrders = filteredOrders.filter(
      (o) => o.status === 'Cancelled'
    );
    const inTransit = filteredOrders.filter((o) => o.status === 'Dispatched');

    const totalDispatched = dispatchedOrders.length;
    const rtoRate =
      totalDispatched > 0
        ? ((rtoOrders.length / totalDispatched) * 100).toFixed(1)
        : '0.0';

    const recordedShippingLoss = rtoOrders.reduce(
      (sum, o) => sum + (o.recordedShippingLoss ?? seller.defaultRtoShippingLoss),
      0
    );

    // Directional estimate of prevented shipping cost on cancelled/held high-attention orders
    const highAttentionAvoided = filteredOrders.filter((o) => {
      const a = calculateAttentionAssessment(o, seller.highValueThreshold);
      return o.status === 'Cancelled' && a.level !== 'Low';
    }).length;
    const estimatedSavedShipping =
      highAttentionAvoided * seller.defaultRtoShippingLoss;

    const codOrders = filteredOrders.filter((o) => o.paymentType === 'COD');
    const prepaidOrders = filteredOrders.filter(
      (o) => o.paymentType === 'Prepaid'
    );

    const attentionCounts = { Low: 0, Medium: 0, High: 0 };
    filteredOrders.forEach((o) => {
      const a = calculateAttentionAssessment(o, seller.highValueThreshold);
      attentionCounts[a.level] += 1;
    });

    // Monthly trend grouping
    const monthBuckets = new Map<
      string,
      { month: string; total: number; delivered: number; rto: number }
    >();

    [...filteredOrders]
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate))
      .forEach((o) => {
        const ym = o.orderDate.slice(0, 7);
        const label = new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });
        const existing = monthBuckets.get(ym) || {
          month: label,
          total: 0,
          delivered: 0,
          rto: 0,
        };
        existing.total += 1;
        if (o.status === 'Delivered') existing.delivered += 1;
        if (o.status === 'RTO') existing.rto += 1;
        monthBuckets.set(ym, existing);
      });

    return {
      totalOrders,
      totalDispatched,
      deliveredCount: deliveredOrders.length,
      rtoCount: rtoOrders.length,
      rtoRate,
      recordedShippingLoss,
      estimatedSavedShipping,
      highAttentionAvoided,
      deliveredVsRtoData: [
        { name: 'Delivered', count: deliveredOrders.length },
        { name: 'RTO', count: rtoOrders.length },
        { name: 'In Transit', count: inTransit.length },
        { name: 'Cancelled', count: cancelledOrders.length },
      ],
      codVsPrepaidData: [
        {
          name: 'COD',
          count: codOrders.length,
          value: codOrders.reduce((s, o) => s + o.orderValue, 0),
        },
        {
          name: 'Prepaid',
          count: prepaidOrders.length,
          value: prepaidOrders.reduce((s, o) => s + o.orderValue, 0),
        },
      ],
      monthlyTrendsData: Array.from(monthBuckets.values()),
      attentionDistributionData: [
        { level: 'Low', count: attentionCounts.Low },
        { level: 'Medium', count: attentionCounts.Medium },
        { level: 'High', count: attentionCounts.High },
      ],
    };
  }, [filteredOrders, seller.defaultRtoShippingLoss, seller.highValueThreshold]);

  return (
    <div className="space-y-6">
      {/* Header + Date Filters */}
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
            Reports &amp; Analytics
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Track delivery outcomes, RTO rates, and recorded shipping costs across time ranges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 p-1">
            {(
              [
                { id: '7d', label: 'Last 7 days' },
                { id: '30d', label: 'Last 30 days' },
                { id: '90d', label: 'Last 90 days' },
                { id: 'custom', label: 'Custom range' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  preset === item.id
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                aria-label="Start date"
                className="h-8 rounded border border-neutral-300 px-2 text-xs tabular-nums focus:border-neutral-950 focus:outline-none"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                aria-label="End date"
                className="h-8 rounded border border-neutral-300 px-2 text-xs tabular-nums focus:border-neutral-950 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Orders"
          value={metrics.totalOrders}
          helper={`${dateBounds.start} to ${dateBounds.end}`}
        />
        <MetricCard
          label="Total Dispatched"
          value={metrics.totalDispatched}
          helper="Dispatched + Delivered + RTO"
        />
        <MetricCard
          label="Delivered Orders"
          value={metrics.deliveredCount}
          helper="Successfully fulfilled"
        />
        <MetricCard
          label="RTO Orders"
          value={metrics.rtoCount}
          helper="Returned shipments"
        />
        <MetricCard
          label="RTO Rate"
          value={`${metrics.rtoRate}%`}
          helper="RTO / Total Dispatched"
          emphasis="dark"
        />
        <MetricCard
          label="Total Recorded Shipping Loss"
          value={formatINR(metrics.recordedShippingLoss)}
          helper="Actual logged RTO freight"
        />
      </div>

      {/* Clear Distinction: Recorded Actual Cost vs Estimated Savings */}
      <div className="grid grid-cols-1 gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
        <div className="border-b border-neutral-200 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
          <div className="text-xs font-semibold text-neutral-950">
            Recorded Actual Cost · {formatINR(metrics.recordedShippingLoss)}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            Sum of actual two-way courier charges logged on the {metrics.rtoCount} RTO order
            {metrics.rtoCount === 1 ? '' : 's'} in this date window.
          </p>
        </div>
        <div className="sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-950">
            <span>
              Estimated Avoided Freight (Directional) ·{' '}
              {formatINR(metrics.estimatedSavedShipping)}
            </span>
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-neutral-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <span>
              Estimated figure only, based on {metrics.highAttentionAvoided} cancelled pre-dispatch flagged order(s) multiplied by your default ₹{seller.defaultRtoShippingLoss} return shipping rate—not guaranteed savings.
            </span>
          </p>
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Delivered vs RTO
          </h3>
          <p className="mt-0.5 mb-4 text-xs text-neutral-500">
            Shipment outcomes within the selected timeframe
          </p>
          <ReportDeliveredVsRtoChart data={metrics.deliveredVsRtoData} />
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            COD vs Prepaid
          </h3>
          <p className="mt-0.5 mb-4 text-xs text-neutral-500">
            Order volume split by payment method
          </p>
          <ReportCodVsPrepaidChart data={metrics.codVsPrepaidData} />
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Monthly Order Trends
          </h3>
          <p className="mt-0.5 mb-4 text-xs text-neutral-500">
            Total, Delivered, and RTO order volume by month
          </p>
          <ReportMonthlyTrendsChart data={metrics.monthlyTrendsData} />
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Attention-Level Distribution
          </h3>
          <p className="mt-0.5 mb-4 text-xs text-neutral-500">
            Low (0–29), Medium (30–59), and High (60–100) order counts
          </p>
          <ReportAttentionDistributionChart
            data={metrics.attentionDistributionData}
          />
        </section>
      </div>
    </div>
  );
}
