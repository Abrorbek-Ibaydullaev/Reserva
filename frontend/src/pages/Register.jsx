import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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

const Field = ({ label, error, children, optional }) => (
  <div>
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
      {label}
      {optional && <span className="text-xs text-slate-400">(optional)</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    )}
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${Icon ? 'pl-10 pr-3' : 'px-3'}`}
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const onSubmit = async (data) => {
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
        } else if (msg?.email) {
          setError(Array.isArray(msg.email) ? msg.email[0] : msg.email);
        } else if (msg?.detail) {
          setError(msg.detail);
        } else {
          setError('Registration failed. Please check your details and try again.');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-500 p-12 text-white lg:flex lg:w-[42%]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Reserva</span>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Start managing your<br />bookings today
          </h1>
          <p className="mt-4 text-blue-100">
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
                <span className="text-sm text-blue-50">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-blue-200">© {new Date().getFullYear()} Reserva. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 lg:items-center lg:px-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Reserva</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>

          {/* Account type toggle */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setUserType('customer')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                userType === 'customer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserGroupIcon className="h-4 w-4" /> Customer
            </button>
            <button
              type="button"
              onClick={() => setUserType('business_owner')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                userType === 'business_owner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BuildingOfficeIcon className="h-4 w-4" /> Business Owner
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm password" error={errors.password2?.message}>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    {...register('password2', {
                      required: 'Please confirm your password',
                      validate: (v) => v === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register('terms', { required: 'You must accept the terms' })}
              />
              <div>
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-blue-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="font-medium text-blue-600 hover:underline">Privacy Policy</Link>
                </label>
                {errors.terms && <p className="mt-0.5 text-xs text-red-600">{errors.terms.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
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
