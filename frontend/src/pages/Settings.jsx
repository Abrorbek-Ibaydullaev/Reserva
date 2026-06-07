import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { userService, fixMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { checkAuthStatus } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userService.getMe();
        const user = response.data;
        setProfile({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone_number: user.phone_number || '',
        });
        setPreview(fixMediaUrl(user.profile_picture) || '');
      } catch {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    setProfilePhoto(file || null);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const payload = new FormData();
      payload.append('first_name', profile.first_name);
      payload.append('last_name', profile.last_name);
      payload.append('phone_number', profile.phone_number);
      if (profilePhoto) {
        payload.append('profile_picture', profilePhoto);
      }

      await userService.updateMe(payload);
      await checkAuthStatus();
      toast.success('Profile settings saved.');
    } catch {
      toast.error('Failed to save profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  };

  const savePassword = async (event) => {
    event.preventDefault();

    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await userService.changeMyPassword({
        old_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      toast.success('Password changed successfully.');
    } catch (error) {
      const detail =
        error.response?.data?.old_password?.[0] ||
        error.response?.data?.new_password?.[0] ||
        'Failed to change password.';
      toast.error(detail);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your profile details and account security.
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {[
          ['profile', 'Profile'],
          ['security', 'Security'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeSection === key
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'profile' ? (
        <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-5">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100">
              {preview ? (
                <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                  {(profile.first_name[0] || profile.last_name[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
              Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">First name</span>
              <input name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Last name</span>
              <input name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone number</span>
              <input name="phone_number" value={profile.phone_number} onChange={handleProfileChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="+998 90 000 00 00" />
            </label>
          </div>

          <button type="submit" disabled={savingProfile} className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      ) : (
        <form onSubmit={savePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Current password</span>
              <input type="password" name="current_password" value={passwords.current_password} onChange={handlePasswordChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">New password</span>
              <input type="password" name="new_password" value={passwords.new_password} onChange={handlePasswordChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" required minLength={8} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm new password</span>
              <input type="password" name="confirm_password" value={passwords.confirm_password} onChange={handlePasswordChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white" required minLength={8} />
            </label>
          </div>

          <button type="submit" disabled={savingPassword} className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {savingPassword ? 'Saving...' : 'Change password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Settings;
