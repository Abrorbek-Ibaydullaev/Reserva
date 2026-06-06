import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const RECAPTCHA_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || RECAPTCHA_TEST_SITE_KEY;

const Field = ({ label, error, children, optional }) => (
  <div>
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-soft">
      {label}
      {optional && <span className="text-xs text-muted">(optional)</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
    )}
    <input
      className={`w-full rounded-xl border border-token bg-surface-token py-2.5 text-token placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${Icon ? 'auth-input' : 'px-3'}`}
      {...props}
    />
  </div>
);

const Register = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('customer');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const onSubmit = async (data) => {
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA check before creating your account.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const payload = {
        email: data.email,
        password: data.password,
        password2: data.password2,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number || '',
        user_type: userType,
        recaptcha_token: recaptchaToken,
      };

      const result = await authRegister(payload);

      if (result.success) {
        if (userType === 'business_owner') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/services', { replace: true });
        }
      } else {
        const msg = result.message;
        if (typeof msg === 'string') {
          setError(msg);
        } else if (msg?.recaptcha) {
          setError(Array.isArray(msg.recaptcha) ? msg.recaptcha[0] : msg.recaptcha);
        } else if (msg?.email) {
          setError(Array.isArray(msg.email) ? msg.email[0] : msg.email);
        } else if (msg?.detail) {
          setError(msg.detail);
        } else {
          setError('Registration failed. Please check your details and try again.');
        }
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-app">
      {/* Left panel */}
      <div className="hidden flex-col justify-between bg-primary p-12 text-white lg:flex lg:w-[42%]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-glass">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Reserva</span>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Start managing your<br />bookings today
          </h1>
          <p className="mt-4 text-white/80">
            Join professionals and customers across Uzbekistan on the easiest appointment platform.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { emoji: '📅', text: 'Real-time availability & instant booking' },
              { emoji: '🔔', text: 'Automatic confirmations & reminders' },
              { emoji: '📊', text: 'Business dashboard with analytics' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm text-white/85">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/70">© {new Date().getFullYear()} Reserva. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 lg:items-center lg:px-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-token">Reserva</span>
          </div>

          <h2 className="text-2xl font-bold text-token">Create your account</h2>
          <p className="mt-1 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>

          {/* Account type toggle */}
          <div className="mt-6 rounded-[var(--radius-lg)] border border-token bg-surface-token p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setUserType('customer')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                userType === 'customer'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-soft'
              }`}
            >
              <UserGroupIcon className="h-4 w-4" /> Customer
            </button>
            <button
              type="button"
              onClick={() => setUserType('business_owner')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                userType === 'business_owner'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-soft'
              }`}
            >
              <BuildingOfficeIcon className="h-4 w-4" /> Business Owner
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-token bg-muted-token px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.first_name?.message}>
                <Input
                  icon={UserIcon}
                  placeholder="First name"
                  {...register('first_name', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                  })}
                />
              </Field>

              <Field label="Last name" error={errors.last_name?.message}>
                <Input
                  icon={UserIcon}
                  placeholder="Last name"
                  {...register('last_name', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                  })}
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email?.message}>
              <Input
                icon={EnvelopeIcon}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
            </Field>

            <Field label="Phone number" error={errors.phone_number?.message} optional>
              <Input
                icon={PhoneIcon}
                type="tel"
                placeholder="+998 90 000 00 00"
                {...register('phone_number', {
                  pattern: { value: /^[+]?[\d\s\-()]+$/, message: 'Invalid format' },
                })}
              />
            </Field>

            {userType === 'business_owner' && (
              <Field label="Business name" error={errors.business_name?.message}>
                <Input
                  icon={BuildingOfficeIcon}
                  placeholder="Your salon / business name"
                  {...register('business_name', {
                    required: 'Business name is required',
                    minLength: { value: 2, message: 'Min 2 characters' },
                  })}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="auth-input-password w-full rounded-xl border border-token bg-surface-token py-2.5 text-token placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Need uppercase, lowercase & number',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-muted"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm password" error={errors.password2?.message}>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    className="auth-input-password w-full rounded-xl border border-token bg-surface-token py-2.5 text-token placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...register('password2', {
                      required: 'Please confirm your password',
                      validate: (v) => v === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-muted"
                  >
                    {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-token text-brand focus:ring-primary"
                {...register('terms', { required: 'You must accept the terms' })}
              />
              <div>
                <label htmlFor="terms" className="text-sm text-soft">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-brand hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="font-medium text-brand hover:underline">Privacy Policy</Link>
                </label>
                {errors.terms && <p className="mt-0.5 text-xs text-danger">{errors.terms.message}</p>}
              </div>
            </div>

            {/* reCAPTCHA */}
            <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !recaptchaToken}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4" />
                  Create {userType === 'business_owner' ? 'Business' : 'Customer'} Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
