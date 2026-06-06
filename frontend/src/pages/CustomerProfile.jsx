import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fixMediaUrl, userService } from '../services/api';
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
    <label className="mb-1.5 block text-sm font-medium text-soft">{label}</label>
    {children}
  </div>
);

const TextInput = (props) => (
  <input
    className="w-full rounded-xl border border-token bg-surface-token px-3 py-2.5 text-token placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    {...props}
  />
);

const CustomerProfile = () => {
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
        if (m.profile_picture) setAvatarPreview(fixMediaUrl(m.profile_picture));

        // Load Telegram status separately so a failure doesn't break the profile
        try {
          const tg = await userService.getTelegramLink();
          if (tg?.data) setTelegram({ link: tg.data.link, connected: tg.data.connected });
        } catch {}
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleDisconnectTelegram = async () => {
    try {
      setDisconnecting(true);
      await userService.disconnectTelegram();
      setTelegram((prev) => ({ ...prev, connected: false }));
      toast.success('Telegram disconnected.');
    } catch {
      toast.error('Failed to disconnect Telegram.');
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
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page flex min-h-screen items-center justify-center">
        <div className="app-spinner" />
      </div>
    );
  }

  const displayName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'Your Profile';
  const initials = [formData.first_name[0], formData.last_name[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="app-page p-0">
      {/* Top bar */}
      <div className="border-b border-token bg-surface-token px-4 py-6 backdrop-blur-xl border-token bg-surface-token">
        <div className="mx-auto max-w-4xl">
          <h1 className="app-title">My Profile</h1>
          <p className="app-subtitle">Manage your personal information and contact details</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Left — avatar card */}
          <div className="space-y-4">
            <div className="app-card-pad">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted-token text-2xl font-bold text-brand">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md hover:bg-primary transition-colors"
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
                <p className="text-base font-bold text-token">{displayName}</p>
                <p className="text-xs text-muted">Customer</p>
                {avatarFile && (
                  <p className="mt-2 rounded-full bg-muted-token px-3 py-0.5 text-xs text-brand">
                    New photo selected
                  </p>
                )}
              </div>

              {/* Info summary */}
              <div className="mt-5 space-y-3 border-t border-token pt-5">
                <div className="flex items-center gap-3 text-sm text-soft">
                  <EnvelopeIcon className="h-4 w-4 flex-shrink-0 text-muted" />
                  <span className="truncate">{formData.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-soft">
                  <PhoneIcon className="h-4 w-4 flex-shrink-0 text-muted" />
                  <span>{formData.phone_number || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-soft">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0 text-muted" />
                  <span className="truncate">
                    {[formData.city, formData.country].filter(Boolean).join(', ') || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointments quick link */}
            <Link
              to="/appointments"
              className="app-card flex items-center justify-between px-5 py-4 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted-token">
                  <CalendarDaysIcon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-token">My Appointments</p>
                  <p className="text-xs text-muted">View upcoming & past</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-muted" />
            </Link>

            {/* Telegram connect card */}
            <div className={`app-card px-5 py-4 ${telegram.connected ? 'border-token bg-muted-token' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                {/* Telegram logo */}
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted-token ${telegram.connected ? 'text-success' : 'text-brand'}`}>
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.24 13.4l-2.948-.924c-.642-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.836.959z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-token">Telegram Notifications</p>
                  <p className="text-xs text-muted">
                    {telegram.connected ? 'Connected — you\'ll receive booking alerts' : 'Get booking alerts on Telegram'}
                  </p>
                </div>
                {telegram.connected && (
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-success" />
                )}
              </div>

              {telegram.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  disabled={disconnecting}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              ) : telegram.link ? (
                <a
                  href={telegram.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full py-2 text-xs"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  Connect Telegram
                </a>
              ) : (
                <p className="text-center text-xs text-muted">Bot not configured yet</p>
              )}
            </div>
          </div>

          {/* Right — edit form */}
          <form onSubmit={handleSubmit} className="app-card-pad">
            <h2 className="mb-5 text-base font-semibold text-token text-token">Personal Information</h2>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <TextInput name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First name" />
                </Field>
                <Field label="Last name">
                  <TextInput name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last name" />
                </Field>
              </div>

              <Field label="Email address">
                <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@email.com" />
              </Field>

              <Field label="Phone number">
                <TextInput type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+998 90 000 00 00" />
              </Field>

              <div className="border-t border-token pt-4">
                <h3 className="mb-4 text-sm font-semibold text-soft">Address</h3>
                <div className="space-y-4">
                  <Field label="Street address">
                    <TextInput name="address" value={formData.address} onChange={handleChange} placeholder="Street address" />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="City">
                      <TextInput name="city" value={formData.city} onChange={handleChange} placeholder="Toshkent" />
                    </Field>
                    <Field label="Region">
                      <TextInput name="state" value={formData.state} onChange={handleChange} placeholder="Region" />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Country">
                      <TextInput name="country" value={formData.country} onChange={handleChange} placeholder="Uzbekistan" />
                    </Field>
                    <Field label="Postal code">
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
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save changes'
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
