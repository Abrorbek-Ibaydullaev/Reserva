import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import {
  CalendarDaysIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// ─── Password strength ───────────────────────────────────────────────────────

/**
 * Returns { level: 0|1|2|3, label: string, color: string }
 * 0 = empty, 1 = weak, 2 = medium, 3 = strong
 */
function measureStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { level: 2, label: 'Medium', color: 'bg-yellow-400' };
  return { level: 3, label: 'Strong', color: 'bg-green-500' };
}

function StrengthBar({ password }) {
  const { level, label, color } = measureStrength(password);
  if (!label) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={[
              'h-1 flex-1 rounded-full transition-colors duration-300',
              n <= level ? color : 'bg-slate-200 dark:bg-slate-700',
            ].join(' ')}
          />
        ))}
      </div>
      <p
        className={[
          'text-xs font-medium',
          level === 1
            ? 'text-red-500'
            : level === 2
            ? 'text-yellow-500 dark:text-yellow-400'
            : 'text-green-600 dark:text-green-400',
        ].join(' ')}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read token from sessionStorage (keeps it out of browser history and server logs).
  // Falls back to ?token= URL param for backwards compatibility.
  const [token] = useState(() => {
    const stored = sessionStorage.getItem('pw_reset_token');
    if (stored) {
      sessionStorage.removeItem('pw_reset_token');
      return stored;
    }
    return searchParams.get('token') || '';
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email or start over.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ reset_token: token, password });
      setMessage('Password updated successfully. Redirecting to sign in…');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login', { replace: true, state: { flashMessage: 'Password updated. Please sign in.' } }), 2000);
    } catch (err) {
      const detail =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        null;
      setError(detail || 'Link expired or invalid. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0f1118] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <CalendarDaysIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">Reserva</span>
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter and confirm your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              New password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="New password (min. 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Confirm password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className={[
                  'w-full rounded-xl border py-2.5 pl-10 pr-10',
                  'bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500',
                ].join(' ')}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
              {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')) && (
                <span>
                  {' '}
                  <Link
                    to="/forgot-password"
                    className="font-semibold underline hover:text-red-800 dark:hover:text-red-300"
                  >
                    Request a new code
                  </Link>
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(message) || !token}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                Set new password
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-5 inline-flex text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline"
        >
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
