import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import GoogleAuthButton from '../components/GoogleAuthButton';

// Business owners register on the dedicated biz app (biz.reserva.services).
const BIZ_URL = import.meta.env.VITE_BIZ_URL || 'https://biz.reserva.services';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// Common countries with flag emoji and dial code
const COUNTRIES = [
  { code: 'UZ', flag: '🇺🇿', dial: '+998', name: 'Uzbekistan' },
  { code: 'RU', flag: '🇷🇺', dial: '+7',   name: 'Russia' },
  { code: 'KZ', flag: '🇰🇿', dial: '+7',   name: 'Kazakhstan' },
  { code: 'KG', flag: '🇰🇬', dial: '+996', name: 'Kyrgyzstan' },
  { code: 'TJ', flag: '🇹🇯', dial: '+992', name: 'Tajikistan' },
  { code: 'TM', flag: '🇹🇲', dial: '+993', name: 'Turkmenistan' },
  { code: 'AZ', flag: '🇦🇿', dial: '+994', name: 'Azerbaijan' },
  { code: 'TR', flag: '🇹🇷', dial: '+90',  name: 'Turkey' },
  { code: 'US', flag: '🇺🇸', dial: '+1',   name: 'USA' },
  { code: 'GB', flag: '🇬🇧', dial: '+44',  name: 'UK' },
  { code: 'DE', flag: '🇩🇪', dial: '+49',  name: 'Germany' },
  { code: 'CN', flag: '🇨🇳', dial: '+86',  name: 'China' },
  { code: 'KR', flag: '🇰🇷', dial: '+82',  name: 'South Korea' },
  { code: 'AE', flag: '🇦🇪', dial: '+971', name: 'UAE' },
];

const formatUZ = (digits) => {
  const d = digits.slice(0, 9);
  let out = d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out;
};

const PhoneInput = ({ onDigitsChange }) => {
  const { t } = useTranslation();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState('');
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  const isUZ = country.code === 'UZ';
  const maxDigits = isUZ ? 9 : 15;
  const showError = touched && digits.length > 0 && digits.length < maxDigits;

  const handleNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
    setDigits(raw);
    const formatted = isUZ ? formatUZ(raw) : raw;
    setDisplay(formatted);
    onDigitsChange(raw.length > 0 ? `${country.dial}${raw}` : '');
  };

  const handleCountrySelect = (c) => {
    setCountry(c);
    setOpen(false);
    setDigits('');
    setDisplay('');
    setTouched(false);
    onDigitsChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div>
      <div className={`relative flex rounded-xl border bg-white dark:bg-slate-800 transition-shadow ${showError ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'}`}>
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 rounded-l-xl border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="tabular-nums text-slate-600 dark:text-slate-300">{country.dial}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Number input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          placeholder={isUZ ? '90 123 45 67' : t('form.phone_number')}
          value={display}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-2.5 tabular-nums text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />

        {/* Country dropdown */}
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${c.code === country.code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-slate-400 dark:text-slate-500">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showError && (
        <p className="mt-1 text-xs text-red-600">
          {t('errors.digits_remaining', { count: maxDigits - digits.length })}
        </p>
      )}
    </div>
  );
};

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Field = ({ label, error, children, optional }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {optional && <span className="text-xs text-slate-400 dark:text-slate-500">({t('common.optional')})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

const Input = React.forwardRef(({ icon: Icon, ...props }, ref) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    )}
    <input
      ref={ref}
      className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${Icon ? 'pl-10 pr-3' : 'px-3'}`}
      {...props}
    />
  </div>
));

const Register = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userType] = useState('customer'); // main site register is customer-only
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const recaptchaRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');
  const hasRecaptcha = Boolean(RECAPTCHA_SITE_KEY);
  const clearRegistrationErrors = () => {
    setError('');
    setEmailError('');
  };

  const extractErrorMessage = (message, fallback) => {
    if (!message) return fallback;
    if (typeof message === 'string') return message;
    if (typeof message.detail === 'string') return message.detail;
    if (Array.isArray(message.detail)) return message.detail[0] || fallback;
    const firstField = Object.values(message)[0];
    if (Array.isArray(firstField)) return firstField[0] || fallback;
    if (typeof firstField === 'string') return firstField;
    return fallback;
  };

  const onSubmit = async (data) => {
    if (hasRecaptcha && !recaptchaToken) {
      setError(t('auth.recaptcha_required_register'));
      return;
    }

    if (phoneNumber && phoneNumber.replace(/\D/g, '').length < 11) {
      setPhoneError(t('errors.phone_incomplete'));
      return;
    }
    setPhoneError('');

    try {
      setIsLoading(true);
      clearRegistrationErrors();

      const payload = {
        email: data.email,
        password: data.password,
        password2: data.password2,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: phoneNumber || '',
        user_type: userType,
        recaptcha_token: recaptchaToken,
      };

      const result = await authRegister(payload);

      if (result.success) {
        navigate('/', { replace: true });
      } else {
        const msg = result.message;
        if (result.status === 409) {
          setEmailError(
            <>
              {t('auth.email_already_registered')}{' '}
              <Link to="/login" className="font-semibold text-red-700 underline">
                {t('auth.sign_in')}
              </Link>.
            </>
          );
        } else {
          setError(
            extractErrorMessage(msg, t('auth.registration_failed'))
          );
        }
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch {
      toast.error(t('auth.unexpected_error'));
      setError(t('auth.unexpected_error'));
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Create an Account"
        description="Join Reserva today. Create a free account to book appointments, or register your business to start accepting online bookings in Uzbekistan."
        path="/register"
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
            {t('auth.start_managing')}
          </h1>
          <p className="mt-4 text-blue-100">
            {t('auth.start_managing_subtitle')}
          </p>

          <div className="mt-10 space-y-4">
            {[
              { emoji: '📅', key: 'feature_realtime' },
              { emoji: '🔔', key: 'feature_confirmations' },
              { emoji: '📊', key: 'feature_dashboard' },
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
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 lg:items-center lg:px-12">
        <div className="w-full max-w-lg">
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

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.create_account')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('auth.already_have_account')}{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              {t('auth.sign_in')}
            </Link>
          </p>

          {/* Business owners register on the dedicated biz app. */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('auth.registering_a_business', { defaultValue: 'Registering a business?' })}{' '}
            <a href={`${BIZ_URL}/register`} className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">
              <BuildingOfficeIcon className="h-4 w-4" /> {t('home.add_business', { defaultValue: 'Add your business' })}
            </a>
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('form.first_name')} error={errors.first_name?.message}>
                <Input
                  icon={UserIcon}
                  placeholder={t('form.first_name')}
                  {...register('first_name', {
                    required: t('errors.required_short'),
                    minLength: { value: 2, message: t('errors.name_min_2') },
                    onChange: clearRegistrationErrors,
                  })}
                />
              </Field>

              <Field label={t('form.last_name')} error={errors.last_name?.message}>
                <Input
                  icon={UserIcon}
                  placeholder={t('form.last_name')}
                  {...register('last_name', {
                    required: t('errors.required_short'),
                    minLength: { value: 2, message: t('errors.name_min_2') },
                    onChange: clearRegistrationErrors,
                  })}
                />
              </Field>
            </div>

            <Field label={t('form.email_address')} error={errors.email?.message || emailError}>
              <Input
                icon={EnvelopeIcon}
                type="email"
                placeholder={t('auth.email_placeholder')}
                autoComplete="email"
                {...register('email', {
                  required: t('errors.email_required'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('errors.invalid_email') },
                  onChange: clearRegistrationErrors,
                })}
              />
            </Field>

            <Field label={t('form.phone_number')} error={phoneError} optional>
              <PhoneInput onDigitsChange={setPhoneNumber} />
            </Field>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('form.password')} error={errors.password?.message}>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('form.password_placeholder_min8')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    {...register('password', {
                      required: t('errors.password_required'),
                      minLength: { value: 8, message: t('errors.password_min_8') },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: t('errors.password_pattern'),
                      },
                      onChange: clearRegistrationErrors,
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label={t('form.confirm_password')} error={errors.password2?.message}>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder={t('form.repeat_password')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    {...register('password2', {
                      required: t('errors.confirm_password_required'),
                      validate: (v) => v === password || t('errors.passwords_no_match'),
                      onChange: clearRegistrationErrors,
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:hover:text-slate-300"
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
                {...register('terms', { required: t('errors.terms_required') })}
              />
              <div>
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-300">
                  {t('form.terms_agree')}{' '}
                  <Link to="/terms" className="font-medium text-blue-600 hover:underline">{t('form.terms_of_service')}</Link>
                  {' '}{t('common.and')}{' '}
                  <Link to="/privacy" className="font-medium text-blue-600 hover:underline">{t('form.privacy_policy')}</Link>
                </label>
                {errors.terms && <p className="mt-0.5 text-xs text-red-600">{errors.terms.message}</p>}
              </div>
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
                  {t('auth.creating_account')}
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4" />
                  {userType === 'business_owner' ? t('auth.create_business_account') : t('auth.create_customer_account')}
                </>
              )}
            </button>
          </form>

          {/* Divider + Sign up with Google */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs font-medium text-slate-400">{t('auth.or', { defaultValue: 'or' })}</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>
          <GoogleAuthButton text="signup_with" onError={setError} />
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
