import { AlertCircle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, PaymentType } from '../types/order';
import {
  INDIAN_STATES,
  validateIndianPhone,
  validatePinCode,
} from '../utils/verification';

interface FormErrors {
  customerName?: string;
  phone?: string;
  houseFlat?: string;
  streetArea?: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  orderId?: string;
  productName?: string;
  orderValue?: string;
  orderDate?: string;
}

export function AddOrderPage() {
  const { orders, addOrder, navigateTo } = useApp();

  const nextOrderId = useMemo(() => {
    const maxNum = orders.reduce((max, o) => {
      const m = o.id.match(/ORD-(\d+)/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 4821);
    return `ORD-${maxNum + 1}`;
  }, [orders]);

  const todayStr = '2026-11-17';

  // Section A: Customer Details
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isFirstTimeCustomer, setIsFirstTimeCustomer] = useState(true);

  // Section B: Delivery Address
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinCode, setPinCode] = useState('');

  // Section C: Order Details
  const [orderId, setOrderId] = useState(nextOrderId);
  const [productName, setProductName] = useState('');
  const [orderValue, setOrderValue] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('COD');
  const [orderDate, setOrderDate] = useState(todayStr);

  // Validation & logging incomplete orders option
  const [allowFlaggedSave, setAllowFlaggedSave] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const phoneCheck = useMemo(() => validateIndianPhone(phone), [phone]);
  const pinCheck = useMemo(() => validatePinCode(pinCode), [pinCode]);

  const validateForm = (bypassAddressAndFormatWarnings: boolean): FormErrors => {
    const next: FormErrors = {};

    if (!customerName.trim()) {
      next.customerName = 'Customer name is required.';
    }

    if (!phone.trim()) {
      next.phone = 'Phone number is required.';
    } else if (!bypassAddressAndFormatWarnings && !phoneCheck.isValid) {
      next.phone = phoneCheck.message;
    }

    if (!bypassAddressAndFormatWarnings) {
      if (!houseFlat.trim()) {
        next.houseFlat = 'House/Flat number is missing.';
      }
      if (!streetArea.trim()) {
        next.streetArea = 'Street/Area is missing.';
      }
      if (!locality.trim()) {
        next.locality = 'Locality is missing.';
      }
    }

    if (!city.trim()) {
      next.city = 'City is required.';
    }
    if (!state.trim()) {
      next.state = 'State is required.';
    }

    if (!pinCode.trim()) {
      if (!bypassAddressAndFormatWarnings) {
        next.pinCode = 'PIN code is required (6 digits).';
      }
    } else if (!bypassAddressAndFormatWarnings && !pinCheck.isValid) {
      next.pinCode = pinCheck.message;
    }

    if (!orderId.trim()) {
      next.orderId = 'Order ID is required.';
    } else if (orders.some((o) => o.id.toLowerCase() === orderId.trim().toLowerCase())) {
      next.orderId = `Order ID ${orderId.trim()} already exists.`;
    }

    if (!productName.trim()) {
      next.productName = 'Product name is required.';
    }

    const numericVal = Number(orderValue);
    if (!orderValue.trim() || Number.isNaN(numericVal) || numericVal <= 0) {
      next.orderValue = 'Enter a valid order value greater than ₹0.';
    }

    if (!orderDate) {
      next.orderDate = 'Order date is required.';
    }

    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAttempt(true);

    const validationErrors = validateForm(allowFlaggedSave);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const hasMissingAddress =
      !houseFlat.trim() ||
      !streetArea.trim() ||
      !locality.trim() ||
      !pinCheck.isValid;

    let initialStatus: OrderStatus = 'Verification Pending';
    if (hasMissingAddress || !phoneCheck.isValid) {
      initialStatus = 'Address Correction Required';
    } else if (paymentType === 'Prepaid' && !isFirstTimeCustomer) {
      initialStatus = 'Ready to Dispatch';
    }

    const newOrder: Order = {
      id: orderId.trim(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      houseFlat: houseFlat.trim(),
      streetArea: streetArea.trim(),
      locality: locality.trim(),
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      productName: productName.trim(),
      orderValue: Math.round(Number(orderValue)),
      paymentType,
      orderDate,
      status: initialStatus,
      isFirstTimeCustomer,
      customerConfirmed: initialStatus === 'Ready to Dispatch',
      salesChannel: 'WhatsApp',
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: `${orderDate} 10:00`,
          action: 'Order created and queued for verification',
          note:
            hasMissingAddress || !phoneCheck.isValid
              ? 'Saved with incomplete address/contact details for seller follow-up.'
              : 'Initial format validation passed.',
        },
      ],
    };

    addOrder(newOrder);
  };

  const fillSampleIncompleteOrder = () => {
    setCustomerName('Nikhil Kulkarni');
    setPhone('982014567'); // 9 digits (invalid)
    setEmail('nikhil.k@example.in');
    setIsFirstTimeCustomer(true);
    setHouseFlat('');
    setStreetArea('FC Road');
    setLocality('');
    setLandmark('Near Vaishali Hotel');
    setCity('Pune');
    setState('Maharashtra');
    setPinCode('41104'); // 5 digits (invalid)
    setProductName('Handloom Indigo Kurta');
    setOrderValue('2650');
    setPaymentType('COD');
    setOrderDate(todayStr);
    setAllowFlaggedSave(true);
    setErrors({});
  };

  const missingOrWarningCount = Object.keys(errors).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
            Add New Order
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Enter customer, address, and order details to run automatic completeness & attention checks.
          </p>
        </div>

        <button
          type="button"
          onClick={fillSampleIncompleteOrder}
          className="rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-900 whitespace-nowrap self-start sm:self-auto"
        >
          Load Sample Incomplete Order
        </button>
      </div>

      {/* Summary Error Banner */}
      {submittedAttempt && missingOrWarningCount > 0 && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-xs text-red-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
            <div>
              <div className="font-semibold">
                Please review {missingOrWarningCount} highlighted field
                {missingOrWarningCount > 1 ? 's' : ''} before saving:
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                {Object.values(errors).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section A: Customer Details */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Section A. Customer Details
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Verified Indian 10-digit mobile numbers help couriers confirm delivery OTPs.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="customer-name"
                className="block text-xs font-medium text-neutral-800"
              >
                Customer Name <span className="text-red-600">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                  errors.customerName
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-red-700">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="block text-xs font-medium text-neutral-800"
              >
                Phone Number (India) <span className="text-red-600">*</span>
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9820451120 or +91 9820451120"
                className={`mt-1.5 h-10 w-full rounded border px-3 font-mono text-sm tabular-nums focus:outline-none ${
                  errors.phone
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.phone ? (
                <p className="mt-1 text-xs text-red-700">{errors.phone}</p>
              ) : phone.trim() ? (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    phoneCheck.isValid ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {phoneCheck.isValid ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span>{phoneCheck.message}</span>
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="customer-email"
                className="block text-xs font-medium text-neutral-800"
              >
                Email <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={isFirstTimeCustomer}
                  onChange={(e) => setIsFirstTimeCustomer(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 accent-neutral-950"
                />
                <span>First-time customer with store</span>
              </label>
            </div>
          </div>
        </section>

        {/* Section B: Delivery Address */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Section B. Delivery Address
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Complete house/flat, street, locality, and 6-digit PIN code prevent undeliverable hub returns.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="addr-house"
                className="block text-xs font-medium text-neutral-800"
              >
                House / Flat Number <span className="text-red-600">*</span>
              </label>
              <input
                id="addr-house"
                type="text"
                value={houseFlat}
                onChange={(e) => setHouseFlat(e.target.value)}
                placeholder="e.g. Flat 304, Shanti Residency"
                className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                  errors.houseFlat
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.houseFlat && (
                <p className="mt-1 text-xs text-red-700">{errors.houseFlat}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addr-street"
                className="block text-xs font-medium text-neutral-800"
              >
                Street / Area <span className="text-red-600">*</span>
              </label>
              <input
                id="addr-street"
                type="text"
                value={streetArea}
                onChange={(e) => setStreetArea(e.target.value)}
                placeholder="e.g. Link Road, Lane 4"
                className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                  errors.streetArea
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.streetArea && (
                <p className="mt-1 text-xs text-red-700">{errors.streetArea}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addr-locality"
                className="block text-xs font-medium text-neutral-800"
              >
                Locality <span className="text-red-600">*</span>
              </label>
              <input
                id="addr-locality"
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Andheri West"
                className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                  errors.locality
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.locality && (
                <p className="mt-1 text-xs text-red-700">{errors.locality}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="addr-landmark"
                className="block text-xs font-medium text-neutral-800"
              >
                Landmark <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="addr-landmark"
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Gate 2"
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="addr-city"
                  className="block text-xs font-medium text-neutral-800"
                >
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  id="addr-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                    errors.city
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-700">{errors.city}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addr-state"
                  className="block text-xs font-medium text-neutral-800"
                >
                  State <span className="text-red-600">*</span>
                </label>
                <select
                  id="addr-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={`mt-1.5 h-10 w-full rounded border bg-white px-3 text-sm focus:outline-none ${
                    errors.state
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-700">{errors.state}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="addr-pin"
                  className="block text-xs font-medium text-neutral-800"
                >
                  PIN Code <span className="text-red-600">*</span>
                </label>
                <input
                  id="addr-pin"
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="e.g. 400053"
                  className={`mt-1.5 h-10 w-full rounded border px-3 font-mono text-sm tabular-nums focus:outline-none ${
                    errors.pinCode
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                />
                {errors.pinCode ? (
                  <p className="mt-1 text-xs text-red-700">{errors.pinCode}</p>
                ) : pinCode.trim() ? (
                  <p
                    className={`mt-1 text-xs ${
                      pinCheck.isValid ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {pinCheck.isValid ? 'Valid 6-digit PIN format' : pinCheck.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Section C: Order Details */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="font-display text-sm font-semibold text-neutral-950">
              Section C. Order Details
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Product, order amount, payment mode, and booking date.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="order-id"
                className="block text-xs font-medium text-neutral-800"
              >
                Order ID <span className="text-red-600">*</span>
              </label>
              <input
                id="order-id"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={`mt-1.5 h-10 w-full rounded border px-3 font-mono text-sm focus:outline-none ${
                  errors.orderId
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.orderId && (
                <p className="mt-1 text-xs text-red-700">{errors.orderId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="order-product"
                className="block text-xs font-medium text-neutral-800"
              >
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                id="order-product"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Handwoven Cotton Saree"
                className={`mt-1.5 h-10 w-full rounded border px-3 text-sm focus:outline-none ${
                  errors.productName
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.productName && (
                <p className="mt-1 text-xs text-red-700">{errors.productName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="order-value"
                className="block text-xs font-medium text-neutral-800"
              >
                Order Value (₹ INR) <span className="text-red-600">*</span>
              </label>
              <input
                id="order-value"
                type="number"
                min={1}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                placeholder="e.g. 1499"
                className={`mt-1.5 h-10 w-full rounded border px-3 font-mono text-sm tabular-nums focus:outline-none ${
                  errors.orderValue
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.orderValue && (
                <p className="mt-1 text-xs text-red-700">{errors.orderValue}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-800">
                  Payment Type
                </label>
                <div className="mt-1.5 grid grid-cols-2 rounded border border-neutral-300 bg-neutral-50 p-0.5">
                  {(['COD', 'Prepaid'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`h-8 rounded-xs text-xs font-medium transition-colors ${
                        paymentType === type
                          ? 'bg-neutral-950 text-white'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="order-date"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Order Date
                </label>
                <input
                  id="order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-2.5 text-xs tabular-nums focus:border-neutral-950 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Option for logging incomplete WhatsApp/IG orders into verification queue */}
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={allowFlaggedSave}
              onChange={(e) => {
                setAllowFlaggedSave(e.target.checked);
                if (e.target.checked) {
                  setErrors((prev) => ({
                    customerName: prev.customerName,
                    city: prev.city,
                    state: prev.state,
                    orderId: prev.orderId,
                    productName: prev.productName,
                    orderValue: prev.orderValue,
                    orderDate: prev.orderDate,
                  }));
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-neutral-950"
            />
            <span className="text-xs leading-relaxed text-neutral-700">
              <strong className="font-semibold text-neutral-950">
                Log incomplete WhatsApp/Instagram order for verification:
              </strong>{' '}
              Allow saving even if house number, street, locality, PIN format, or phone format has missing/invalid details so it enters the Verification Queue for follow-up.
            </span>
          </label>
          <div className="mt-2 flex items-center gap-1.5 pl-7 text-[11px] text-neutral-500">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              A 6-digit PIN format check does not confirm courier serviceability.
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigateTo('orders')}
            className="rounded border border-neutral-300 bg-white px-5 py-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Save &amp; Verify Order</span>
          </button>
        </div>
      </form>
    </div>
  );
}
