import {
  AddressFieldAssessment,
  AttentionAssessment,
  AttentionLevel,
  Order,
  PhoneValidationResult,
  PinValidationResult,
  RecommendedAction,
  ScoreFactor,
} from '../types/order';

export const ORDER_STATUSES = [
  'Verification Pending',
  'Awaiting Customer Response',
  'Address Correction Required',
  'Ready to Dispatch',
  'Dispatched',
  'Delivered',
  'RTO',
  'Cancelled',
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const VAGUE_ADDRESS_TERMS = ['na', 'n/a', 'nil', 'none', 'same', 'test', 'xxx', '...', '-'];

export function validateIndianPhone(rawPhone: string): PhoneValidationResult {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedDigits: '',
      message: 'Phone number is missing.',
    };
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      normalizedDigits: digits,
      message: `Expected 10-digit Indian mobile number (found ${digits.length} digits).`,
    };
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      normalizedDigits: digits,
      message: 'Indian mobile numbers must begin with 6, 7, 8, or 9.',
    };
  }

  if (/^(\d)\1{9}$/.test(digits)) {
    return {
      isValid: false,
      normalizedDigits: digits,
      message: 'Phone number appears to be a repeated placeholder digit.',
    };
  }

  return {
    isValid: true,
    normalizedDigits: digits,
    message: 'Valid 10-digit Indian mobile format.',
  };
}

export function validatePinCode(rawPin: string): PinValidationResult {
  const trimmed = rawPin.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: 'PIN code is missing.',
    };
  }

  if (!/^[1-9][0-9]{5}$/.test(trimmed)) {
    return {
      isValid: false,
      message: 'PIN code must be 6 digits and cannot start with 0.',
    };
  }

  return {
    isValid: true,
    message: 'Valid 6-digit PIN format (does not guarantee courier serviceability).',
  };
}

function checkTextAddressField(value: string, label: string, minLength = 2): { status: 'Complete' | 'Missing' | 'Needs Attention'; note: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      status: 'Missing',
      note: `${label} is missing and may prevent courier delivery.`,
    };
  }

  const lower = trimmed.toLowerCase();
  if (VAGUE_ADDRESS_TERMS.includes(lower) || trimmed.length < minLength) {
    return {
      status: 'Needs Attention',
      note: `${label} looks incomplete or too brief ("${trimmed}").`,
    };
  }

  return {
    status: 'Complete',
    note: `${label} provided.`,
  };
}

export function evaluateAddressCompleteness(order: Order): AddressFieldAssessment[] {
  const houseCheck = checkTextAddressField(order.houseFlat, 'House/Flat Number', 1);
  const streetCheck = checkTextAddressField(order.streetArea, 'Street/Area', 4);
  const localityCheck = checkTextAddressField(order.locality, 'Locality', 3);
  const cityCheck = checkTextAddressField(order.city, 'City', 2);
  const stateCheck = checkTextAddressField(order.state, 'State', 2);
  const pinValidation = validatePinCode(order.pinCode);

  return [
    {
      key: 'houseFlat',
      label: 'House / Flat Number',
      value: order.houseFlat.trim(),
      status: houseCheck.status,
      note: houseCheck.note,
    },
    {
      key: 'streetArea',
      label: 'Street / Area',
      value: order.streetArea.trim(),
      status: streetCheck.status,
      note: streetCheck.note,
    },
    {
      key: 'locality',
      label: 'Locality',
      value: order.locality.trim(),
      status: localityCheck.status,
      note: localityCheck.note,
    },
    {
      key: 'city',
      label: 'City',
      value: order.city.trim(),
      status: cityCheck.status,
      note: cityCheck.note,
    },
    {
      key: 'state',
      label: 'State',
      value: order.state.trim(),
      status: stateCheck.status,
      note: stateCheck.note,
    },
    {
      key: 'pinCode',
      label: 'PIN Code',
      value: order.pinCode.trim(),
      status: !order.pinCode.trim()
        ? 'Missing'
        : pinValidation.isValid
          ? 'Complete'
          : 'Needs Attention',
      note: pinValidation.message,
    },
  ];
}

export function hasAddressIssues(order: Order): boolean {
  const fields = evaluateAddressCompleteness(order);
  return fields.some((f) => f.status !== 'Complete');
}

export function calculateAttentionAssessment(
  order: Order,
  highValueThreshold = 2500
): AttentionAssessment {
  const factors: ScoreFactor[] = [];
  const addressFields = evaluateAddressCompleteness(order);
  const phoneValidation = validateIndianPhone(order.phone);
  const pinValidation = validatePinCode(order.pinCode);

  // Essential address fields excluding PIN (PIN has its own +30 rule)
  const nonPinIncomplete = addressFields.filter(
    (f) => f.key !== 'pinCode' && f.status !== 'Complete'
  );

  if (nonPinIncomplete.length > 0) {
    const missingNames = nonPinIncomplete.map((f) => f.label).join(', ');
    factors.push({
      id: 'missing-address',
      label: 'Missing or incomplete essential address field',
      points: 30,
      explanation: `Missing or unclear details in: ${missingNames}. Riders often mark shipments undeliverable without exact house/street markers.`,
    });
  }

  if (!phoneValidation.isValid) {
    factors.push({
      id: 'invalid-phone',
      label: 'Invalid Indian phone format',
      points: 25,
      explanation: `${phoneValidation.message} Courier riders cannot reach the customer for delivery OTP or landmark directions.`,
    });
  }

  if (!pinValidation.isValid) {
    factors.push({
      id: 'invalid-pin',
      label: 'Invalid PIN code format',
      points: 30,
      explanation: `${pinValidation.message} Incorrect PIN codes cause hub misrouting and automatic returns.`,
    });
  }

  const isConfirmationPending =
    !order.customerConfirmed &&
    (order.status === 'Verification Pending' ||
      order.status === 'Awaiting Customer Response' ||
      order.status === 'Address Correction Required');

  if (isConfirmationPending) {
    factors.push({
      id: 'confirmation-pending',
      label: 'Customer confirmation pending',
      points: 15,
      explanation:
        'Order has not yet been confirmed by the customer over WhatsApp or phone prior to dispatch.',
    });
  }

  if (order.paymentType === 'COD') {
    factors.push({
      id: 'cod-order',
      label: 'Cash on Delivery (COD) order',
      points: 10,
      explanation:
        'COD orders carry return shipping exposure if the buyer is unavailable at delivery. Confirming intent reduces avoidable returns.',
    });
  }

  if (order.orderValue >= highValueThreshold) {
    factors.push({
      id: 'high-value',
      label: `High order value (${formatINR(order.orderValue)})`,
      points: 10,
      explanation: `Order value meets or exceeds ${formatINR(highValueThreshold)}, increasing inventory lock-up if returned.`,
    });
  }

  if (order.isFirstTimeCustomer) {
    factors.push({
      id: 'first-time',
      label: 'First-time customer',
      points: 5,
      explanation:
        'No prior delivered order history with your store yet; helpful to confirm address clarity once.',
    });
  }

  const rawScore = factors.reduce((sum, item) => sum + item.points, 0);
  const score = Math.min(100, rawScore);

  let level: AttentionLevel = 'Low';
  if (score >= 60) {
    level = 'High';
  } else if (score >= 30) {
    level = 'Medium';
  }

  let summary = 'All contact and address fields are complete with low verification friction.';
  if (level === 'High') {
    summary =
      'Multiple critical verification gaps detected. Resolve missing address, phone, or PIN details before booking shipment.';
  } else if (level === 'Medium') {
    summary =
      'Order has manageable verification items such as pending customer confirmation or minor details to double-check.';
  }

  return {
    score,
    level,
    factors,
    summary,
  };
}

export function getRecommendedAction(
  order: Order,
  assessment: AttentionAssessment
): { action: RecommendedAction; reason: string } {
  const addressFields = evaluateAddressCompleteness(order);
  const phoneValid = validateIndianPhone(order.phone).isValid;
  const pinValid = validatePinCode(order.pinCode).isValid;
  const missingNonPin = addressFields.some(
    (f) => f.key !== 'pinCode' && f.status !== 'Complete'
  );

  if ((missingNonPin || !pinValid || !phoneValid) && assessment.score >= 60) {
    return {
      action: 'Hold Until Details Are Updated',
      reason:
        'Critical address or contact gaps create immediate delivery failure exposure. Hold dispatch and contact the buyer to update details.',
    };
  }

  if (missingNonPin || !pinValid) {
    return {
      action: 'Request Address Correction',
      reason:
        'One or more delivery address fields or the 6-digit PIN code need correction before generating a shipping label.',
    };
  }

  if (!phoneValid || !order.customerConfirmed) {
    return {
      action: 'Confirm Order Through WhatsApp',
      reason: !phoneValid
        ? 'Verify the customer contact number and confirm delivery availability before dispatch.'
        : 'Address format looks complete. Send a quick WhatsApp confirmation before handing over to the courier.',
    };
  }

  return {
    action: 'Ready to Ship',
    reason:
      'Address fields, phone format, PIN format, and confirmation checks are complete. Seller may proceed with dispatch.',
  };
}

export function getDetectedProblemsSummary(order: Order): string[] {
  const issues: string[] = [];
  const addressFields = evaluateAddressCompleteness(order);
  const phoneCheck = validateIndianPhone(order.phone);
  const pinCheck = validatePinCode(order.pinCode);

  const missingNonPin = addressFields.filter(
    (f) => f.key !== 'pinCode' && f.status === 'Missing'
  );
  const attentionNonPin = addressFields.filter(
    (f) => f.key !== 'pinCode' && f.status === 'Needs Attention'
  );

  if (missingNonPin.length > 0) {
    issues.push(`Missing ${missingNonPin.map((f) => f.label).join(', ')}`);
  }
  if (attentionNonPin.length > 0) {
    issues.push(`Unclear ${attentionNonPin.map((f) => f.label).join(', ')}`);
  }
  if (!phoneCheck.isValid) {
    issues.push('Invalid phone format');
  }
  if (!pinCheck.isValid) {
    issues.push(order.pinCode.trim() ? 'Invalid PIN format' : 'Missing PIN code');
  }
  if (
    !order.customerConfirmed &&
    ['Verification Pending', 'Awaiting Customer Response', 'Address Correction Required'].includes(
      order.status
    )
  ) {
    issues.push('Customer confirmation pending');
  }

  return issues;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFullAddress(order: Order): string {
  const parts = [
    order.houseFlat.trim() || '[Missing House/Flat]',
    order.streetArea.trim() || '[Missing Street/Area]',
    order.locality.trim() || '[Missing Locality]',
    order.landmark?.trim() ? `Near ${order.landmark.trim()}` : '',
    order.city.trim() || '[Missing City]',
    order.state.trim() || '[Missing State]',
    order.pinCode.trim() ? `- ${order.pinCode.trim()}` : '[Missing PIN]',
  ].filter(Boolean);

  return parts.join(', ');
}

export function buildWhatsAppMessage(template: string, order: Order): string {
  return template
    .replace(/\[Customer Name\]/g, order.customerName || 'Customer')
    .replace(/\[Order ID\]/g, order.id)
    .replace(/\[Product Name\]/g, order.productName);
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const validation = validateIndianPhone(phone);
  if (!validation.isValid) return null;
  return `https://wa.me/91${validation.normalizedDigits}?text=${encodeURIComponent(message)}`;
}
