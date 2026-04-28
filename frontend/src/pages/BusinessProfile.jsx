import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  BuildingStorefrontIcon,
  CameraIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;

  const firstEntry = Object.entries(data)[0];
  if (!firstEntry) return fallback;

  const [field, value] = firstEntry;
  if (Array.isArray(value) && value.length > 0) {
    return `${field}: ${value[0]}`;
  }

  if (typeof value === 'string') {
    return `${field}: ${value}`;
  }

  return fallback;
};

const BusinessProfile = () => {
  const { checkAuthStatus } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    business_description: '',
    bio: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    instagram: '',
    facebook: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedSpaceFiles, setSelectedSpaceFiles] = useState([]);
  const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState([]);
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const [telegram, setTelegram] = useState({ link: null, connected: false });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [meResponse, profileResponse, galleryResult, tgResult] = await Promise.allSettled([
        userService.getMe(),
        userService.getProfile(),
        userService.getGalleryImages(),
        userService.getTelegramLink(),
      ]);

      if (meResponse.status !== 'fulfilled' || profileResponse.status !== 'fulfilled') {
        throw meResponse.status !== 'fulfilled' ? meResponse.reason : profileResponse.reason;
      }

      const me = meResponse.value.data || {};
      const profile = profileResponse.value.data || {};

      setFormData({
        first_name: me.first_name || '',
        last_name: me.last_name || '',
        email: me.email || '',
        phone_number: me.phone_number || '',
        business_name: profile.business_name || `${me.first_name || ''} ${me.last_name || ''}`.trim(),
        business_address: profile.business_address || profile.address || '',
        business_phone: profile.business_phone || me.phone_number || '',
        business_email: profile.business_email || me.email || '',
        business_website: profile.business_website || '',
        business_description: profile.business_description || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        postal_code: profile.postal_code || '',
        latitude: profile.latitude ?? '',
        longitude: profile.longitude ?? '',
        instagram: profile.instagram || '',
        facebook: profile.facebook || '',
      });
      setImagePreview(me.profile_picture || '');
      if (galleryResult.status === 'fulfilled') {
        setGalleryEnabled(true);
        setGalleryImages(galleryResult.value.data?.results || galleryResult.value.data || []);
      } else {
        setGalleryEnabled(false);
        setGalleryImages([]);
      }
      if (tgResult.status === 'fulfilled' && tgResult.value?.data) {
        setTelegram({ link: tgResult.value.data.link, connected: tgResult.value.data.connected });
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
      toast.error('Failed to load business profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await userService.disconnectTelegram();
      setTelegram((prev) => ({ ...prev, connected: false }));
      toast.success('Telegram disconnected.');
    } catch {
      toast.error('Failed to disconnect Telegram.');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGalleryFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageType = event.target.dataset.type || 'space';
    if (imageType === 'portfolio') {
      setSelectedPortfolioFiles((current) => [...current, ...files]);
    } else {
      setSelectedSpaceFiles((current) => [...current, ...files]);
    }
    event.target.value = '';
  };

  const handleRemovePendingGalleryFile = (fileName, fileSize, imageType) => {
    const setter = imageType === 'portfolio' ? setSelectedPortfolioFiles : setSelectedSpaceFiles;
    setter((current) =>
      current.filter((file) => !(file.name === fileName && file.size === fileSize))
    );
  };

  const handleDeleteGalleryImage = async (id) => {
    if (!galleryEnabled) return;

    try {
      await userService.deleteGalleryImage(id);
      setGalleryImages((current) => current.filter((item) => item.id !== id));
      toast.success('Photo removed.');
    } catch (error) {
      console.error('Failed to delete gallery image:', error);
      toast.error('Failed to delete photo.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const mePayload = new FormData();
      mePayload.append('first_name', formData.first_name);
      mePayload.append('last_name', formData.last_name);
      mePayload.append('email', formData.email);
      mePayload.append('phone_number', formData.phone_number);
      if (selectedImage) {
        mePayload.append('profile_picture', selectedImage);
      }

      const [meUpdateResponse, profileUpdateResponse] = await Promise.all([
        userService.updateMe(mePayload),
        userService.updateProfile({
          bio: formData.bio,
          address: formData.business_address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code,
          latitude: formData.latitude === '' ? null : formData.latitude,
          longitude: formData.longitude === '' ? null : formData.longitude,
          business_name: formData.business_name,
          business_address: formData.business_address,
          business_phone: formData.business_phone,
          business_email: formData.business_email,
          business_website: formData.business_website,
          business_description: formData.business_description,
          instagram: formData.instagram,
          facebook: formData.facebook,
        }),
      ]);

      const updatedMe = meUpdateResponse.data || {};
      const updatedProfile = profileUpdateResponse.data || {};

      setFormData((current) => ({
        ...current,
        first_name: updatedMe.first_name || '',
        last_name: updatedMe.last_name || '',
        email: updatedMe.email || '',
        phone_number: updatedMe.phone_number || '',
        business_name: updatedProfile.business_name || current.business_name,
        business_address: updatedProfile.business_address || updatedProfile.address || current.business_address,
        business_phone: updatedProfile.business_phone || current.business_phone,
        business_email: updatedProfile.business_email || current.business_email,
        business_website: updatedProfile.business_website || '',
        business_description: updatedProfile.business_description || '',
        bio: updatedProfile.bio || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || '',
        country: updatedProfile.country || '',
        postal_code: updatedProfile.postal_code || '',
        latitude: updatedProfile.latitude ?? current.latitude,
        longitude: updatedProfile.longitude ?? current.longitude,
        instagram: updatedProfile.instagram || '',
        facebook: updatedProfile.facebook || '',
      }));

      if (updatedMe.profile_picture) {
        setImagePreview(updatedMe.profile_picture);
      }

      const existingSpaceCount = galleryImages.filter((item) => item.image_type === 'space').length;
      const existingPortfolioCount = galleryImages.filter((item) => item.image_type === 'portfolio').length;

      if (galleryEnabled && (selectedSpaceFiles.length > 0 || selectedPortfolioFiles.length > 0)) {
        await Promise.all(
          [
            ...selectedSpaceFiles.map((file, index) => ({ file, imageType: 'space', order: existingSpaceCount + index })),
            ...selectedPortfolioFiles.map((file, index) => ({
              file,
              imageType: 'portfolio',
              order: existingPortfolioCount + index,
            })),
          ].map(({ file, imageType, order }) => {
            const payload = new FormData();
            payload.append('image', file);
            payload.append('image_type', imageType);
            payload.append('order', String(order));
            return userService.uploadGalleryImage(payload);
          }),
        );
      }

      await checkAuthStatus();
      setSelectedSpaceFiles([]);
      setSelectedPortfolioFiles([]);
      toast.success('Business profile updated.');
    } catch (error) {
      console.error('Failed to update business profile:', error);
      toast.error(getErrorMessage(error, 'Failed to update business profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4a90b0]" />
      </div>
    );
  }

  const spaceGalleryImages = galleryImages.filter((image) => image.image_type === 'space');
  const portfolioGalleryImages = galleryImages.filter((image) => image.image_type === 'portfolio');

  const renderPendingFiles = (files, imageType) =>
    files.length > 0 ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {files.map((file) => (
          <div
            key={`${imageType}-${file.name}-${file.size}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-gray-700 shadow-sm"
          >
            <span className="max-w-[160px] truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => handleRemovePendingGalleryFile(file.name, file.size, imageType)}
              className="text-gray-400 hover:text-gray-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    ) : null;

  const renderSavedGallery = (images) =>
    images.length > 0 ? (
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative overflow-hidden rounded-2xl bg-gray-100">
            <img src={image.image} alt={image.caption || 'Gallery'} className="h-24 w-full object-cover" />
            <button
              type="button"
              onClick={() => handleDeleteGalleryImage(image.id)}
              className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-4 text-sm text-gray-500">No photos uploaded yet.</p>
    );

  return (
    <div className="min-h-screen bg-[#f5f7f8] p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
          <p className="mt-2 text-gray-600">
            Update the photo, contact details, and business info shown on your public booking page.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="overflow-hidden rounded-[28px] bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={formData.business_name || 'Business'}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-gradient-to-br from-[#d9edf3] to-[#eef5f7] text-[#4a90b0]">
                  <BuildingStorefrontIcon className="h-16 w-16" />
                </div>
              )}
            </div>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900">
              <CameraIcon className="h-5 w-5" />
              Upload main photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload space photos</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add interior, exterior, waiting room, salon, studio, or location photos.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#4a90b0] px-4 py-2 text-sm font-semibold text-white">
                  <CameraIcon className="h-4 w-4" />
                  Add photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    data-type="space"
                    className="hidden"
                    onChange={handleGalleryFilesChange}
                  />
                </label>
              </div>
              {!galleryEnabled ? (
                <p className="mt-4 text-sm text-amber-700">
                  Gallery uploads are not available yet on the backend. The main profile still works.
                </p>
              ) : null}
              {renderPendingFiles(selectedSpaceFiles, 'space')}
              {galleryEnabled ? renderSavedGallery(spaceGalleryImages) : null}
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload portfolio photos</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add finished customer results, nails, brows, lashes, haircuts, tattoos, and other work samples.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                  <CameraIcon className="h-4 w-4" />
                  Add photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    data-type="portfolio"
                    className="hidden"
                    onChange={handleGalleryFilesChange}
                  />
                </label>
              </div>
              {!galleryEnabled ? (
                <p className="mt-4 text-sm text-amber-700">
                  Gallery uploads are not available yet on the backend. After migrations, this section will work.
                </p>
              ) : null}
              {renderPendingFiles(selectedPortfolioFiles, 'portfolio')}
              {galleryEnabled ? renderSavedGallery(portfolioGalleryImages) : null}
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <BuildingStorefrontIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <div>
                  <p className="text-sm text-gray-500">Business name</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.business_name || 'Not added'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-base text-gray-900">
                    {[formData.business_address, formData.postal_code, formData.city, formData.state]
                      .filter(Boolean)
                      .join(', ') || 'Not added'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <div>
                  <p className="text-sm text-gray-500">Business phone</p>
                  <p className="text-base text-gray-900">{formData.business_phone || 'Not added'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <div>
                  <p className="text-sm text-gray-500">Business email</p>
                  <p className="text-base text-gray-900">{formData.business_email || 'Not added'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GlobeAltIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="text-base text-gray-900">{formData.business_website || 'Not added'}</p>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            {/* City prominently at top — required for location filtering */}
            {!formData.city && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">City not set</p>
                  <p className="text-xs text-amber-700 mt-0.5">Customers searching by city won't find you. Fill in your city below.</p>
                </div>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Business name</label>
                <input name="business_name" value={formData.business_name} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Owner first name</label>
                <input name="first_name" value={formData.first_name} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Owner last name</label>
                <input name="last_name" value={formData.last_name} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Business address</label>
                <input name="business_address" value={formData.business_address} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Postal code</label>
                <input name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">City / Province</label>
                <input name="city" value={formData.city} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Latitude</label>
                <input
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="41.299500"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Longitude</label>
                <input
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="69.240100"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Business phone</label>
                <input name="business_phone" value={formData.business_phone} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Business email</label>
                <input name="business_email" value={formData.business_email} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Instagram URL</label>
                <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900">Facebook URL</label>
                <input name="facebook" value={formData.facebook} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Business website</label>
                <input name="business_website" value={formData.business_website} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">About us</label>
                <textarea name="business_description" rows={4} value={formData.business_description} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-900">Short bio</label>
                <textarea name="bio" rows={3} value={formData.bio} onChange={handleChange} className="w-full rounded-2xl border border-gray-300 px-4 py-3" />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="submit" disabled={saving} className="rounded-2xl bg-[#4a90b0] px-6 py-3 font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving...' : 'Save business profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Telegram connect card */}
        <div className={`mt-6 rounded-3xl border px-6 py-5 shadow-sm ${telegram.connected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${telegram.connected ? 'bg-emerald-100' : 'bg-[#e8f4fb]'}`}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill={telegram.connected ? '#10b981' : '#229ed9'}>
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Telegram Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {telegram.connected
                    ? 'Connected — you\'ll receive booking alerts and weekly reports'
                    : 'Connect to get booking alerts and weekly performance reports every Sunday'}
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
      </div>
    </div>
  );
};

export default BusinessProfile;
