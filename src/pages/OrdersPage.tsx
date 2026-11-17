import { PlusSquare, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OrderTable } from '../components/orders/OrderTable';
import { useApp } from '../context/AppContext';
import { AttentionLevel, OrderStatus, PaymentType } from '../types/order';
import {
  calculateAttentionAssessment,
  ORDER_STATUSES,
} from '../utils/verification';

const PAGE_SIZE = 10;

export function OrdersPage() {
  const {
    orders,
    seller,
    ordersFilterPreset,
    clearOrdersFilterPreset,
    openOrderDetails,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentType>('All');
  const [attentionFilter, setAttentionFilter] = useState<'All' | AttentionLevel>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!ordersFilterPreset) return;
    if (ordersFilterPreset.payment) setPaymentFilter(ordersFilterPreset.payment);
    if (ordersFilterPreset.attention) setAttentionFilter(ordersFilterPreset.attention);
    if (ordersFilterPreset.status) setStatusFilter(ordersFilterPreset.status);
    setCurrentPage(1);
    clearOrdersFilterPreset();
  }, [ordersFilterPreset, clearOrdersFilterPreset]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = orders.filter((order) => {
      if (q) {
        const matchesQuery =
          order.id.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.phone.toLowerCase().includes(q) ||
          order.city.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (paymentFilter !== 'All' && order.paymentType !== paymentFilter) {
        return false;
      }

      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      if (attentionFilter !== 'All') {
        const assessment = calculateAttentionAssessment(
          order,
          seller.highValueThreshold
        );
        if (assessment.level !== attentionFilter) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.orderDate.localeCompare(a.orderDate) || b.id.localeCompare(a.id);
      }
      return a.orderDate.localeCompare(b.orderDate) || a.id.localeCompare(b.id);
    });
  }, [
    orders,
    search,
    paymentFilter,
    attentionFilter,
    statusFilter,
    sortOrder,
    seller.highValueThreshold,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    paymentFilter !== 'All' ||
    attentionFilter !== 'All' ||
    statusFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setPaymentFilter('All');
    setAttentionFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
            All Orders
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Search, filter, and inspect every order before or after dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('add-order')}
          className="inline-flex items-center justify-center gap-1.5 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap"
        >
          <PlusSquare className="h-3.5 w-3.5" />
          <span>Add New Order</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search */}
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order ID or customer name..."
              aria-label="Search by Order ID or customer name"
              className="h-9 w-full rounded border border-neutral-300 bg-white pl-9 pr-3 text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
            />
          </div>

          {/* Payment Type */}
          <div className="lg:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as 'All' | PaymentType);
                setCurrentPage(1);
              }}
              aria-label="Filter by payment type"
              className="h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
            >
              <option value="All">Payment: All</option>
              <option value="COD">COD</option>
              <option value="Prepaid">Prepaid</option>
            </select>
          </div>

          {/* Attention Level */}
          <div className="lg:col-span-2">
            <select
              value={attentionFilter}
              onChange={(e) => {
                setAttentionFilter(e.target.value as 'All' | AttentionLevel);
                setCurrentPage(1);
              }}
              aria-label="Filter by attention level"
              className="h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
            >
              <option value="All">Attention: All</option>
              <option value="Low">Low (0–29)</option>
              <option value="Medium">Medium (30–59)</option>
              <option value="High">High (60–100)</option>
            </select>
          </div>

          {/* Order Status */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'All' | OrderStatus);
                setCurrentPage(1);
              }}
              aria-label="Filter by order status"
              className="h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
            >
              <option value="All">Status: All</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort by order date"
              className="h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
            >
              <option value="newest">Date: Newest First</option>
              <option value="oldest">Date: Oldest First</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          <span className="tabular-nums">
            Showing <strong className="text-neutral-950">{filteredOrders.length}</strong> of{' '}
            <strong className="text-neutral-950">{orders.length}</strong> orders
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-medium text-neutral-800 hover:text-neutral-950 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <OrderTable
        orders={paginatedOrders}
        highValueThreshold={seller.highValueThreshold}
        onSelectOrder={openOrderDetails}
        showScore
        emptyTitle="No matching orders"
        emptyDescription="No orders match the current search or filter settings."
        emptyActionLabel={hasActiveFilters ? 'Clear Filters' : 'Add New Order'}
        onEmptyAction={
          hasActiveFilters ? resetFilters : () => navigateTo('add-order')
        }
      />

      {/* Pagination */}
      {filteredOrders.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-600">
          <span className="tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
