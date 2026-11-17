import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  PlusSquare,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppPage } from '../../types/order';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onRequestLogout: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', Icon: Package },
  { id: 'add-order', label: 'Add New Order', Icon: PlusSquare },
  { id: 'verification-queue', label: 'Verification Queue', Icon: ClipboardCheck },
  { id: 'reports', label: 'Reports', Icon: BarChart3 },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  onRequestLogout,
}: SidebarProps) {
  const { currentPage, navigateTo, seller, orders } = useApp();

  const queueCount = useMemo(
    () =>
      orders.filter((o) =>
        [
          'Verification Pending',
          'Awaiting Customer Response',
          'Address Correction Required',
        ].includes(o.status)
      ).length,
    [orders]
  );

  const initials = useMemo(() => {
    const parts = seller.sellerName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [seller.sellerName]);

  const handleNavClick = (page: AppPage) => {
    navigateTo(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white text-neutral-950">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-900 bg-neutral-950 text-white">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-neutral-950 whitespace-nowrap">
                RTO Shield
              </div>
              <div className="text-[11px] text-neutral-500 whitespace-nowrap">
                Verify before you ship
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive =
              currentPage === id ||
              (currentPage === 'order-details' && id === 'orders');

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>{label}</span>
                </span>
                {id === 'verification-queue' && queueCount > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    {queueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-neutral-300 bg-neutral-100 text-xs font-semibold text-neutral-900">
            {initials || 'RS'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-950">
              {seller.sellerName}
            </div>
            <div className="truncate text-xs text-neutral-500">
              {seller.businessName}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRequestLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-neutral-200 bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
