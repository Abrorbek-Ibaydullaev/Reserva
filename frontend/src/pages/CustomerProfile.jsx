import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const CustomerProfile = () => {
  const { checkAuthStatus } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meResponse, profileResponse] = await Promise.all([
        userService.getMe(),
        userService.getProfile(),
      ]);

      const me = meResponse.data || {};
      const profile = profileResponse.data || {};

      setFormData({
        first_name: me.first_name || '',
        last_name: me.last_name || '',
        email: me.email || '',
        phone_number: me.phone_number || '',
        bio: profile.bio || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        postal_code: profile.postal_code || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await Promise.all([
        userService.updateMe({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
        }),
        userService.updateProfile({
          bio: formData.bio,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code,
        }),
      ]);

      await checkAuthStatus();
      toast.success('Profile updated.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dff3f4,_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f7_100%)] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <section className="rounded-3xl bg-[#102531] text-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <UserCircleIcon className="h-14 w-14 text-[#99d4db]" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-[#99d4db]">
                  Customer Profile
                </p>
                <h1 className="text-3xl font-bold mt-2">
                  {formData.first_name} {formData.last_name}
                </h1>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-[#99d4db] mt-1 mr-3" />
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <p className="text-lg">{formData.email || 'Not added'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-[#99d4db] mt-1 mr-3" />
                <div>
                  <p className="text-sm text-white/60">Phone</p>
                  <p className="text-lg">{formData.phone_number || 'Not added'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-[#99d4db] mt-1 mr-3" />
                <div>
                  <p className="text-sm text-white/60">Location</p>
                  <p className="text-lg">
                    {[formData.city, formData.state, formData.country].filter(Boolean).join(', ') || 'Not added'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-[#99d4db]">
                About
              </p>
              <p className="mt-4 text-lg leading-8 text-white/85">
                {formData.bio || 'Add a short bio, preferences, or helpful booking notes here.'}
              </p>
            </div>
          </section>

          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-gray-600 mt-2">
                Keep your contact details current so businesses can reach you about bookings.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    First name
                  </label>
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Last name
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone
                  </label>
                  <input
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Address
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    State
                  </label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Country
                  </label>
                  <input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Postal code
                  </label>
                  <input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#4a90b0] px-6 py-3 text-white font-semibold hover:bg-[#3d7691] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
