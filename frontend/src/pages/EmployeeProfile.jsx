import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { scheduleService, userService } from '../services/api';
import {
  BriefcaseIcon,
  CameraIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const normalizeList = (response) => response.data?.results || response.data || [];

const formatHumanDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
};

const EmployeeProfile = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDuty, setSavingDuty] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    position: '',
    bio: '',
    max_daily_appointments: 10,
    appointment_buffer: 15,
  });
  const [telegram, setTelegram] = useState({ link: null, connected: false });
  const [duties, setDuties] = useState([]);
  const [dutyForm, setDutyForm] = useState({
    time_off_type: 'personal',
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '12:00',
    is_all_day: false,
    reason: '',
  });

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  const loadEmployeeProfile = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      const [meResult, employeeResult, dutiesResult, tgResult] = await Promise.allSettled([
        userService.getMe(),
        scheduleService.getMyEmployeeProfile(),
        scheduleService.getMyTimeOff(),
        userService.getTelegramLink(),
      ]);

      const me =
        meResult.status === 'fulfilled' && meResult.value?.data
          ? meResult.value.data
          : storedUser;
      const employee =
        employeeResult.status === 'fulfilled' && employeeResult.value?.data
          ? employeeResult.value.data
          : {};
      const dutiesData =
        dutiesResult.status === 'fulfilled'
          ? normalizeList(dutiesResult.value)
          : [];

      setProfileData({
        first_name: me.first_name || '',
        last_name: me.last_name || '',
        email: me.email || '',
        phone_number: me.phone_number || '',
        position: employee.position || '',
        bio: employee.bio || '',
        max_daily_appointments: employee.max_daily_appointments ?? 10,
        appointment_buffer: employee.appointment_buffer ?? 15,
      });
      setImagePreview(me.profile_picture || '');
      setDuties(dutiesData);
      if (tgResult.status === 'fulfilled' && tgResult.value?.data) {
        setTelegram({ link: tgResult.value.data.link, connected: tgResult.value.data.connected });
      }
    } catch (error) {
      console.error('Failed to load employee profile:', error);
      toast.error('Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  };

  const sortedDuties = useMemo(
    () =>
      [...duties].sort((a, b) =>
        `${a.start_date}-${a.start_time || ''}`.localeCompare(`${b.start_date}-${b.start_time || ''}`)
      ),
    [duties]
  );

  const handleDisconnectTelegram = async () => {
    try {
      await userService.disconnectTelegram();
      setTelegram((prev) => ({ ...prev, connected: false }));
      toast.success('Telegram disconnected.');
    } catch {
      toast.error('Failed to disconnect Telegram.');
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((current) => ({ ...current, [name]: value }));
  };

  const handleDutyChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDutyForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);

      const mePayload = new FormData();
      mePayload.append('first_name', profileData.first_name);
      mePayload.append('last_name', profileData.last_name);
      mePayload.append('email', profileData.email);
      mePayload.append('phone_number', profileData.phone_number);
      if (selectedImage) {
        mePayload.append('profile_picture', selectedImage);
      }

      await Promise.all([
        userService.updateMe(mePayload),
        scheduleService.updateMyEmployeeProfile({
          position: profileData.position,
          bio: profileData.bio,
          max_daily_appointments: Number(profileData.max_daily_appointments),
          appointment_buffer: Number(profileData.appointment_buffer),
        }),
      ]);

      toast.success('Employee profile updated.');
    } catch (error) {
      console.error('Failed to update employee profile:', error);
      toast.error('Failed to update employee profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const addDuty = async (event) => {
    event.preventDefault();
    try {
      setSavingDuty(true);
      const payload = {
        ...dutyForm,
        end_date: dutyForm.end_date || dutyForm.start_date,
        start_time: dutyForm.is_all_day ? null : dutyForm.start_time,
        end_time: dutyForm.is_all_day ? null : dutyForm.end_time,
      };
      const response = await scheduleService.createMyTimeOff(payload);
      setDuties((current) => [...current, response.data]);
      setDutyForm({
        time_off_type: 'personal',
        start_date: '',
        end_date: '',
        start_time: '08:00',
        end_time: '12:00',
        is_all_day: false,
        reason: '',
      });
      toast.success('Personal duty saved.');
    } catch (error) {
      console.error('Failed to save personal duty:', error);
      toast.error('Failed to save personal duty.');
    } finally {
      setSavingDuty(false);
    }
  };

  const deleteDuty = async (id) => {
    try {
      await scheduleService.deleteMyTimeOff(id);
      setDuties((current) => current.filter((item) => item.id !== id));
      toast.success('Personal duty removed.');
    } catch (error) {
      console.error('Failed to remove personal duty:', error);
      toast.error('Failed to remove personal duty.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4a90b0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
          <p className="mt-2 text-gray-600">
            Upload your profile photo, update your details, and block personal duty in advance.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f2f6] text-[#4a90b0]">
                {imagePreview ? (
                  <img src={imagePreview} alt={profileData.first_name || 'Employee'} className="h-full w-full object-cover" />
                ) : (
                  <BriefcaseIcon className="h-9 w-9" />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#4a90b0]">Staff Profile</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {profileData.first_name} {profileData.last_name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{profileData.position || 'Employee'}</p>
              </div>
            </div>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900">
              <CameraIcon className="h-5 w-5" />
              Upload profile photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <form onSubmit={saveProfile} className="mt-8 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">First name</label>
                  <input name="first_name" value={profileData.first_name} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Last name</label>
                  <input name="last_name" value={profileData.last_name} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Email</label>
                  <input name="email" value={profileData.email} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Phone number</label>
                  <input name="phone_number" value={profileData.phone_number} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Position</label>
                  <input name="position" value={profileData.position} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Break between appointments</label>
                  <input type="number" min="0" name="appointment_buffer" value={profileData.appointment_buffer} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Max daily appointments</label>
                  <input type="number" min="1" name="max_daily_appointments" value={profileData.max_daily_appointments} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Bio</label>
                <textarea name="bio" rows={4} value={profileData.bio} onChange={handleProfileChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>

              <p className="text-sm text-gray-500">
                Break between appointments means how many minutes the system should keep free after one booking before the next booking can start.
              </p>

              <button type="submit" disabled={savingProfile} className="rounded-2xl bg-[#111827] px-6 py-3 text-sm font-semibold text-white">
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </section>

          <section>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-[#4a90b0]" />
                <h3 className="text-lg font-semibold text-gray-900">Personal Duty / Unavailable Time</h3>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                Use this when you are busy, off-site, or unavailable. Those times will be blocked only for you.
              </p>

              <form onSubmit={addDuty} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">Start date</label>
                    <input type="date" name="start_date" value={dutyForm.start_date} onChange={handleDutyChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">End date</label>
                    <input type="date" name="end_date" value={dutyForm.end_date} onChange={handleDutyChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">Start time</label>
                    <input type="time" name="start_time" value={dutyForm.start_time} onChange={handleDutyChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" disabled={dutyForm.is_all_day} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">End time</label>
                    <input type="time" name="end_time" value={dutyForm.end_time} onChange={handleDutyChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" disabled={dutyForm.is_all_day} />
                  </div>
                </div>

                <label className="inline-flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" name="is_all_day" checked={dutyForm.is_all_day} onChange={handleDutyChange} />
                  All day
                </label>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Reason</label>
                  <textarea name="reason" rows={3} value={dutyForm.reason} onChange={handleDutyChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" required />
                </div>

                <button type="submit" disabled={savingDuty} className="rounded-2xl bg-[#ef6b57] px-5 py-3 text-sm font-semibold text-white">
                  {savingDuty ? 'Saving...' : 'Add personal duty'}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {sortedDuties.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No personal duty periods added yet.</div>
                ) : (
                  sortedDuties.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{formatHumanDate(item.start_date)}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.is_all_day ? 'All day' : `${String(item.start_time || '').slice(0, 5)} - ${String(item.end_time || '').slice(0, 5)}`}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{item.reason}</p>
                      </div>
                      <button type="button" onClick={() => deleteDuty(item.id)} className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Telegram connect card */}
            <div className={`rounded-3xl border px-5 py-4 shadow-sm ${telegram.connected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${telegram.connected ? 'bg-emerald-100' : 'bg-[#e8f4fb]'}`}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill={telegram.connected ? '#10b981' : '#229ed9'}>
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Telegram Notifications</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {telegram.connected
                        ? 'Connected — you\'ll receive booking alerts and a weekly summary every Sunday'
                        : 'Connect to get booking alerts and your weekly appointment summary'}
                    </p>
                  </div>
                </div>
                {telegram.connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectTelegram}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : telegram.link ? (
                  <a
                    href={telegram.link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#229ed9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a8bbf] transition-colors"
                  >
                    Connect Telegram
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
