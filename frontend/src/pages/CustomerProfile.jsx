import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CameraIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
    {children}
  </div>
);

const TextInput = (props) => (
  <input
    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    {...props}
  />
);

const CustomerProfile = () => {
  const { t } = useTranslation();
  const { user, checkAuthStatus } = useAuth();
  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegram, setTelegram] = useState({ link: null, connected: false });
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [me, profile] = await Promise.all([
          userService.getMe(),
          userService.getProfile(),
        ]);
        const m = me.data || {};
        const p = profile.data || {};
        setFormData({
          first_name: m.first_name || '',
          last_name: m.last_name || '',
          email: m.email || '',
          phone_number: m.phone_number || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          country: p.country || '',
          postal_code: p.postal_code || '',
        });
        if (m.profile_picture) setAvatarPreview(m.profile_picture);

        try {
          const tg = await userService.getTelegramLink();
          if (tg?.data) setTelegram({ link: tg.data.link, connected: tg.data.connected });
        } catch (tgErr) {
          console.warn('Telegram link fetch failed:', tgErr?.response?.status, tgErr?.response?.data);
        }
      } catch {
        toast.error(t('customer_profile.failed_load'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const handleDisconnectTelegram = async () => {
    try {
      setDisconnecting(true);
      await userService.disconnectTelegram();
      setTelegram((prev) => ({ ...prev, connected: false }));
      toast.success(t('customer_profile.telegram_disconnected_success'));
    } catch {
      toast.error(t('customer_profile.failed_disconnect'));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const mePayload = new FormData();
      mePayload.append('first_name', formData.first_name);
      mePayload.append('last_name', formData.last_name);
      mePayload.append('email', formData.email);
      if (formData.phone_number) mePayload.append('phone_number', formData.phone_number);
      if (avatarFile) mePayload.append('profile_picture', avatarFile);

      await Promise.all([
        userService.updateMe(mePayload),
        userService.updateProfile({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code,
        }),
      ]);

      await checkAuthStatus();
      setAvatarFile(null);
      toast.success(t('customer_profile.updated_success'));
    } catch {
      toast.error(t('customer_profile.failed_update'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0f1118]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const displayName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'Your Profile';
  const initials = [formData.first_name[0], formData.last_name[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1118]">
      {/* Top bar */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-5">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('customer_profile.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('customer_profile.subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Left — avatar card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white dark:border-slate-700 shadow-md">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-2xl font-bold text-blue-600 dark:text-blue-300">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <CameraIcon className="h-4 w-4 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('customer_profile.customer_role')}</p>
                {avatarFile && (
                  <p className="mt-2 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-0.5 text-xs text-blue-600 dark:text-blue-300">
                    {t('customer_profile.new_photo_selected')}
                  </p>
                )}
              </div>

              {/* Info summary */}
              <div className="mt-5 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-5">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <EnvelopeIcon className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{formData.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <PhoneIcon className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{formData.phone_number || t('customer_profile.not_set')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">
                    {[formData.city, formData.country].filter(Boolean).join(', ') || t('customer_profile.not_set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointments quick link */}
            <Link
              to="/appointments"
              className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('customer_profile.my_appointments')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('customer_profile.view_upcoming_past')}</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </Link>

            {/* Telegram connect card */}
            <div className={`rounded-2xl border px-5 py-4 shadow-sm ${telegram.connected ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${telegram.connected ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-[#e8f4fb] dark:bg-[#1a2e40]'}`}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill={telegram.connected ? '#10b981' : '#229ed9'}>
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.24 13.4l-2.948-.924c-.642-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.836.959z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Telegram</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {telegram.connected ? t('customer_profile.telegram_connected') : t('customer_profile.telegram_disconnected')}
                  </p>
                </div>
                {telegram.connected && (
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                )}
              </div>

              {telegram.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  disabled={disconnecting}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60 transition-colors"
                >
                  {disconnecting ? t('customer_profile.disconnecting') : t('customer_profile.disconnect_telegram')}
                </button>
              ) : telegram.link ? (
                <a
                  href={telegram.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ed9] py-2 text-xs font-bold text-white hover:bg-[#1a8bbf] transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  {t('customer_profile.connect_telegram')}
                </a>
              ) : (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">{t('customer_profile.bot_not_configured')}</p>
              )}
            </div>
          </div>

          {/* Right — edit form */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-slate-900 dark:text-white">{t('customer_profile.personal_information')}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('form.first_name')}>
                  <TextInput name="first_name" value={formData.first_name} onChange={handleChange} placeholder={t('form.first_name')} />
                </Field>
                <Field label={t('form.last_name')}>
                  <TextInput name="last_name" value={formData.last_name} onChange={handleChange} placeholder={t('form.last_name')} />
                </Field>
              </div>

              <Field label={t('form.email_address')}>
                <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" />
              </Field>

              <Field label={t('form.phone_number')}>
                <TextInput type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+998 90 000 00 00" />
              </Field>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('customer_profile.address_section')}</h3>
                <div className="space-y-4">
                  <Field label={t('customer_profile.street_address')}>
                    <TextInput name="address" value={formData.address} onChange={handleChange} placeholder={t('customer_profile.street_address')} />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('profile.city')}>
                      <TextInput name="city" value={formData.city} onChange={handleChange} placeholder="Toshkent" />
                    </Field>
                    <Field label={t('customer_profile.region')}>
                      <TextInput name="state" value={formData.state} onChange={handleChange} placeholder={t('customer_profile.region')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('profile.address')}>
                      <TextInput name="country" value={formData.country} onChange={handleChange} placeholder="Uzbekistan" />
                    </Field>
                    <Field label={t('customer_profile.postal_code')}>
                      <TextInput name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="100000" />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('customer_profile.saving')}
                  </>
                ) : (
                  t('customer_profile.save_changes')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
