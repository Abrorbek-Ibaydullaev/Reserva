import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/api';
import {
  CalendarDaysIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function EmailStep({ onSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      onSuccess(email.trim().toLowerCase());
    } catch {
      setError(t('auth.unable_to_send_code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t('auth.reset_password')}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t('auth.reset_subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('form.email_address')}
          </span>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder={t('auth.email_placeholder')}
            />
          </div>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('auth.sending')}
            </>
          ) : (
            <>
              {t('auth.otp_send_reset_code')}
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

function OTPStep({ email, onResend }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const submitOTP = useCallback(
    async (code) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.verifyOTP(email, code);
        const { reset_token } = response.data;
        sessionStorage.setItem('pw_reset_token', reset_token);
        navigate('/reset-password', { replace: true });
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          t('auth.otp_invalid');
        setError(msg);
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [email, navigate, t]
  );

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit) {
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      const complete = next.join('');
      if (complete.length === OTP_LENGTH && next.every(Boolean)) {
        submitOTP(complete);
      }
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      submitOTP(pasted);
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    const code = digits.join('');
    if (code.length === OTP_LENGTH) submitOTP(code);
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setDigits(Array(OTP_LENGTH).fill(''));
    try {
      await authService.forgotPassword(email);
      setCountdown(COUNTDOWN_SECONDS);
      onResend?.();
      inputRefs.current[0]?.focus();
    } catch {
      setError(t('auth.unable_to_resend'));
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every(Boolean);

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t('auth.enter_otp')}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t('auth.otp_sent', { email: <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> })}
      </p>

      <form onSubmit={handleManualSubmit} className="mt-6 space-y-6">
        {/* OTP digit boxes */}
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={[
                'h-12 w-10 sm:h-14 sm:w-12 rounded-xl border text-center text-xl font-bold',
                'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                'transition disabled:opacity-50',
                digit
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-slate-200 dark:border-slate-700',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Countdown */}
        <div className="text-center text-sm">
          {countdown > 0 ? (
            <span className="text-slate-500 dark:text-slate-400">
              {t('auth.otp_code_expires_in', { time: formatCountdown(countdown) })}
            </span>
          ) : (
            <span className="font-semibold text-red-500">{t('auth.otp_expired')}</span>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isComplete || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('auth.otp_verifying')}
            </>
          ) : (
            <>
              {t('auth.otp_verify')}
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('auth.otp_didnt_receive')}{' '}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50"
          >
            {resending ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('auth.otp_resending')}
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-3.5 w-3.5" />
                {t('auth.otp_resend')}
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  const handleEmailSuccess = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep(2);
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

        {/* Back link */}
        {step === 1 && (
          <Link
            to="/login"
            className="mb-5 inline-flex text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline"
          >
            &larr; {t('auth.back_to_sign_in')}
          </Link>
        )}
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-5 inline-flex text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline"
          >
            &larr; {t('auth.change_email')}
          </button>
        )}

        {step === 1 && <EmailStep onSuccess={handleEmailSuccess} />}
        {step === 2 && <OTPStep email={email} />}
      </div>
    </div>
  );
};

export default ForgotPassword;
