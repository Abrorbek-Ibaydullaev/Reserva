import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import GoogleAuthButton from '../components/GoogleAuthButton';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm();
  const hasRecaptcha = Boolean(RECAPTCHA_SITE_KEY);
  const clearSubmitErrors = () => {
    setFormError('');
    setSubmitError('');
  };

  const onSubmit = async (data) => {
    if (hasRecaptcha && !recaptchaToken) {
      setFormError(t('auth.recaptcha_required'));
      return;
    }

    try {
      setIsLoading(true);
      clearSubmitErrors();
      const result = await login(data.email, data.password, recaptchaToken);
      if (result.success) {
        const fallback =
          result.user?.user_type === 'business_owner'
            ? '/dashboard'
            : result.user?.user_type === 'employee'
            ? '/employee/dashboard'
            : '/';
        navigate(from === '/' ? fallback : from, { replace: true });
      } else {
        const backendDetail =
          typeof result.message?.detail === 'string'
            ? result.message.detail
            : null;
        setSubmitError(
          result.status === 401
            ? t('auth.incorrect_credentials')
            : backendDetail || t('auth.something_went_wrong')
        );
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch (error) {
      const backendDetail =
        typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : null;
      setSubmitError(
        error.response?.status === 401
          ? t('auth.incorrect_credentials')
          : backendDetail || t('auth.something_went_wrong')
      );
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Log In"
        description="Sign in to your Reserva account to manage bookings, appointments, and your service business profile."
        path="/login"
      />
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0f1118]">
      {/* Left panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-500 p-12 text-white lg:flex lg:w-[42%]">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Reserva</span>
        </Link>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            {t('auth.welcome_back')}
          </h1>
          <p className="mt-4 text-blue-100">
            {t('auth.welcome_back_subtitle')}
          </p>

          <div className="mt-10 space-y-4">
            {[
              { emoji: '📅', key: 'feature_appointments' },
              { emoji: '🔔', key: 'feature_notifications' },
              { emoji: '📊', key: 'feature_analytics' },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm text-blue-50">{t(`auth.${item.key}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-blue-200">{t('auth.copyright', { year: new Date().getFullYear() })}</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Reserva</span>
          </Link>

          <Link to="/" className="mb-5 inline-flex text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:underline">
            &larr; {t('auth.back_to_home')}
          </Link>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.sign_in_to_account')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              {t('auth.create_one_free')}
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('form.email_address')}
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.email_placeholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  {...register('email', {
                    required: t('errors.email_required'),
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('errors.invalid_email') },
                    onChange: clearSubmitErrors,
                  })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('form.password')}</label>
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.password_placeholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  {...register('password', {
                    required: t('errors.password_required'),
                    minLength: { value: 6, message: t('errors.password_min_6') },
                    onChange: clearSubmitErrors,
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                  {t('auth.forgot_password')}
                </Link>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              {submitError && <p className="mt-1 text-xs text-red-600">{submitError}</p>}
            </div>

            {/* reCAPTCHA */}
            {hasRecaptcha && (
              <div>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (hasRecaptcha && !recaptchaToken)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.signing_in')}
                </>
              ) : (
                <>
                  {t('auth.sign_in')}
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider + Sign in with Google */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs font-medium text-slate-400">{t('auth.or', { defaultValue: 'or' })}</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>
          <GoogleAuthButton text="signin_with" onError={setSubmitError} />
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
