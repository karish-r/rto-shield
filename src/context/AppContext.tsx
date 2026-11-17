import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SELLER_PROFILE, SAMPLE_ORDERS } from '../data/sampleData';
import {
  AppNotification,
  AppPage,
  AttentionLevel,
  Order,
  OrderStatus,
  SellerProfile,
} from '../types/order';
import { calculateAttentionAssessment, getDetectedProblemsSummary } from '../utils/verification';

const STORAGE_KEYS = {
  AUTH: 'rto_shield_auth_v1',
  SELLER: 'rto_shield_seller_v1',
  ORDERS: 'rto_shield_orders_v1',
  READ_NOTIFS: 'rto_shield_read_notifs_v1',
  ACCOUNTS: 'rto_shield_accounts_v1',
};

interface StoredAccount {
  email: string;
  password: string;
  sellerName: string;
  businessName: string;
}

export interface OrdersFilterPreset {
  status?: OrderStatus | 'All';
  attention?: AttentionLevel | 'All';
  payment?: 'COD' | 'Prepaid' | 'All';
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

interface AppContextValue {
  isAuthenticated: boolean;
  seller: SellerProfile;
  orders: Order[];
  currentPage: AppPage;
  selectedOrderId: string | null;
  ordersFilterPreset: OrdersFilterPreset | null;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  toasts: ToastMessage[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginDemo: () => void;
  register: (payload: {
    businessName: string;
    email: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logout: () => void;
  updateSeller: (updates: Partial<SellerProfile>) => void;
  navigateTo: (page: AppPage, preset?: OrdersFilterPreset) => void;
  openOrderDetails: (orderId: string) => void;
  clearOrdersFilterPreset: () => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>, logAction?: string, logNote?: string) => void;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { customerConfirmed?: boolean; recordedShippingLoss?: number; logAction?: string; logNote?: string }
  ) => void;
  addOrderLog: (orderId: string, action: string, note?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
  showToast: (title: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function nowTimestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [seller, setSeller] = useState<SellerProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SELLER);
      if (raw) return { ...DEFAULT_SELLER_PROFILE, ...JSON.parse(raw) };
    } catch {
      // fallback to default
    }
    return DEFAULT_SELLER_PROFILE;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return SAMPLE_ORDERS;
  });

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.READ_NOTIFS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(SAMPLE_ORDERS[0].id);
  const [ordersFilterPreset, setOrdersFilterPreset] = useState<OrdersFilterPreset | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, String(isAuthenticated));
    } catch {
      // ignore storage errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELLER, JSON.stringify(seller));
    } catch {
      // ignore
    }
  }, [seller]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.READ_NOTIFS, JSON.stringify(readNotifIds));
    } catch {
      // ignore
    }
  }, [readNotifIds]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, description }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const login = useCallback(
    (email: string, password: string): { ok: boolean; error?: string } => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { ok: false, error: 'Please enter both email address and password.' };
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        const accounts: StoredAccount[] = raw ? JSON.parse(raw) : [];
        const matched = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);
        if (matched) {
          if (matched.password !== password) {
            return { ok: false, error: 'Incorrect password for this account.' };
          }
          setSeller((prev) => ({
            ...prev,
            email: matched.email,
            sellerName: matched.sellerName,
            businessName: matched.businessName,
          }));
          setIsAuthenticated(true);
          setCurrentPage('dashboard');
          return { ok: true };
        }
      } catch {
        // fallback
      }

      // Allow demo seller credentials or standard prototype login
      if (password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }

      if (cleanEmail !== seller.email.toLowerCase()) {
        const nameGuess = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = nameGuess
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setSeller((prev) => ({
          ...prev,
          email: cleanEmail,
          sellerName: formattedName || prev.sellerName,
        }));
      }

      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      return { ok: true };
    },
    [seller.email]
  );

  const loginDemo = useCallback(() => {
    setSeller(DEFAULT_SELLER_PROFILE);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  }, []);

  const register = useCallback(
    ({
      businessName,
      email,
      password,
    }: {
      businessName: string;
      email: string;
      password: string;
    }): { ok: boolean; error?: string } => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanBiz = businessName.trim();
      if (!cleanBiz || !cleanEmail || password.length < 6) {
        return { ok: false, error: 'Please complete all required registration fields.' };
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        const accounts: StoredAccount[] = raw ? JSON.parse(raw) : [];
        const nextAccounts = [
          ...accounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
          {
            email: cleanEmail,
            password,
            sellerName: cleanBiz,
            businessName: cleanBiz,
          },
        ];
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(nextAccounts));
      } catch {
        // ignore
      }

      setSeller((prev) => ({
        ...prev,
        email: cleanEmail,
        sellerName: cleanBiz,
        businessName: cleanBiz,
      }));
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      showToast('Seller account created', `Welcome to RTO Shield, ${cleanBiz}.`);
      return { ok: true };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  }, []);

  const updateSeller = useCallback(
    (updates: Partial<SellerProfile>) => {
      setSeller((prev) => ({ ...prev, ...updates }));
      showToast('Settings saved', 'Your seller and verification preferences are updated.');
    },
    [showToast]
  );

  const navigateTo = useCallback((page: AppPage, preset?: OrdersFilterPreset) => {
    if (preset) {
      setOrdersFilterPreset(preset);
    } else if (page !== 'orders') {
      setOrdersFilterPreset(null);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openOrderDetails = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage('order-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearOrdersFilterPreset = useCallback(() => {
    setOrdersFilterPreset(null);
  }, []);

  const addOrder = useCallback(
    (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      setSelectedOrderId(order.id);
      setCurrentPage('order-details');
      showToast(`Order ${order.id} saved`, 'Opened verification review.');
    },
    [showToast]
  );

  const updateOrder = useCallback(
    (orderId: string, updates: Partial<Order>, logAction?: string, logNote?: string) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const nextLogs = logAction
            ? [
                {
                  id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                  timestamp: nowTimestamp(),
                  action: logAction,
                  note: logNote,
                },
                ...order.logs,
              ]
            : order.logs;
          return {
            ...order,
            ...updates,
            logs: nextLogs,
          };
        })
      );
    },
    []
  );

  const updateOrderStatus = useCallback(
    (
      orderId: string,
      status: OrderStatus,
      options?: {
        customerConfirmed?: boolean;
        recordedShippingLoss?: number;
        logAction?: string;
        logNote?: string;
      }
    ) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const nextConfirmed =
            options?.customerConfirmed !== undefined
              ? options.customerConfirmed
              : status === 'Ready to Dispatch' || status === 'Dispatched' || status === 'Delivered'
                ? true
                : order.customerConfirmed;

          const nextShippingLoss =
            status === 'RTO'
              ? options?.recordedShippingLoss ?? order.recordedShippingLoss ?? seller.defaultRtoShippingLoss
              : order.recordedShippingLoss;

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: nowTimestamp(),
            action: options?.logAction ?? `Status changed to ${status}`,
            note: options?.logNote,
          };

          return {
            ...order,
            status,
            customerConfirmed: nextConfirmed,
            recordedShippingLoss: nextShippingLoss,
            logs: [logEntry, ...order.logs],
          };
        })
      );
      showToast(`Order ${orderId} updated`, `Status set to ${status}.`);
    },
    [seller.defaultRtoShippingLoss, showToast]
  );

  const addOrderLog = useCallback((orderId: string, action: string, note?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          logs: [
            {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: nowTimestamp(),
              action,
              note,
            },
            ...order.logs,
          ],
        };
      })
    );
  }, []);

  const notifications: AppNotification[] = useMemo(() => {
    return orders
      .filter((o) =>
        ['Verification Pending', 'Awaiting Customer Response', 'Address Correction Required'].includes(
          o.status
        )
      )
      .map((order) => {
        const assessment = calculateAttentionAssessment(order, seller.highValueThreshold);
        const problems = getDetectedProblemsSummary(order);
        return {
          id: `notif-${order.id}-${order.status}`,
          orderId: order.id,
          title: `${order.id} · ${order.customerName}`,
          description:
            problems.length > 0
              ? `${problems.slice(0, 2).join(' · ')} (${assessment.level} attention)`
              : `${order.status} (${assessment.level} attention)`,
          read: readNotifIds.includes(`notif-${order.id}-${order.status}`),
        };
      })
      .slice(0, 8);
  }, [orders, readNotifIds, seller.highValueThreshold]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markNotificationRead = useCallback((id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setReadNotifIds((prev) => {
      const ids = notifications.map((n) => n.id);
      return Array.from(new Set([...prev, ...ids]));
    });
  }, [notifications]);

  const resetDemoData = useCallback(() => {
    setOrders(SAMPLE_ORDERS);
    setSeller(DEFAULT_SELLER_PROFILE);
    setReadNotifIds([]);
    setSelectedOrderId(SAMPLE_ORDERS[0].id);
    showToast('Demo workspace restored', 'Sample Indian seller orders and default rules reloaded.');
  }, [showToast]);

  const value: AppContextValue = {
    isAuthenticated,
    seller,
    orders,
    currentPage,
    selectedOrderId,
    ordersFilterPreset,
    notifications,
    unreadNotificationCount,
    toasts,
    login,
    loginDemo,
    register,
    logout,
    updateSeller,
    navigateTo,
    openOrderDetails,
    clearOrdersFilterPreset,
    addOrder,
    updateOrder,
    updateOrderStatus,
    addOrderLog,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
    showToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
