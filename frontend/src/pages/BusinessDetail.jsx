import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { appointmentService, scheduleService, userService, serviceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import BusinessMap from '../components/Map';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronRightIcon as ChevronRightMiniIcon,
  DevicePhoneMobileIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BOOKING_DRAFT_KEY = 'booking_draft';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const normalizeMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`;
  return `${API_ORIGIN}/${value.replace(/^\/+/, '')}`;
};

const getDraft = () => {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveDraft = (draft) => { sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft)); };
const clearDraft = () => { sessionStorage.removeItem(BOOKING_DRAFT_KEY); };
const normalizeList = (response) => response.data?.results || response.data || [];
const getToday = () => new Date().toISOString().split('T')[0];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const displayDayOrder = [0, 1, 2, 3, 4, 5, 6];
const schemaDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Compact SVG social icons
const SocialIcon = ({ platform }) => {
  if (platform === 'instagram') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
  if (platform === 'facebook') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  if (platform === 'twitter') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  if (platform === 'linkedin') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  if (platform === 'youtube') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
  if (platform === 'tiktok') return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
  return null;
};

const BusinessDetail = () => {
  const { businessId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  const [draft, setDraft] = useState(() => getDraft());
  const [orderEmployees, setOrderEmployees] = useState([]);
  const [staffPreviewSlots, setStaffPreviewSlots] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [businessEmployees, setBusinessEmployees] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [showFullWeek, setShowFullWeek] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);
  const [activeGallerySection, setActiveGallerySection] = useState('space');
  const isBusinessOwner = user?.user_type === 'business_owner';
  const isOwnBusiness = isBusinessOwner && user?.id === Number(businessId);

  useEffect(() => { fetchBusinessAndServices(); }, [businessId]);
  useEffect(() => { loadBusinessExtras(); }, [businessId, isAuthenticated, isOwnBusiness]);
  useEffect(() => { setDraft(getDraft()); }, [location.key]);

  const activeDraftService = useMemo(() => {
    if (!draft?.services?.length) return null;
    return (
      draft.services.find((item) => String(item.id) === String(draft.activeServiceId)) ||
      draft.services[0]
    );
  }, [draft]);

  useEffect(() => {
    const loadOrderSidebar = async () => {
      if (!activeDraftService || String(draft?.businessId) !== String(businessId)) {
        setOrderEmployees([]);
        setStaffPreviewSlots({});
        return;
      }
      try {
        setStaffLoading(true);
        const employeesResponse = await scheduleService.getEmployees({ business_owner: businessId, is_active: true });
        const employees = normalizeList(employeesResponse).filter((employee) => {
          const assignedServices = employee.services_details || [];
          return assignedServices.length === 0 || assignedServices.some((item) => String(item.id) === String(activeDraftService.id));
        });
        setOrderEmployees(employees);
        const previews = {};
        await Promise.all(employees.map(async (employee) => {
          try {
            const slotsResponse = await appointmentService.getAvailableSlots({ service_id: activeDraftService.id, date: getToday(), employee_id: employee.id });
            const slots = Array.isArray(slotsResponse.data) ? slotsResponse.data : slotsResponse.data?.slots || [];
            previews[employee.id] = slots[0]?.start_time || null;
          } catch { previews[employee.id] = null; }
        }));
        setStaffPreviewSlots(previews);
      } catch (err) {
        console.error('Error loading order sidebar:', err);
        setOrderEmployees([]);
        setStaffPreviewSlots({});
      } finally { setStaffLoading(false); }
    };
    loadOrderSidebar();
  }, [activeDraftService, businessId, draft]);

  const fetchBusinessAndServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const businessResponse = await userService.getBusinesses();
      const businesses = businessResponse.data.results || businessResponse.data;
      const foundBusiness = businesses.find(b => b.id === parseInt(businessId));
      if (!foundBusiness) throw new Error('Business not found');
      setBusiness(foundBusiness);
      const bundledServices = foundBusiness.services || [];
      if (bundledServices.length > 0) {
        setServices(bundledServices);
      } else {
        const servicesResponse = await serviceService.getAllServices({ business_owner: businessId });
        setServices(servicesResponse.data.results || servicesResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching business details:', err);
      setError('Failed to load business details. Please try again later.');
    } finally { setLoading(false); }
  };

  const loadBusinessExtras = async () => {
    try {
      const [employeesResponse, hoursResponse] = await Promise.all([
        isAuthenticated
          ? scheduleService.getEmployees({ business_owner: businessId, is_active: true })
          : Promise.resolve({ data: [] }),
        scheduleService.getBusinessHours({ business_owner: businessId }),
      ]);
      setBusinessEmployees(normalizeList(employeesResponse));
      setBusinessHours(normalizeList(hoursResponse));
    } catch (error) {
      console.error('Failed to load business extras:', error);
      setBusinessEmployees([]);
      setBusinessHours([]);
    }
  };

  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price);
    } catch { return `$${price}`; }
  };
  const formatDuration = (mins) => {
    if (!mins) return '';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  const hasBookingDraftForBusiness = draft && String(draft.businessId) === String(businessId) && (draft.services || []).length > 0;
  const draftServiceIds = useMemo(() => new Set((draft?.services || []).map((item) => item.id)), [draft]);
  const filteredServices = services.filter((s) => s.name?.toLowerCase().includes(filters.search.toLowerCase()));
  const totalDraftAmount = (draft?.services || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

  const spaceGallery = useMemo(() => {
    return (business?.cover_images || []).map((image) => normalizeMediaUrl(image)).filter((value, index, array) => value && array.indexOf(value) === index);
  }, [business?.cover_images]);

  const portfolioGallery = useMemo(() => {
    return [
      ...((business?.gallery_images || [])
        .filter((item) => item.image_type === 'portfolio')
        .map((item) => normalizeMediaUrl(item.image))),
      ...(services || []).flatMap((service) => [
        normalizeMediaUrl(service.thumbnail),
        ...(service.images || []).map((img) => normalizeMediaUrl(img)),
      ]),
    ].filter((value, index, array) => value && array.indexOf(value) === index);
  }, [business?.gallery_images, services]);

  const currentGalleryImages = activeGallerySection === 'portfolio' ? portfolioGallery : spaceGallery;
  const primaryImage = spaceGallery[0] || null;
  const thumbnailImages = portfolioGallery.slice(0, 6);
  const orderedGalleryImages = activeGalleryIndex === null
    ? currentGalleryImages
    : [...currentGalleryImages.slice(activeGalleryIndex), ...currentGalleryImages.slice(0, activeGalleryIndex)];

  const openGalleryAt = (index, section = 'space') => { setActiveGallerySection(section); setActiveGalleryIndex(index); };
  const closeGallery = () => { setActiveGalleryIndex(null); };
  const showPreviousImage = () => { setActiveGalleryIndex((current) => current === null ? null : (current - 1 + currentGalleryImages.length) % currentGalleryImages.length); };
  const showNextImage = () => { setActiveGalleryIndex((current) => current === null ? null : (current + 1) % currentGalleryImages.length); };

  useEffect(() => {
    if (activeGalleryIndex === null) { document.body.style.removeProperty('overflow'); return undefined; }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveGalleryIndex(null);
      else if (event.key === 'ArrowLeft') showPreviousImage();
      else if (event.key === 'ArrowRight') showNextImage();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.removeProperty('overflow'); window.removeEventListener('keydown', handleKeyDown); };
  }, [activeGalleryIndex, currentGalleryImages.length]);

  const businessReviewStats = useMemo(() => {
    const totals = (services || []).reduce((accumulator, service) => {
      const reviewCount = Number(service.review_count || 0);
      const averageRating = Number(service.average_rating || 0);
      accumulator.reviewCount += reviewCount;
      accumulator.weightedRating += averageRating * reviewCount;
      return accumulator;
    }, { reviewCount: 0, weightedRating: 0 });
    return { averageRating: totals.reviewCount > 0 ? totals.weightedRating / totals.reviewCount : 0, reviewCount: totals.reviewCount };
  }, [services]);

  const businessAddressLine = useMemo(() => {
    const profile = business?.profile || {};
    return [profile.business_address, profile.address, profile.postal_code || profile.zip_code, profile.city, profile.state || profile.province].filter(Boolean).join(', ');
  }, [business]);

  const profileData = business?.profile || {};
  const publicBusinessName = profileData.business_name || business?.full_name || '';

  const todayHours = useMemo(() => {
    const today = new Date().getDay();
    const normalizedDay = today === 0 ? 6 : today - 1;
    return businessHours.find((item) => item.day_of_week === normalizedDay) || null;
  }, [businessHours]);
  const todayDayIndex = useMemo(() => { const today = new Date().getDay(); return today === 0 ? 6 : today - 1; }, []);
  const orderedBusinessHours = useMemo(() => {
    const byDay = new Map(businessHours.map((item) => [item.day_of_week, item]));
    return displayDayOrder.map((dayIndex) => byDay.get(dayIndex)).filter(Boolean);
  }, [businessHours]);

  const groupedOpeningHoursSpecification = useMemo(() => {
    const groups = new Map();
    businessHours.forEach((hour) => {
      if (!hour?.is_open) return;
      const opens = hour.is_24_hours ? '00:00' : hour.opening_time?.slice(0, 5);
      const closes = hour.is_24_hours ? '23:59' : hour.closing_time?.slice(0, 5);
      if (!opens || !closes) return;
      const key = `${opens}-${closes}`;
      const current = groups.get(key) || { '@type': 'OpeningHoursSpecification', dayOfWeek: [], opens, closes };
      current.dayOfWeek.push(schemaDayLabels[hour.day_of_week]);
      groups.set(key, current);
    });
    return Array.from(groups.values());
  }, [businessHours]);

  const localBusinessSchema = useMemo(() => {
    if (!business) return null;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: publicBusinessName || business?.full_name || 'Business',
      image: normalizeMediaUrl(business?.profile_picture) || undefined,
      telephone: profileData.business_phone || business?.phone_number || undefined,
      email: profileData.business_email || business?.email || undefined,
      address: businessAddressLine ? {
        '@type': 'PostalAddress',
        streetAddress: profileData.business_address || profileData.address || undefined,
        postalCode: profileData.postal_code || profileData.zip_code || undefined,
        addressLocality: profileData.city || undefined,
        addressRegion: profileData.state || profileData.province || undefined,
        addressCountry: profileData.country || undefined,
      } : undefined,
      sameAs: [profileData.facebook, profileData.instagram].filter(Boolean),
      openingHoursSpecification: groupedOpeningHoursSpecification,
    };
    if (businessReviewStats.reviewCount > 0) {
      schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(businessReviewStats.averageRating.toFixed(1)), reviewCount: businessReviewStats.reviewCount };
    }
    return schema;
  }, [business, publicBusinessName, profileData, businessAddressLine, groupedOpeningHoursSpecification, businessReviewStats]);

  const formatBusinessHours = (hour) => {
    if (!hour) return 'Contact business for opening hours';
    if (!hour.is_open) return 'Closed today';
    if (hour.is_24_hours) return 'Open 24 hours';
    if (!hour.opening_time || !hour.closing_time) return 'Contact business for opening hours';
    const formatTime = (timeValue) => {
      const [hours, minutes] = timeValue.slice(0, 5).split(':').map(Number);
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const normalizedHours = hours % 12 || 12;
      return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
    };
    return `${formatTime(hour.opening_time)} - ${formatTime(hour.closing_time)}`;
  };

  const formatPreviewTime = (timeValue) => {
    if (!timeValue) return '';
    const [hours, minutes] = timeValue.split(':');
    return `${hours}:${minutes}`;
  };

  const latitude = profileData.latitude ? Number(profileData.latitude) : null;
  const longitude = profileData.longitude ? Number(profileData.longitude) : null;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const yandexMapUrl = hasCoordinates
    ? `https://yandex.com/maps/?ll=${longitude},${latitude}&pt=${longitude},${latitude}&z=16`
    : null;

  // Social links
  const socialLinks = [
    { platform: 'instagram', label: 'Instagram', url: profileData.instagram },
    { platform: 'facebook', label: 'Facebook', url: profileData.facebook },
    { platform: 'twitter', label: 'Twitter/X', url: profileData.twitter },
    { platform: 'linkedin', label: 'LinkedIn', url: profileData.linkedin },
    { platform: 'youtube', label: 'YouTube', url: profileData.youtube },
    { platform: 'tiktok', label: 'TikTok', url: profileData.tiktok },
  ].filter((item) => item.url);

  const handleAddServiceToDraft = (service) => {
    if (!isAuthenticated) { setShowLoginModal(true); return; }
    const existingDraft = getDraft();
    const nextDraft = existingDraft && String(existingDraft.businessId) === String(businessId)
      ? {
          ...existingDraft,
          activeServiceId: service.id,
          services: existingDraft.services?.some((item) => item.id === service.id)
            ? existingDraft.services
            : [...(existingDraft.services || []), { id: service.id, name: service.name, price: service.price, duration: service.duration, business_owner: service.business_owner }],
        }
      : { businessId, activeServiceId: service.id, services: [{ id: service.id, name: service.name, price: service.price, duration: service.duration, business_owner: service.business_owner }] };
    saveDraft(nextDraft);
    setDraft(nextDraft);
    navigate(`/book/${service.id}`);
  };

  const handleRemoveDraftService = (serviceIdToRemove) => {
    if (!draft) return;
    const nextServices = (draft.services || []).filter((item) => item.id !== serviceIdToRemove);
    if (nextServices.length === 0) { clearDraft(); setDraft(null); setShowDiscardModal(false); return; }
    const nextDraft = { ...draft, services: nextServices, activeServiceId: String(draft.activeServiceId) === String(serviceIdToRemove) ? nextServices[0].id : draft.activeServiceId };
    saveDraft(nextDraft);
    setDraft(nextDraft);
  };

  const handleDiscardDraft = () => { clearDraft(); setDraft(null); setShowDiscardModal(false); };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Business not found'}</div>
          <Link to="/services" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Back to Businesses</Link>
        </div>
      </div>
    );
  }

  const aboutText = profileData.business_description || profileData.bio || '';

  // ── LEFT COLUMN: hero photos + name + portfolio ──
  const businessHeroSection = !hasBookingDraftForBusiness ? (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      {/* 2×2 photo grid */}
      <div className="grid grid-cols-2 gap-2 bg-white p-2">
        {spaceGallery.length > 0 ? (
          spaceGallery.slice(0, 4).map((image, index) => {
            const isOddLast = spaceGallery.slice(0,4).length % 2 === 1 && index === spaceGallery.slice(0,4).length - 1;
            return (
              <button
                key={`${image}-${index}-space`}
                type="button"
                onClick={() => openGalleryAt(index, 'space')}
                className={`group relative overflow-hidden rounded-lg bg-gray-100 ${isOddLast ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}
              >
                <img src={image} alt={`${publicBusinessName || 'Business'} space ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" onError={(e) => { e.target.style.display = 'none'; }} />
              </button>
            );
          })
        ) : (
          <div className="col-span-2 aspect-[2/1] rounded-lg bg-gray-100" />
        )}
      </div>

      {/* Name + address + rating */}
      <div className="px-6 pb-5 pt-5">
        <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-[#1f1f1f] dark:text-white md:text-[1.65rem]">
          {publicBusinessName || ' '}
        </h1>
        <p className="mt-2 text-xs leading-5 text-[#7a7a7a] dark:text-slate-400 md:text-sm">{businessAddressLine || ' '}</p>
        {businessReviewStats.reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs md:text-sm">
            <span className="text-amber-400">★</span>
            <span className="font-semibold text-[#1f1f1f]">{businessReviewStats.averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({businessReviewStats.reviewCount} {businessReviewStats.reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {/* Portfolio row */}
      {portfolioGallery.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 px-6 pb-6">
          <h2 className="mb-3 mt-4 text-sm font-bold uppercase tracking-wide text-[#3d3d3d] dark:text-slate-300">Portfolio</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {portfolioGallery.slice(0, 12).map((image, index) => (
              <button
                key={`${image}-${index}-portfolio`}
                type="button"
                onClick={() => openGalleryAt(index, 'portfolio')}
                className="group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
              >
                <img src={image} alt={`${publicBusinessName || 'Business'} portfolio ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" onError={(e) => { e.target.style.display = 'none'; }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ── RIGHT COLUMN: sidebar ──
  const businessInfoSections = !hasBookingDraftForBusiness ? (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">

      {/* Leaflet map with Yandex overlay */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-xl">
          <BusinessMap
            latitude={latitude}
            longitude={longitude}
            name={publicBusinessName}
            address={businessAddressLine}
            height={140}
          />
          {yandexMapUrl && (
            <a
              href={yandexMapUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute right-2 top-2 z-[1000] rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#2f95bb] shadow-sm hover:bg-white"
              aria-label={`Open ${publicBusinessName || 'business'} in Yandex Maps`}
            >
              Open in Yandex Maps
            </a>
          )}
        </div>
      </div>

      {/* Name + address below map */}
      <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-4">
        <p className="text-base font-semibold text-[#3a3a3a] dark:text-white">{publicBusinessName || ' '}</p>
        <p className="mt-1 text-[11px] leading-5 text-[#7a7a7a] dark:text-slate-400">{businessAddressLine || ' '}</p>
      </div>

      {/* About Us */}
      <section className="border-t border-gray-100 dark:border-slate-700 px-6 py-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d] dark:text-slate-300">About Us</h3>
        {aboutText ? (
          <>
            <p className="mt-4 text-sm leading-7 text-[#444] dark:text-slate-300">
              {expandedAbout || aboutText.length <= 260 ? aboutText : `${aboutText.slice(0, 260)}...`}
            </p>
            {aboutText.length > 260 && (
              <button type="button" onClick={() => setExpandedAbout((prev) => !prev)} className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">
                {expandedAbout ? 'Show less' : 'Show more'}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedAbout ? 'rotate-180' : ''}`} />
              </button>
            )}
          </>
        ) : <div className="mt-4 h-5" />}
      </section>

      {/* Staffers */}
      <section className="border-t border-gray-100 dark:border-slate-700 px-6 py-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d] dark:text-slate-300">Staffers</h3>
        <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
          {businessEmployees.length > 0 ? businessEmployees.map((employee) => {
            const firstName = employee.user_details?.first_name || employee.user_details?.email || 'Staff';
            return (
              <div key={employee.id} className="min-w-[72px] text-center">
                <div className="mx-auto h-14 w-14 overflow-hidden rounded-full bg-gray-100">
                  {employee.user_details?.profile_picture ? (
                    <img src={normalizeMediaUrl(employee.user_details.profile_picture)} alt={firstName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#e8eef1] text-sm font-semibold text-gray-600">{firstName.slice(0, 1)}</div>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-[#2d2d2d] dark:text-slate-200">{firstName}</p>
              </div>
            );
          }) : <div className="h-5" />}
        </div>
      </section>

      {/* Business Hours */}
      <section className="border-t border-gray-100 dark:border-slate-700 px-6 py-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d] dark:text-slate-300">Business Hours</h3>
        {businessHours.length > 0 ? (
          <>
            {!showFullWeek ? (
              <>
                <div className="mt-4 flex items-center justify-between gap-6">
                  <span className="text-base text-[#444] dark:text-slate-300">Today</span>
                  <span className="text-base font-semibold text-[#444] dark:text-slate-200">{formatBusinessHours(todayHours)}</span>
                </div>
                <button type="button" onClick={() => setShowFullWeek(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2f95bb]">
                  Show full week <ChevronDownIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                {orderedBusinessHours.map((hour) => {
                  const isToday = hour.day_of_week === todayDayIndex;
                  return (
                    <div key={hour.id} className="flex items-center justify-between gap-6">
                      <span className={`text-[15px] ${isToday ? 'font-bold text-[#444] dark:text-slate-200' : 'font-medium text-[#555] dark:text-slate-400'}`}>{dayLabels[hour.day_of_week]}</span>
                      <span className={`text-[15px] ${isToday ? 'font-bold text-[#444] dark:text-slate-200' : 'font-medium text-[#555] dark:text-slate-400'}`}>{formatBusinessHours(hour)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* Social Media — compact icons only */}
      {socialLinks.length > 0 && (
        <section className="border-t border-gray-100 dark:border-slate-700 px-6 py-5">
          <div className="flex items-center gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.platform}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 transition hover:border-[#2f95bb] hover:text-[#2f95bb]"
              >
                <SocialIcon platform={item.platform} />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Business Details */}
      <section className="border-t border-gray-100 dark:border-slate-700 px-6 py-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d] dark:text-slate-300">Business Details</h3>
        <p className="mt-4 text-base leading-7 text-[#202020] dark:text-slate-200">{profileData.business_name || publicBusinessName || ' '}</p>
        <div className="mt-4 space-y-3">
          {profileData.business_phone || business?.phone_number ? (
            <div className="flex items-center gap-4 text-sm text-[#202020] dark:text-slate-300">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              <span>{profileData.business_phone || business?.phone_number}</span>
            </div>
          ) : null}
          {profileData.business_email || business?.email ? (
            <div className="flex items-center gap-4 text-sm text-[#202020] dark:text-slate-300">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              <span>{profileData.business_email || business?.email}</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-100 dark:bg-[#0f1118]">
      {localBusinessSchema ? (
        <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
      ) : null}

      {/* Back Button */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/services" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Businesses
            </Link>
            {hasBookingDraftForBusiness ? (
              <button type="button" onClick={() => setShowDiscardModal(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900">
                <XMarkIcon className="h-6 w-6" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto overflow-x-hidden px-3 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6 sm:px-4 sm:py-8 sm:gap-8">

        {/* Left column */}
        <div className="order-2 xl:order-1 xl:col-span-2">
          {businessHeroSection ? <div className="mb-8">{businessHeroSection}</div> : null}

          {/* Services */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h3 className="shrink-0 text-2xl font-bold leading-none text-gray-900 dark:text-white sm:text-[2rem]">
              {hasBookingDraftForBusiness ? 'Select services' : 'Popular Services'}
            </h3>
            <div className="flex min-w-0 flex-1 basis-full items-center rounded-2xl border border-gray-200 dark:border-slate-600 bg-[#f5f5f5] dark:bg-slate-800 px-3 py-2 sm:basis-auto">
              <svg className="h-5 w-5 shrink-0 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="ml-2 min-w-0 flex-1 bg-transparent py-1 text-sm text-slate-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500" placeholder="Search for service" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} />
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-slate-400">No services found.</div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b px-4 py-5 sm:grid-cols-[1fr_110px_auto] sm:px-6 ${
                    draftServiceIds.has(service.id) ? 'border-[#b9dced] bg-[#dff0f8] dark:bg-[#1a2e3a]' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2 sm:pr-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{service.name}</div>
                    {service.description && <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">{service.description}</div>}
                  </div>
                  <div className="flex flex-col items-end whitespace-nowrap sm:pr-4">
                    <div className="text-base font-bold text-gray-800 dark:text-white sm:text-lg">{formatPrice(service.price)}</div>
                    <div className="text-xs font-medium text-gray-400 dark:text-slate-400 sm:text-sm">{formatDuration(service.duration)}</div>
                  </div>
                  <div className="col-span-2 flex justify-end sm:col-span-1">
                    {isBusinessOwner ? (
                      <Link to="/appointments" className="min-w-[92px] rounded-xl border border-[#4a90b0] px-4 py-2 text-center text-sm font-semibold text-[#4a90b0] transition-colors hover:bg-[#eef6fa] sm:min-w-[140px]">
                        {isOwnBusiness ? 'View bookings' : 'Owner account'}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddServiceToDraft(service)}
                        className={`min-w-[72px] rounded-xl px-4 py-2 text-sm font-semibold text-center transition-colors sm:min-w-[84px] ${
                          draftServiceIds.has(service.id) ? 'border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600' : 'bg-[#4a90b0] text-white hover:bg-[#3d7691]'
                        }`}
                      >
                        {draftServiceIds.has(service.id) ? 'Added' : 'Book'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {!hasBookingDraftForBusiness && businessReviewStats.reviewCount > 0 && (
            <div className="mt-8 overflow-hidden rounded-[24px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 px-6 py-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reviews</h2>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1">
                  <StarIconSolid className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{businessReviewStats.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">({businessReviewStats.reviewCount})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {services
                  .flatMap((s) => (s.reviews || []).map((r) => ({ ...r, serviceName: s.name })))
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 8)
                  .map((review) => (
                    <div key={review.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f2f6] dark:bg-[#1a2e3a] text-xs font-bold text-[#4a90b0]">
                            {(review.customer_name || review.customer_email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{review.customer_name || review.customer_email?.split('@')[0] || 'Customer'}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{review.serviceName}</p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {[1,2,3,4,5].map((n) => (
                            <StarIconSolid key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? 'text-amber-400' : 'text-gray-200 dark:text-slate-600'}`} />
                          ))}
                          <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.comment && <p className="mt-2 pl-10 text-sm leading-relaxed text-gray-600 dark:text-slate-300">{review.comment}</p>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="order-1 xl:order-2 space-y-6">
          {hasBookingDraftForBusiness ? (
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your order</h2>
              <div className="mt-6 space-y-3">
                {(draft.services || []).map((item) => (
                  <div key={item.id} className="rounded-[24px] bg-[#f2f2f1] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-base text-gray-900">{item.name}</p>
                        <p className="mt-2 text-sm text-gray-500">{formatDuration(item.duration)}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className="text-xl font-semibold text-gray-900">{formatPrice(item.price)}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveDraftService(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white">
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-[24px] bg-[#f2f2f1] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Available staff</h3>
                    <div className="flex gap-3">
                      <button type="button" className="rounded-2xl border border-gray-300 p-2.5 text-gray-900"><ChevronLeftIcon className="h-4 w-4" /></button>
                      <button type="button" className="rounded-2xl border border-gray-300 p-2.5 text-gray-900"><ChevronRightIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    <div className="min-w-[74px] text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#4a90b0] bg-white text-gray-500">
                        <UserGroupIcon className="h-7 w-7" />
                      </div>
                      <p className="mt-2 text-sm text-gray-800">No</p>
                      <p className="text-sm text-gray-800">preference</p>
                    </div>
                    {orderEmployees.map((employee) => {
                      const label = staffPreviewSlots[employee.id];
                      const initials = `${employee.user_details?.first_name?.[0] || ''}${employee.user_details?.last_name?.[0] || ''}`.trim() || 'E';
                      return (
                        <div key={employee.id} className="min-w-[74px] text-center">
                          <div className="mb-1 h-6 text-[11px] font-semibold uppercase tracking-wide text-[#f28a32]">
                            {staffLoading ? '' : label ? `From ${formatPreviewTime(label)}` : ''}
                          </div>
                          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e9ecef] text-xs font-semibold text-gray-700">
                            {employee.user_details?.profile_picture ? (
                              <img src={normalizeMediaUrl(employee.user_details.profile_picture)} alt={employee.user_details.first_name} className="h-full w-full object-cover" />
                            ) : initials}
                          </div>
                          <div className={`mx-auto mt-2 h-2.5 w-2.5 rounded-full ${label ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <p className="mt-1.5 text-sm text-gray-800">{employee.user_details?.first_name || employee.user_details?.email}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between text-xl font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(totalDraftAmount)}</span>
                </div>
              </div>
              <button type="button" onClick={() => navigate(`/book/${draft.activeServiceId}`)} className="mt-6 w-full rounded-2xl bg-[#4a90b0] px-5 py-3 text-base font-semibold text-white">
                Continue
              </button>
            </div>
          ) : null}

          {!hasBookingDraftForBusiness ? (
            <div className="hidden xl:block"><div className="sticky top-20">{businessInfoSections}</div></div>
          ) : null}
        </div>
      </div>

      {/* Sidebar on mobile */}
      <div className="xl:hidden px-4 pb-8">{businessInfoSections}</div>

      {/* Gallery lightbox */}
      {activeGalleryIndex !== null ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
              <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
                <button type="button" onClick={closeGallery} className="inline-flex items-center gap-2 text-gray-900">
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center justify-center gap-3">
                  <button type="button" onClick={() => { setActiveGallerySection('space'); setActiveGalleryIndex(0); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeGallerySection === 'space' ? 'border border-[#4a90b0] bg-[#eef7fb] text-[#1f1f1f]' : 'bg-[#f1f1f1] text-[#1f1f1f]'}`}>
                    The space ({spaceGallery.length})
                  </button>
                  <button type="button" onClick={() => { setActiveGallerySection('portfolio'); setActiveGalleryIndex(0); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeGallerySection === 'portfolio' ? 'border border-[#4a90b0] bg-[#eef7fb] text-[#1f1f1f]' : 'bg-[#f1f1f1] text-[#1f1f1f]'}`}>
                    Portfolio ({portfolioGallery.length})
                  </button>
                </div>
                <div />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#fafafa] px-4 py-6 sm:px-6">
              {activeGallerySection === 'portfolio' ? (
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
                  {orderedGalleryImages.map((image, index) => (
                    <div key={`${image}-${index}-portfolio`} className="overflow-hidden rounded-[24px] bg-white shadow-sm">
                      <img src={image} alt={`${publicBusinessName || 'Business'} gallery ${index + 1}`} className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-7xl space-y-4">
                  {orderedGalleryImages.map((image, index) => (
                    <div key={`${image}-${index}-space`} className="overflow-hidden rounded-[24px] bg-white shadow-sm">
                      <img src={image} alt={`${publicBusinessName || 'Business'} gallery ${index + 1}`} className="max-h-[82vh] w-full object-contain bg-white" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Login modal */}
      {showLoginModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl text-center sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f6fb] text-[#2f95bb] mb-5">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Login to book</h2>
            <p className="mt-2 text-gray-500 text-sm">You need an account to reserve this service.</p>
            <div className="mt-7 space-y-3">
              <button type="button" onClick={() => navigate('/login', { state: { from: { pathname: `/business/${businessId}` } } })} className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white hover:bg-[#2788aa] transition">Log in</button>
              <button type="button" onClick={() => navigate('/register')} className="w-full rounded-2xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 transition">Create account</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition">Maybe later</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Discard modal */}
      {showDiscardModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-xl sm:max-w-2xl sm:p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500 sm:h-24 sm:w-24">
              <span className="text-3xl font-light sm:text-5xl">i</span>
            </div>
            <h2 className="mt-5 text-center text-2xl font-bold text-gray-900 sm:mt-6 sm:text-3xl">Discard booking?</h2>
            <p className="mx-auto mt-3 text-center text-base text-gray-600 sm:mt-4 sm:text-lg">Are you sure you want to abort the booking process? Unsaved changes will be lost.</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={handleDiscardDraft} className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white sm:py-4 sm:text-lg">Yes, discard</button>
              <button type="button" onClick={() => setShowDiscardModal(false)} className="w-full rounded-2xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-900 sm:py-4 sm:text-lg">Continue booking</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BusinessDetail;