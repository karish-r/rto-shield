import { LogOut, RotateCcw, Save } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { INDIAN_STATES } from '../utils/verification';

interface SettingsPageProps {
  onRequestLogout: () => void;
}

export function SettingsPage({ onRequestLogout }: SettingsPageProps) {
  const { seller, updateSeller, resetDemoData, showToast } = useApp();

  const [sellerName, setSellerName] = useState(seller.sellerName);
  const [role, setRole] = useState(seller.role);
  const [businessName, setBusinessName] = useState(seller.businessName);
  const [businessCategory, setBusinessCategory] = useState(
    seller.businessCategory
  );
  const [gstin, setGstin] = useState(seller.gstin || '');
  const [email, setEmail] = useState(seller.email);
  const [phone, setPhone] = useState(seller.phone);
  const [city, setCity] = useState(seller.city);
  const [state, setState] = useState(seller.state);
  const [defaultWhatsAppTemplate, setDefaultWhatsAppTemplate] = useState(
    seller.defaultWhatsAppTemplate
  );
  const [highValueThreshold, setHighValueThreshold] = useState(
    String(seller.highValueThreshold)
  );
  const [defaultRtoShippingLoss, setDefaultRtoShippingLoss] = useState(
    String(seller.defaultRtoShippingLoss)
  );

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Reset confirmation
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSeller({
      sellerName: sellerName.trim() || seller.sellerName,
      role: role.trim() || seller.role,
      businessName: businessName.trim() || seller.businessName,
      businessCategory: businessCategory.trim() || seller.businessCategory,
      gstin: gstin.trim() || undefined,
      email: email.trim() || seller.email,
      phone: phone.trim() || seller.phone,
      city: city.trim() || seller.city,
      state: state.trim() || seller.state,
      defaultWhatsAppTemplate:
        defaultWhatsAppTemplate.trim() || seller.defaultWhatsAppTemplate,
      highValueThreshold: Math.max(500, Number(highValueThreshold) || 2500),
      defaultRtoShippingLoss: Math.max(0, Number(defaultRtoShippingLoss) || 145),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6) {
      setPasswordMessage(
        'Enter your current password and a new password of at least 6 characters.'
      );
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordMessage('');
    showToast('Password updated', 'Your account credentials have been updated.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <h2 className="font-display text-xl font-bold tracking-tight text-neutral-950">
          Settings
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Manage your seller profile, business details, verification thresholds, and account preferences.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Seller Profile */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Seller Profile
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-seller-name"
                className="block text-xs font-medium text-neutral-800"
              >
                Seller Full Name
              </label>
              <input
                id="set-seller-name"
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="set-role"
                className="block text-xs font-medium text-neutral-800"
              >
                Role
              </label>
              <input
                id="set-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Business Information */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Business Information
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-biz-name"
                className="block text-xs font-medium text-neutral-800"
              >
                Business / Store Name
              </label>
              <input
                id="set-biz-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="set-biz-cat"
                className="block text-xs font-medium text-neutral-800"
              >
                Store Channel Type
              </label>
              <select
                id="set-biz-cat"
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 bg-white px-3 text-sm focus:border-neutral-950 focus:outline-none"
              >
                <option value="Instagram & WhatsApp D2C">
                  Instagram &amp; WhatsApp D2C
                </option>
                <option value="Instagram Boutique">Instagram Boutique</option>
                <option value="WhatsApp Catalog Seller">
                  WhatsApp Catalog Seller
                </option>
                <option value="Home-Based Business">Home-Based Business</option>
                <option value="Small D2C Brand">Small D2C Brand</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="set-gstin"
                className="block text-xs font-medium text-neutral-800"
              >
                GSTIN <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="set-gstin"
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 font-mono text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="set-city"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Dispatch City
                </label>
                <input
                  id="set-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="set-state"
                  className="block text-xs font-medium text-neutral-800"
                >
                  State
                </label>
                <select
                  id="set-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded border border-neutral-300 bg-white px-2.5 text-sm focus:border-neutral-950 focus:outline-none"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Verification Preferences */}
        <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
          <h3 className="font-display text-sm font-semibold text-neutral-950">
            Contact Details &amp; Verification Rules
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-email"
                className="block text-xs font-medium text-neutral-800"
              >
                Support Email
              </label>
              <input
                id="set-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="set-phone"
                className="block text-xs font-medium text-neutral-800"
              >
                WhatsApp Business Number
              </label>
              <input
                id="set-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 font-mono text-sm tabular-nums focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="set-high-value"
                className="block text-xs font-medium text-neutral-800"
              >
                High Order Value Threshold (₹)
              </label>
              <input
                id="set-high-value"
                type="number"
                min={500}
                value={highValueThreshold}
                onChange={(e) => setHighValueThreshold(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 font-mono text-sm tabular-nums focus:border-neutral-950 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Orders at or above this amount add +10 attention points.
              </p>
            </div>

            <div>
              <label
                htmlFor="set-rto-loss"
                className="block text-xs font-medium text-neutral-800"
              >
                Default RTO Two-Way Shipping Cost (₹)
              </label>
              <input
                id="set-rto-loss"
                type="number"
                min={0}
                value={defaultRtoShippingLoss}
                onChange={(e) => setDefaultRtoShippingLoss(e.target.value)}
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 font-mono text-sm tabular-nums focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="set-template"
                className="block text-xs font-medium text-neutral-800"
              >
                Default WhatsApp Confirmation Message
              </label>
              <textarea
                id="set-template"
                rows={3}
                value={defaultWhatsAppTemplate}
                onChange={(e) => setDefaultWhatsAppTemplate(e.target.value)}
                className="mt-1.5 w-full rounded border border-neutral-300 p-3 text-xs leading-relaxed focus:border-neutral-950 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Supported placeholders: [Customer Name], [Order ID], [Product Name].
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-neutral-100 pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Profile &amp; Preferences</span>
            </button>
          </div>
        </section>
      </form>

      {/* Account Settings & Password */}
      <section className="rounded-md border border-neutral-200 bg-white p-5 sm:p-6">
        <h3 className="font-display text-sm font-semibold text-neutral-950">
          Account Security
        </h3>
        <form
          onSubmit={handlePasswordSubmit}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <label
              htmlFor="set-cur-pass"
              className="block text-xs font-medium text-neutral-800"
            >
              Current Password
            </label>
            <input
              id="set-cur-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="set-new-pass"
              className="block text-xs font-medium text-neutral-800"
            >
              New Password
            </label>
            <input
              id="set-new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 h-10 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
            />
          </div>
          {passwordMessage && (
            <p className="sm:col-span-2 text-xs text-red-700">{passwordMessage}</p>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:border-neutral-900"
            >
              Update Password
            </button>
          </div>
        </form>

        {/* Demo Reset & Logout */}
        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-semibold text-neutral-950">
              Session &amp; Prototype Data
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              Restore the initial sample Indian seller orders or sign out of this browser session.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-800 hover:border-neutral-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>
            <button
              type="button"
              onClick={onRequestLogout}
              className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset Demo Data?"
        description="This will restore the 20 sample Indian seller orders and default verification settings in local browser storage."
        confirmLabel="Restore Demo Data"
        onConfirm={() => {
          resetDemoData();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
