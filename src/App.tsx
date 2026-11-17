import { CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { AppProvider, useApp } from './context/AppContext';
import { AddOrderPage } from './pages/AddOrderPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';

function AppShell() {
  const { isAuthenticated, currentPage, logout, toasts, dismissToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'orders':
        return <OrdersPage />;
      case 'add-order':
        return <AddOrderPage />;
      case 'order-details':
        return <OrderDetailsPage />;
      case 'verification-queue':
        return <VerificationQueuePage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage onRequestLogout={() => setLogoutDialogOpen(true)} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50/40 text-neutral-950">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onRequestLogout={() => setLogoutDialogOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRequestLogout={() => setLogoutDialogOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Logout from RTO Shield?"
        description="Your orders and verification updates remain saved in this browser. You can sign back in anytime."
        confirmLabel="Logout"
        onConfirm={() => {
          setLogoutDialogOpen(false);
          setMobileMenuOpen(false);
          logout();
        }}
        onCancel={() => setLogoutDialogOpen(false)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; title: string; description?: string }[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-950 px-4 py-3 text-white shadow-lg"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
            <div>
              <div className="text-xs font-semibold">{t.title}</div>
              {t.description && (
                <div className="mt-0.5 text-[11px] text-neutral-300">
                  {t.description}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="rounded p-0.5 text-neutral-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
