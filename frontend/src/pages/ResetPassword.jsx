import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { CalendarDaysIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, new_password: password });
      setMessage('Password reset successfully. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.new_password?.[0];
      setError(detail || 'Unable to reset password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <CalendarDaysIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Reserva</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter and confirm your new password.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">New password</span>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="New password"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</span>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Confirm password"
              />
            </div>
          </label>

          {message && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Reset password'}
          </button>
        </form>

        {message && (
          <Link to="/login" className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:underline">
            Go to sign in
          </Link>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
