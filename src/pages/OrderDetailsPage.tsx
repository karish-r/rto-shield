import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Info,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  Save,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { AttentionIndicator } from '../components/ui/AttentionIndicator';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types/order';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateAttentionAssessment,
  evaluateAddressCompleteness,
  formatFullAddress,
  formatINR,
  getRecommendedAction,
  INDIAN_STATES,
  validateIndianPhone,
} from '../utils/verification';

export function OrderDetailsPage() {
  const {
    orders,
    selectedOrderId,
    seller,
    navigateTo,
    updateOrder,
    updateOrderStatus,
    addOrderLog,
    showToast,
  } = useApp();

  const order = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0],
    [orders, selectedOrderId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editHouseFlat, setEditHouseFlat] = useState('');
  const [editStreetArea, setEditStreetArea] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPinCode, setEditPinCode] = useState('');

  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  // Confirm dialogs for RTO / Cancel
  const [rtoDialogOpen, setRtoDialogOpen] = useState(false);
  const [rtoLossInput, setRtoLossInput] = useState(
    String(seller.defaultRtoShippingLoss)
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (!order) return;
    setIsEditing(false);
    setEditPhone(order.phone);
    setEditHouseFlat(order.houseFlat);
    setEditStreetArea(order.streetArea);
    setEditLocality(order.locality);
    setEditLandmark(order.landmark || '');
    setEditCity(order.city);
    setEditState(order.state);
    setEditPinCode(order.pinCode);
    setMessageText(buildWhatsAppMessage(seller.defaultWhatsAppTemplate, order));
    setRtoLossInput(
      String(order.recordedShippingLoss ?? seller.defaultRtoShippingLoss)
    );
    setCopied(false);
  }, [order?.id, seller.defaultWhatsAppTemplate, seller.defaultRtoShippingLoss]);

  if (!order) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-neutral-950">No order selected</p>
        <button
          type="button"
          onClick={() => navigateTo('orders')}
          className="mt-4 rounded bg-neutral-950 px-4 py-2 text-xs font-medium text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const addressFields = evaluateAddressCompleteness(order);
  const phoneValidation = validateIndianPhone(order.phone);
  const assessment = calculateAttentionAssessment(order, seller.highValueThreshold);
  const recommended = getRecommendedAction(order, assessment);
  const whatsAppHref = buildWhatsAppUrl(order.phone, messageText);

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrder(
      order.id,
      {
        phone: editPhone.trim(),
        houseFlat: editHouseFlat.trim(),
        streetArea: editStreetArea.trim(),
        locality: editLocality.trim(),
        landmark: editLandmark.trim() || undefined,
        city: editCity.trim(),
        state: editState.trim(),
        pinCode: editPinCode.trim(),
      },
      'Contact or delivery address updated',
      'Seller updated order details during verification review.'
    );
    setIsEditing(false);
    showToast('Order details updated', 'Address check and attention score recalculated.');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      addOrderLog(order.id, 'Copied WhatsApp verification message');
      showToast('Message copied', 'Paste directly into WhatsApp chat with the buyer.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Copy unavailable', 'Please select and copy the message text manually.');
    }
  };

  const handleUseAddressCorrectionTemplate = () => {
    const missing = addressFields
      .filter((f) => f.status !== 'Complete')
      .map((f) => f.label);
    const detailPart =
      missing.length > 0
        ? ` Specifically, could you share your ${missing.join(', ')}?`
        : '';
    setMessageText(
      `Hello ${order.customerName}, thank you for your order (${order.id}) for ${order.productName}! We are preparing your shipment.${detailPart} Please confirm your full delivery address and mobile number to avoid delivery issues.`
    );
  };

  const handleResetDefaultTemplate = () => {
    setMessageText(buildWhatsAppMessage(seller.defaultWhatsAppTemplate, order));
  };

  const handleConfirmRto = () => {
    const parsedLoss = Math.max(
      0,
      Number(rtoLossInput) || seller.defaultRtoShippingLoss
    );
    updateOrderStatus(order.id, 'RTO', {
      recordedShippingLoss: parsedLoss,
      logAction: 'Marked as RTO',
      logNote: `Recorded actual shipping loss of ${formatINR(parsedLoss)}.`,
    });
    setRtoDialogOpen(false);
  };

  const handleConfirmCancel = () => {
    updateOrderStatus(order.id, 'Cancelled', {
      logAction: 'Order cancelled by seller',
      logNote: 'Cancelled after manual seller review.',
    });
    setCancelDialogOpen(false);
  };

  const isTerminal = ['Delivered', 'RTO', 'Cancelled'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => navigateTo('orders')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Orders</span>
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950 font-mono">
              {order.id}
            </h2>
            <StatusBadge status={order.status} />
            <AttentionIndicator
              level={assessment.level}
              score={assessment.score}
              showScore
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {order.productName} · Ordered on {order.orderDate}
            {order.salesChannel ? ` · via ${order.salesChannel}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900"
          >
            {isEditing ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Close Editor</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Address / Phone</span>
              </>
            )}
          </button>

          {order.status !== 'Ready to Dispatch' && !isTerminal && (
            <button
              type="button"
              onClick={() =>
                updateOrderStatus(order.id, 'Ready to Dispatch', {
                  customerConfirmed: true,
                  logAction: 'Approved for dispatch by seller',
                })
              }
              className="inline-flex items-center gap-1.5 rounded bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Mark Ready to Dispatch</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Address & Contact Editor */}
      {isEditing && (
        <form
          onSubmit={handleSaveEdits}
          className="rounded-md border border-neutral-900 bg-neutral-50 p-5"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-neutral-950">
                Update Contact &amp; Delivery Address
              </h3>
              <p className="mt-0.5 text-xs text-neutral-600">
                Saving immediately recalculates address completeness and attention score.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 font-mono text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                House / Flat Number
              </label>
              <input
                type="text"
                value={editHouseFlat}
                onChange={(e) => setEditHouseFlat(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                Street / Area
              </label>
              <input
                type="text"
                value={editStreetArea}
                onChange={(e) => setEditStreetArea(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                Locality
              </label>
              <input
                type="text"
                value={editLocality}
                onChange={(e) => setEditLocality(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                Landmark (optional)
              </label>
              <input
                type="text"
                value={editLandmark}
                onChange={(e) => setEditLandmark(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                City
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                State
              </label>
              <select
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs focus:border-neutral-950 focus:outline-none"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-800">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={editPinCode}
                onChange={(e) => setEditPinCode(e.target.value)}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-3 font-mono text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes &amp; Recalculate</span>
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Verification Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: A. Order Info + B. Address Completeness + E. Customer Verification */}
        <div className="space-y-6 lg:col-span-7">
          {/* A. Order Information */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              A. Order Information
            </h3>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Order ID</dt>
                <dd className="mt-1 font-mono font-semibold text-neutral-950">
                  {order.id}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Customer Name</dt>
                <dd className="mt-1 font-medium text-neutral-950">
                  {order.customerName}{' '}
                  <span className="font-normal text-neutral-500">
                    · {order.isFirstTimeCustomer ? 'First-time buyer' : 'Repeat buyer'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Phone Number</dt>
                <dd className="mt-1 flex items-center gap-2 font-mono font-medium text-neutral-950 tabular-nums">
                  <span>{order.phone || 'Missing'}</span>
                  <span
                    className={`font-sans text-[11px] font-medium ${
                      phoneValidation.isValid ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {phoneValidation.isValid ? 'Valid format' : 'Invalid format'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Order Value &amp; Payment</dt>
                <dd className="mt-1 font-mono font-semibold text-neutral-950 tabular-nums">
                  {formatINR(order.orderValue)}{' '}
                  <span className="font-sans font-normal text-neutral-600">
                    · {order.paymentType}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2 border-t border-neutral-100 pt-3">
                <dt className="text-neutral-500">Complete Delivery Address</dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-900">
                  {formatFullAddress(order)}
                </dd>
              </div>
            </dl>
          </section>

          {/* B. Address Completeness Check */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-neutral-950">
                  B. Address Completeness Check
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Field-by-field verification before label generation
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-600 tabular-nums">
                {addressFields.filter((f) => f.status === 'Complete').length}/6 complete
              </span>
            </div>

            <div className="mt-4 divide-y divide-neutral-200 border-t border-neutral-200">
              {addressFields.map((field) => {
                const statusIcon =
                  field.status === 'Complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  ) : field.status === 'Missing' ? (
                    <XCircle className="h-4 w-4 text-red-700" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                  );

                const statusTextColor =
                  field.status === 'Complete'
                    ? 'text-emerald-800'
                    : field.status === 'Missing'
                      ? 'text-red-800'
                      : 'text-amber-800';

                return (
                  <div
                    key={field.key}
                    className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-neutral-950">
                        {field.label}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-600">
                        {field.value ? (
                          <span className="font-mono text-neutral-900">
                            {field.value}
                          </span>
                        ) : (
                          <span className="italic text-neutral-400">Not provided</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {statusIcon}
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${statusTextColor}`}
                      >
                        {field.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
              <span>
                Address completeness checks field presence and formatting only. A valid 6-digit PIN code format does not guarantee courier serviceability to that location.
              </span>
            </div>
          </section>

          {/* E. Customer Verification */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-neutral-950">
                  E. Customer Verification (WhatsApp)
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Confirm delivery details directly with the buyer and log their response.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleResetDefaultTemplate}
                  className="text-neutral-600 hover:text-neutral-950 hover:underline"
                >
                  Standard message
                </button>
                <span aria-hidden="true" className="text-neutral-300">
                  |
                </span>
                <button
                  type="button"
                  onClick={handleUseAddressCorrectionTemplate}
                  className="text-neutral-600 hover:text-neutral-950 hover:underline"
                >
                  Address request
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="whatsapp-template"
                className="block text-xs font-medium text-neutral-800"
              >
                WhatsApp Message Template
              </label>
              <textarea
                id="whatsapp-template"
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="mt-1.5 w-full rounded border border-neutral-300 bg-white p-3 text-xs leading-relaxed text-neutral-900 focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>

              {whatsAppHref ? (
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    addOrderLog(order.id, 'Opened WhatsApp verification chat')
                  }
                  className="inline-flex items-center gap-1.5 rounded bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Open WhatsApp</span>
                  <ExternalLink className="h-3 w-3 opacity-75" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Invalid Indian phone number',
                      'Edit the phone number to a valid 10-digit Indian mobile number before opening WhatsApp.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-medium text-neutral-500"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Open WhatsApp (Fix phone first)</span>
                </button>
              )}
            </div>

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <div className="text-xs font-medium text-neutral-700">
                Update Verification Outcome
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateOrderStatus(order.id, 'Ready to Dispatch', {
                      customerConfirmed: true,
                      logAction: 'Marked as Confirmed',
                      logNote: 'Buyer confirmed delivery address and contact number.',
                    })
                  }
                  className="rounded border border-neutral-900 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  Mark as Confirmed
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateOrderStatus(order.id, 'Address Correction Required', {
                      customerConfirmed: false,
                      logAction: 'Marked as Correction Requested',
                      logNote: 'Requested updated address or landmark from buyer.',
                    })
                  }
                  className="rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900"
                >
                  Mark as Correction Requested
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateOrderStatus(order.id, 'Awaiting Customer Response', {
                      customerConfirmed: false,
                      logAction: 'Marked as No Response',
                      logNote: 'Follow-up sent; awaiting buyer reply.',
                    })
                  }
                  className="rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900"
                >
                  Mark as No Response
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: C. Attention Assessment + D. Recommended Action + Seller Dispatch + Logs */}
        <div className="space-y-6 lg:col-span-5">
          {/* C. Order Attention Assessment */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-neutral-950">
                  C. Order Attention Assessment
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Rule-based pre-dispatch verification checklist
                </p>
              </div>
              <AttentionIndicator level={assessment.level} />
            </div>

            <div className="mt-5 flex items-baseline justify-between">
              <div className="font-mono text-3xl font-bold tracking-tight text-neutral-950 tabular-nums">
                {assessment.score}
                <span className="text-base font-normal text-neutral-400">
                  {' '}
                  / 100
                </span>
              </div>
              <span className="text-xs font-medium text-neutral-600">
                {assessment.level} Attention Tier
              </span>
            </div>

            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-sm bg-neutral-100">
              <div
                className="h-full bg-neutral-950 transition-all duration-300"
                style={{ width: `${assessment.score}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-neutral-600">
              {assessment.summary}
            </p>

            {/* Factors contributing to score */}
            <div className="mt-5 border-t border-neutral-200 pt-4">
              <div className="text-xs font-semibold text-neutral-950">
                Factors Contributing to Score ({assessment.factors.length})
              </div>

              {assessment.factors.length === 0 ? (
                <div className="mt-3 rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                  No verification issues triggered (0 / 100).
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {assessment.factors.map((factor) => (
                    <li
                      key={factor.id}
                      className="rounded border border-neutral-200 bg-neutral-50/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-neutral-950">
                          {factor.label}
                        </span>
                        <span className="font-mono font-semibold text-neutral-950 tabular-nums">
                          +{factor.points}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                        {factor.explanation}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-700" />
              <span>
                <strong>Heuristic Notice:</strong> These are initial verification rules, not live delivery-probability predictions. COD or first-time customer status alone never results in High attention, and orders are never auto-cancelled.
              </span>
            </div>
          </section>

          {/* D. Recommended Action */}
          <section className="rounded-md border border-neutral-950 bg-neutral-950 p-5 text-white">
            <div className="text-xs font-medium text-neutral-400">
              D. Recommended Action
            </div>
            <div className="mt-1.5 font-display text-lg font-bold tracking-tight text-white">
              {recommended.action}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-300">
              {recommended.reason}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommended.action === 'Ready to Ship' &&
                order.status !== 'Ready to Dispatch' &&
                !isTerminal && (
                  <button
                    type="button"
                    onClick={() =>
                      updateOrderStatus(order.id, 'Ready to Dispatch', {
                        customerConfirmed: true,
                        logAction: 'Marked Ready to Dispatch',
                      })
                    }
                    className="rounded bg-white px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-neutral-200"
                  >
                    Approve &amp; Mark Ready
                  </button>
                )}
              {(recommended.action === 'Request Address Correction' ||
                recommended.action === 'Hold Until Details Are Updated') && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded bg-white px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-neutral-200"
                >
                  Edit Missing Details
                </button>
              )}
            </div>
          </section>

          {/* Seller Dispatch & Outcome Controls */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Dispatch &amp; Final Order Decision
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              The seller always controls the final dispatch and order outcome.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={order.status === 'Dispatched'}
                onClick={() =>
                  updateOrderStatus(order.id, 'Dispatched', {
                    logAction: 'Order dispatched to courier',
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Mark Dispatched</span>
              </button>

              <button
                type="button"
                disabled={order.status === 'Delivered'}
                onClick={() =>
                  updateOrderStatus(order.id, 'Delivered', {
                    logAction: 'Order delivered to customer',
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900 transition-colors hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Delivered</span>
              </button>

              <button
                type="button"
                disabled={order.status === 'RTO'}
                onClick={() => setRtoDialogOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Mark RTO</span>
              </button>

              <button
                type="button"
                disabled={order.status === 'Cancelled'}
                onClick={() => setCancelDialogOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Order</span>
              </button>
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-3">
              <label
                htmlFor="manual-status-select"
                className="block text-[11px] font-medium text-neutral-500"
              >
                Or set status directly
              </label>
              <select
                id="manual-status-select"
                value={order.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as OrderStatus;
                  if (nextStatus === 'RTO') {
                    setRtoDialogOpen(true);
                  } else if (nextStatus === 'Cancelled') {
                    setCancelDialogOpen(true);
                  } else {
                    updateOrderStatus(order.id, nextStatus);
                  }
                }}
                className="mt-1 h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
              >
                <option value="Verification Pending">Verification Pending</option>
                <option value="Awaiting Customer Response">
                  Awaiting Customer Response
                </option>
                <option value="Address Correction Required">
                  Address Correction Required
                </option>
                <option value="Ready to Dispatch">Ready to Dispatch</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="RTO">RTO</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </section>

          {/* Activity Log */}
          <section className="rounded-md border border-neutral-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Verification Activity Log
            </h3>
            <ul className="mt-4 space-y-3">
              {order.logs.map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-neutral-100 pb-2.5 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-neutral-900">
                      {entry.action}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 tabular-nums whitespace-nowrap">
                      {entry.timestamp}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Mark RTO Confirmation Dialog */}
      <ConfirmDialog
        open={rtoDialogOpen}
        title={`Record RTO for ${order.id}`}
        description="Recording an RTO updates order metrics and logs your actual two-way shipping cost for reporting."
        confirmLabel="Confirm RTO"
        variant="danger"
        onConfirm={handleConfirmRto}
        onCancel={() => setRtoDialogOpen(false)}
      >
        <div>
          <label
            htmlFor="rto-loss-input"
            className="block text-xs font-medium text-neutral-800"
          >
            Recorded Shipping Loss (₹ INR)
          </label>
          <input
            id="rto-loss-input"
            type="number"
            min={0}
            value={rtoLossInput}
            onChange={(e) => setRtoLossInput(e.target.value)}
            className="mt-1.5 h-9 w-full rounded border border-neutral-300 px-3 font-mono text-sm tabular-nums focus:border-neutral-950 focus:outline-none"
          />
        </div>
      </ConfirmDialog>

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title={`Cancel Order ${order.id}?`}
        description="Orders are never automatically cancelled by RTO Shield. Confirm if the customer requested cancellation or you decided not to fulfill this order."
        confirmLabel="Cancel Order"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </div>
  );
}
