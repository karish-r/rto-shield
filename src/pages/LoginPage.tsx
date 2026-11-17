import {
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { login, loginDemo, register } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'login') {
      const res = login(email, password);
      if (!res.ok && res.error) {
        setError(res.error);
      }
      return;
    }

    if (!businessName.trim()) {
      setError('Please enter your seller or business name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const res = register({
      businessName,
      email,
      password,
    });
    if (!res.ok && res.error) {
      setError(res.error);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError('Enter a valid email address to receive reset instructions.');
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-950 lg:grid lg:grid-cols-12">
      {/* Left Brand & Value Column */}
      <div className="flex flex-col justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-10 sm:px-12 lg:col-span-5 lg:border-b-0 lg:border-r lg:py-12">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-neutral-950 bg-neutral-950 text-white">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-neutral-950">
              RTO Shield
            </span>
          </div>

          <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-neutral-950 text-balance sm:text-4xl">
            Verify before you ship. Protect every order.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-600">
            Built for Indian Instagram sellers, WhatsApp boutiques, and growing D2C stores. Catch incomplete addresses, invalid PIN formats, and unconfirmed orders before courier handover.
          </p>

          <div className="mt-10 space-y-6 border-t border-neutral-200 pt-8">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                01. Address & Contact Completeness
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                Inspect house numbers, street details, Indian 10-digit mobile numbers, and 6-digit PIN formats before generating labels.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                02. Transparent Heuristic Scoring
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                Every flagged factor is explained in plain English. COD and first-time buyers are never penalized unfairly.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                03. One-Click WhatsApp Verification
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                Send ready-to-use confirmation messages, track customer replies, and stay in complete control of dispatch decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-neutral-500">
          RTO Shield · Order Verification Workspace for Indian Sellers
        </div>
      </div>

      {/* Right Authentication Form Column */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12 lg:col-span-7">
        <div className="w-full max-w-md">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 rounded-md border border-neutral-200 bg-neutral-50 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded py-2 text-xs font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded py-2 text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950">
              {mode === 'login' ? 'Sign in to your store' : 'Register your seller account'}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-600">
              {mode === 'login'
                ? 'Access your order verification queue, address checks, and RTO reports.'
                : 'Start verifying customer orders before courier dispatch.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-business-name"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Seller / Business Name
                </label>
                <input
                  id="auth-business-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Kraft & Loom Studio"
                  className="mt-1.5 h-10 w-full rounded border border-neutral-300 bg-white px-3 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-neutral-800"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstore.in"
                className="mt-1.5 h-10 w-full rounded border border-neutral-300 bg-white px-3 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSent(false);
                      setResetError('');
                      setForgotOpen(true);
                    }}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-950 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-10 w-full rounded border border-neutral-300 bg-white pl-3 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-neutral-950"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-10 w-full rounded border border-neutral-300 bg-white pl-3 pr-10 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-neutral-950"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 h-10 w-full rounded bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              {mode === 'login' ? 'Login' : 'Create Seller Account'}
            </button>
          </form>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-neutral-200" />
            <span className="mx-3 text-xs text-neutral-400">or</span>
            <div className="flex-grow border-t border-neutral-200" />
          </div>

          <button
            type="button"
            onClick={loginDemo}
            className="h-10 w-full rounded border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-900 hover:bg-neutral-50"
          >
            Continue with Demo Seller Account (Kraft & Loom Studio)
          </button>
        </div>
      </div>

      {/* Forgot Password Prototype Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="w-full max-w-md rounded-md border border-neutral-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h3
                id="forgot-modal-title"
                className="text-base font-semibold text-neutral-950"
              >
                Reset Seller Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                aria-label="Close modal"
                className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="mt-4">
                <div className="flex items-start gap-2.5 rounded border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950" />
                  <div>
                    <div className="font-semibold">Reset link preview sent</div>
                    <p className="mt-1 text-neutral-600">
                      If an account exists for <span className="font-medium text-neutral-950">{resetEmail}</span>, password reset instructions would be emailed. In this frontend prototype, you can sign in directly with the Demo Seller button.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="mt-5 h-9 w-full rounded bg-neutral-950 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-3 space-y-4">
                <p className="text-xs leading-relaxed text-neutral-600">
                  Enter the email address associated with your RTO Shield seller account.
                </p>
                {resetError && (
                  <p className="text-xs font-medium text-red-700">{resetError}</p>
                )}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-medium text-neutral-800"
                  >
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@yourstore.in"
                    className="mt-1.5 h-9 w-full rounded border border-neutral-300 px-3 text-sm focus:border-neutral-950 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="rounded border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
