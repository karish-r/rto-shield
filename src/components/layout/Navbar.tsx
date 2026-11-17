import { Bell, Check, Menu, Search, Settings, LogOut, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppPage } from '../../types/order';
import { formatINR } from '../../utils/verification';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onRequestLogout: () => void;
}

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  'add-order': 'Add New Order',
  'order-details': 'Order Verification & Details',
  'verification-queue': 'Verification Queue',
  reports: 'Reports',
  settings: 'Settings',
};

export function Navbar({ onOpenMobileMenu, onRequestLogout }: NavbarProps) {
  const {
    currentPage,
    orders,
    seller,
    selectedOrderId,
    notifications,
    unreadNotificationCount,
    openOrderDetails,
    navigateTo,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [orders, searchQuery]);

  const initials = useMemo(() => {
    const parts = seller.sellerName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [seller.sellerName]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMatches.length > 0) {
      openOrderDetails(searchMatches[0].id);
      setSearchQuery('');
      setSearchFocused(false);
    } else if (searchQuery.trim()) {
      navigateTo('orders');
      setSearchFocused(false);
    }
  };

  const pageTitle =
    currentPage === 'order-details' && selectedOrderId
      ? `Order Verification · ${selectedOrderId}`
      : PAGE_TITLES[currentPage];

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
      {/* Left: Mobile toggle + Page Title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded border border-neutral-200 p-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="truncate font-display text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Order Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search Order ID, customer, phone..."
              aria-label="Search orders"
              className="h-9 w-64 rounded border border-neutral-200 bg-neutral-50 pl-9 pr-7 text-xs text-neutral-950 placeholder:text-neutral-400 transition-colors focus:border-neutral-900 focus:bg-white focus:outline-none lg:w-72"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-md border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 px-3 py-2 text-[11px] font-medium text-neutral-500">
                Matching Orders ({searchMatches.length})
              </div>
              {searchMatches.length === 0 ? (
                <div className="px-3 py-4 text-xs text-neutral-500">
                  No orders matching &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {searchMatches.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => {
                          openOrderDetails(order.id);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-medium text-neutral-950">
                            <span className="font-mono">{order.id}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{order.customerName}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-neutral-500">
                            {order.city} · {order.status}
                          </div>
                        </div>
                        <span className="ml-2 shrink-0 font-mono text-xs text-neutral-900 tabular-nums">
                          {formatINR(order.orderValue)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded bg-neutral-950 px-1 font-mono text-[10px] font-medium text-white tabular-nums">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-md border border-neutral-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5">
                <span className="text-xs font-semibold text-neutral-950">
                  Verification Alerts
                </span>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-950"
                  >
                    <Check className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-neutral-500">
                  No pending verification alerts right now.
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          openOrderDetails(n.orderId);
                          setNotifOpen(false);
                        }}
                        className={`flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                          n.read ? 'opacity-65' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-neutral-950">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="text-[10px] font-medium text-neutral-500">
                              Unread
                            </span>
                          )}
                        </div>
                        <span className="mt-0.5 text-xs text-neutral-600">
                          {n.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-neutral-200 px-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('verification-queue');
                    setNotifOpen(false);
                  }}
                  className="text-xs font-medium text-neutral-900 hover:underline"
                >
                  Open Verification Queue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-label="Seller profile menu"
            className="flex h-9 items-center gap-2 rounded border border-neutral-200 bg-white px-2.5 text-left transition-colors hover:border-neutral-400"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-950 text-[11px] font-semibold text-white">
              {initials || 'RS'}
            </span>
            <span className="hidden text-xs font-medium text-neutral-900 sm:inline whitespace-nowrap">
              {seller.sellerName}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
              <div className="border-b border-neutral-100 px-3 py-2">
                <div className="truncate text-xs font-semibold text-neutral-950">
                  {seller.sellerName}
                </div>
                <div className="truncate text-[11px] text-neutral-500">
                  {seller.businessName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigateTo('settings');
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Account Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onRequestLogout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
