import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
// Replaced ServiceCard with a simple vertical list layout for services
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
  DevicePhoneMobileIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BOOKING_DRAFT_KEY = 'booking_draft';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const normalizeMediaUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${API_ORIGIN}${value}`;
  }

  return `${API_ORIGIN}/${value.replace(/^\/+/, '')}`;
};

const getDraft = () => {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveDraft = (draft) => {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
};

const clearDraft = () => {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
};

const normalizeList = (response) => response.data?.results || response.data || [];

const SocialIcon = ({ platform }) => {
  const common = {
    className: 'h-5 w-5',
    fill: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  if (platform === 'instagram') {
    return (
      <svg {...common}>
        <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 4a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4zm5.25-2.75a1 1 0 110 2 1 1 0 010-2z" />
      </svg>
    );
  }

  if (platform === 'facebook') {
    return (
      <svg {...common}>
        <path d="M14 8h2V5h-2.4C10.9 5 9 6.8 9 9.6V12H7v3h2v7h3v-7h2.4l.6-3h-3V9.8c0-1.1.5-1.8 2-1.8z" />
      </svg>
    );
  }

  if (platform === 'twitter') {
    return (
      <svg {...common}>
        <path d="M16.7 3h3.1l-6.8 7.8L21 21h-6.3l-4.9-6.3L4.2 21H1l7.3-8.4L.6 3h6.5l4.4 5.7L16.7 3zm-1.1 16.2h1.7L6.2 4.7H4.4l11.2 14.5z" />
      </svg>
    );
  }

  if (platform === 'linkedin') {
    return (
      <svg {...common}>
        <path d="M5.3 8.8H2.2V22h3.1V8.8zM3.8 3a1.8 1.8 0 100 3.6A1.8 1.8 0 003.8 3zm7.2 5.8H8V22h3.1v-6.8c0-1.8.3-3.5 2.5-3.5 2.1 0 2.1 2 2.1 3.6V22h3.1v-7.6c0-3.7-.8-6.5-5.1-6.5-2 0-3.3 1.1-3.9 2.1H9.8V8.8H11z" />
      </svg>
    );
  }

  if (platform === 'youtube') {
    return (
      <svg {...common}>
        <path d="M21.6 7.2a3 3 0 00-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 00-2.1 2.1C2 9 2 12 2 12s0 3 .4 4.8a3 3 0 002.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 002.1-2.1C22 15 22 12 22 12s0-3-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14 3c.4 2.4 1.7 3.9 4 4.1v3a7 7 0 01-4-1.3v6.6c0 3.4-2.4 5.6-5.4 5.6A5.2 5.2 0 013.3 16c0-3.4 2.7-5.5 6.2-5v3.2c-1.8-.3-3 .5-3 1.9 0 1.2.9 2 2.1 2 1.4 0 2.3-.8 2.3-2.7V3h3.1z" />
    </svg>
  );
};

const getToday = () => new Date().toISOString().split('T')[0];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const displayDayOrder = [0, 1, 2, 3, 4, 5, 6];
const schemaDayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  useEffect(() => {
    fetchBusinessAndServices();
  }, [businessId]);

  useEffect(() => {
    loadBusinessExtras();
  }, [businessId, isAuthenticated, isOwnBusiness]);

  useEffect(() => {
    setDraft(getDraft());
  }, [location.key]);

  const activeDraftService = useMemo(() => {
    if (!draft?.services?.length) {
      return null;
    }

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
        const employeesResponse = await scheduleService.getEmployees({
          business_owner: businessId,
          is_active: true,
        });
        const employees = normalizeList(employeesResponse).filter((employee) => {
          const assignedServices = employee.services_details || [];
          return (
            assignedServices.length === 0 ||
            assignedServices.some((item) => String(item.id) === String(activeDraftService.id))
          );
        });

        setOrderEmployees(employees);

        const previews = {};
        await Promise.all(
          employees.map(async (employee) => {
            try {
              const slotsResponse = await appointmentService.getAvailableSlots({
                service_id: activeDraftService.id,
                date: getToday(),
                employee_id: employee.id,
              });
              const slots = Array.isArray(slotsResponse.data)
                ? slotsResponse.data
                : slotsResponse.data?.slots || [];
              previews[employee.id] = slots[0]?.start_time || null;
            } catch {
              previews[employee.id] = null;
            }
          })
        );

        setStaffPreviewSlots(previews);
      } catch (err) {
        console.error('Error loading order sidebar:', err);
        setOrderEmployees([]);
        setStaffPreviewSlots({});
      } finally {
        setStaffLoading(false);
      }
    };

    loadOrderSidebar();
  }, [activeDraftService, businessId, draft]);

  const fetchBusinessAndServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch business details
      const businessResponse = await userService.getBusinesses();
      const businesses = businessResponse.data.results || businessResponse.data;
      const foundBusiness = businesses.find(b => b.id === parseInt(businessId));
      if (!foundBusiness) {
        throw new Error('Business not found');
      }
      setBusiness(foundBusiness);

      // Fetch services for this business
      const servicesResponse = await serviceService.getAllServices({
        business_owner: businessId
      });
      // reviews are now bundled inside each service by ServiceListSerializer
      setServices(servicesResponse.data.results || servicesResponse.data || []);

    } catch (err) {
      console.error('Error fetching business details:', err);
      setError('Failed to load business details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessExtras = async () => {
    try {
      const [employeesResponse, hoursResponse] = await Promise.all([
        isAuthenticated
          ? scheduleService.getEmployees({
              business_owner: businessId,
              is_active: true,
            })
          : Promise.resolve({ data: [] }),
        scheduleService.getBusinessHours({
          business_owner: businessId,
        }),
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
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    } catch {
      return `$${price}`;
    }
  };
  const formatDuration = (mins) => {
    if (!mins) return '';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return stars;
  };

  const hasBookingDraftForBusiness =
    draft && String(draft.businessId) === String(businessId) && (draft.services || []).length > 0;
  const draftServiceIds = useMemo(
    () => new Set((draft?.services || []).map((item) => item.id)),
    [draft]
  );
  const filteredServices = services.filter((s) =>
    s.name?.toLowerCase().includes(filters.search.toLowerCase())
  );
  const totalDraftAmount = (draft?.services || []).reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );
  const spaceGallery = useMemo(() => {
    const uniqueImages = [
      normalizeMediaUrl(business?.profile_picture),
      ...((business?.cover_images || []).map((image) => normalizeMediaUrl(image))),
      ...((business?.gallery_images || [])
        .filter((item) => (item.image_type || 'space') === 'space')
        .map((item) => normalizeMediaUrl(item.image))),
    ].filter((value, index, array) => value && array.indexOf(value) === index);

    return uniqueImages;
  }, [business?.profile_picture, business?.gallery_images]);

  const portfolioGallery = useMemo(() => {
    const uniqueImages = [
      ...((business?.gallery_images || [])
        .filter((item) => item.image_type === 'portfolio')
        .map((item) => normalizeMediaUrl(item.image))),
      ...(services || []).flatMap((service) => [
        normalizeMediaUrl(service.thumbnail),
        ...(Array.isArray(service.images) ? service.images.map((image) => normalizeMediaUrl(image)) : []),
        ...((service.service_images || []).map((item) => normalizeMediaUrl(item.image))),
      ]),
    ]
      .filter((value, index, array) => value && array.indexOf(value) === index);

    if (uniqueImages.length === 0) {
      return [];
    }

    return uniqueImages;
  }, [business?.gallery_images, services]);

  const currentGalleryImages = activeGallerySection === 'portfolio' ? portfolioGallery : spaceGallery;

  const openGalleryAt = (index, section = 'space') => {
    setActiveGallerySection(section);
    setActiveGalleryIndex(index);
  };
  const closeGallery = () => {
    setActiveGalleryIndex(null);
  };
  const showPreviousImage = () => {
    setActiveGalleryIndex((current) =>
      current === null ? null : (current - 1 + currentGalleryImages.length) % currentGalleryImages.length
    );
  };
  const showNextImage = () => {
    setActiveGalleryIndex((current) =>
      current === null ? null : (current + 1) % currentGalleryImages.length
    );
  };

  useEffect(() => {
    if (activeGalleryIndex === null) {
      document.body.style.removeProperty('overflow');
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveGalleryIndex(null);
      } else if (event.key === 'ArrowLeft') {
        setActiveGalleryIndex((current) =>
          current === null ? null : (current - 1 + currentGalleryImages.length) % currentGalleryImages.length
        );
      } else if (event.key === 'ArrowRight') {
        setActiveGalleryIndex((current) =>
          current === null ? null : (current + 1) % currentGalleryImages.length
        );
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.removeProperty('overflow');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeGalleryIndex, currentGalleryImages.length]);

  const businessReviewStats = useMemo(() => {
    const totals = (services || []).reduce(
      (accumulator, service) => {
        const reviewCount = Number(service.review_count || 0);
        const averageRating = Number(service.average_rating || 0);

        accumulator.reviewCount += reviewCount;
        accumulator.weightedRating += averageRating * reviewCount;
        return accumulator;
      },
      { reviewCount: 0, weightedRating: 0 }
    );

    const averageRating =
      totals.reviewCount > 0 ? totals.weightedRating / totals.reviewCount : 0;

    return {
      averageRating,
      reviewCount: totals.reviewCount,
    };
  }, [services]);

  const businessAddressLine = useMemo(() => {
    const profile = business?.profile || {};
    return [
      profile.business_address,
      profile.address,
      profile.postal_code || profile.zip_code,
      profile.city,
      profile.state || profile.province,
    ]
      .filter(Boolean)
      .join(', ');
  }, [business]);
  const profileData = business?.profile || {};
  const socialLinks = [
    { platform: 'instagram', label: 'Instagram', url: profileData.instagram },
    { platform: 'facebook', label: 'Facebook', url: profileData.facebook },
    { platform: 'twitter', label: 'Twitter/X', url: profileData.twitter },
    { platform: 'linkedin', label: 'LinkedIn', url: profileData.linkedin },
    { platform: 'youtube', label: 'YouTube', url: profileData.youtube },
    { platform: 'tiktok', label: 'TikTok', url: profileData.tiktok },
  ].filter((item) => item.url);

  const publicBusinessName = profileData.business_name || business?.full_name || '';
  const todayHours = useMemo(() => {
    const today = new Date().getDay();
    const normalizedDay = today === 0 ? 6 : today - 1;
    return businessHours.find((item) => item.day_of_week === normalizedDay) || null;
  }, [businessHours]);
  const todayDayIndex = useMemo(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  }, []);
  const orderedBusinessHours = useMemo(() => {
    const byDay = new Map(businessHours.map((item) => [item.day_of_week, item]));
    return displayDayOrder.map((dayIndex) => byDay.get(dayIndex)).filter(Boolean);
  }, [businessHours]);

  const groupedOpeningHoursSpecification = useMemo(() => {
    const groups = new Map();

    businessHours.forEach((hour) => {
      if (!hour?.is_open) {
        return;
      }

      const opens = hour.is_24_hours ? '00:00' : hour.opening_time?.slice(0, 5);
      const closes = hour.is_24_hours ? '23:59' : hour.closing_time?.slice(0, 5);

      if (!opens || !closes) {
        return;
      }

      const key = `${opens}-${closes}`;
      const current = groups.get(key) || {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [],
        opens,
        closes,
      };

      current.dayOfWeek.push(schemaDayLabels[hour.day_of_week]);
      groups.set(key, current);
    });

    return Array.from(groups.values());
  }, [businessHours]);

  const localBusinessSchema = useMemo(() => {
    if (!business) {
      return null;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: publicBusinessName || business?.full_name || 'Business',
      image: normalizeMediaUrl(business?.profile_picture) || undefined,
      telephone: profileData.business_phone || business?.phone_number || undefined,
      email: profileData.business_email || business?.email || undefined,
      address: businessAddressLine
        ? {
            '@type': 'PostalAddress',
            streetAddress: profileData.business_address || profileData.address || undefined,
            postalCode: profileData.postal_code || profileData.zip_code || undefined,
            addressLocality: profileData.city || undefined,
            addressRegion: profileData.state || profileData.province || undefined,
            addressCountry: profileData.country || undefined,
          }
        : undefined,
      sameAs: socialLinks.map((item) => item.url),
      openingHoursSpecification: groupedOpeningHoursSpecification,
    };

    if (businessReviewStats.reviewCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(businessReviewStats.averageRating.toFixed(1)),
        reviewCount: businessReviewStats.reviewCount,
      };
    }

    return schema;
  }, [
    business,
    publicBusinessName,
    profileData,
    businessAddressLine,
    groupedOpeningHoursSpecification,
    businessReviewStats,
  ]);

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
  const openStreetMapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
    : null;

  const handleAddServiceToDraft = (service) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const existingDraft = getDraft();
    const nextDraft =
      existingDraft && String(existingDraft.businessId) === String(businessId)
        ? {
            ...existingDraft,
            activeServiceId: service.id,
            services: existingDraft.services?.some((item) => item.id === service.id)
              ? existingDraft.services
              : [
                  ...(existingDraft.services || []),
                  {
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    duration: service.duration,
                    business_owner: service.business_owner,
                  },
                ],
          }
        : {
            businessId,
            activeServiceId: service.id,
            services: [
              {
                id: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration,
                business_owner: service.business_owner,
              },
            ],
          };

    saveDraft(nextDraft);
    setDraft(nextDraft);
    navigate(`/book/${service.id}`);
  };

  const handleRemoveDraftService = (serviceIdToRemove) => {
    if (!draft) {
      return;
    }

    const nextServices = (draft.services || []).filter((item) => item.id !== serviceIdToRemove);

    if (nextServices.length === 0) {
      clearDraft();
      setDraft(null);
      setShowDiscardModal(false);
      return;
    }

    const nextDraft = {
      ...draft,
      services: nextServices,
      activeServiceId:
        String(draft.activeServiceId) === String(serviceIdToRemove)
          ? nextServices[0].id
          : draft.activeServiceId,
    };

    saveDraft(nextDraft);
    setDraft(nextDraft);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraft(null);
    setShowDiscardModal(false);
  };

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
          <Link
            to="/services"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  const aboutText =
    profileData.business_description ||
    profileData.bio ||
    '';

  const businessHeroSection = !hasBookingDraftForBusiness ? (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-2 bg-white p-2">
        {spaceGallery.length > 0 ? (
          spaceGallery.map((image, index) => {
            const isOddLast = spaceGallery.length % 2 === 1 && index === spaceGallery.length - 1;
            return (
              <button
                key={`${image}-${index}-space-thumb`}
                type="button"
                onClick={() => openGalleryAt(index, 'space')}
                className={`group relative overflow-hidden rounded-lg bg-gray-100 ${isOddLast ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}
              >
                <img
                  src={image}
                  alt={`${publicBusinessName || 'Business'} space ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                  <MagnifyingGlassPlusIcon className="h-7 w-7" />
                </span>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 aspect-[2/1] rounded-lg bg-gray-100" />
        )}
      </div>

      <div className="px-6 pb-6 pt-5 md:px-6 md:pb-7 md:pt-6">
        <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-[#1f1f1f] md:text-[1.65rem]">
          {publicBusinessName || ' '}
        </h1>

        <p className="mt-2 text-xs leading-5 text-[#7a7a7a] md:text-sm">
          {businessAddressLine || ' '}
        </p>

        {socialLinks.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {socialLinks.map((item) => (
              <a
                key={item.platform}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-[#2f95bb] hover:text-[#2f95bb]"
              >
                <SocialIcon platform={item.platform} />
              </a>
            ))}
          </div>
        )}

        {businessReviewStats.reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs md:text-sm">
            <span className="text-amber-400">★</span>
            <span className="font-semibold text-[#1f1f1f]">{businessReviewStats.averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({businessReviewStats.reviewCount} {businessReviewStats.reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {portfolioGallery.length > 0 && (
        <div className="border-t border-gray-100 px-6 pb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#3d3d3d]">Portfolio</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {portfolioGallery.slice(0, 6).map((image, index) => (
              <button
                key={`${image}-${index}-portfolio-thumb`}
                type="button"
                onClick={() => openGalleryAt(index, 'portfolio')}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                <img
                  src={image}
                  alt={`${publicBusinessName || 'Business'} portfolio ${index + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                  <MagnifyingGlassPlusIcon className="h-7 w-7" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  const businessInfoSections = !hasBookingDraftForBusiness ? (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <BusinessMap
          latitude={latitude}
          longitude={longitude}
          name={publicBusinessName}
          address={businessAddressLine}
        />
        {openStreetMapUrl ? (
          <a
            href={openStreetMapUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#2f95bb] shadow-sm"
            aria-label={`Open ${publicBusinessName || 'business'} in OpenStreetMap`}
          >
            Open map
          </a>
        ) : null}
        <div className="border-t border-gray-100 bg-white p-4">
          <p className="text-base font-semibold text-[#3a3a3a]">{publicBusinessName || ' '}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#7a7a7a]">{businessAddressLine || ' '}</p>
        </div>
      </div>

      <section className="border-t border-gray-100 px-6 py-7">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d]">About Us</h3>
        {aboutText ? (
          <>
            <p className="mt-5 text-sm leading-7 text-[#444]">
              {expandedAbout || aboutText.length <= 260 ? aboutText : `${aboutText.slice(0, 260)}...`}
            </p>
            {aboutText.length > 260 ? (
              <button
                type="button"
                onClick={() => setExpandedAbout((prev) => !prev)}
                className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]"
              >
                {expandedAbout ? 'Show less' : 'Show more'}
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedAbout ? 'rotate-180' : ''}`} />
              </button>
            ) : null}
          </>
        ) : (
          <div className="mt-5 h-5" />
        )}
      </section>

      <section className="border-t border-gray-100 px-6 py-7">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d]">Staffers</h3>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-2">
          {businessEmployees.length > 0 ? businessEmployees.map((employee) => {
            const firstName = employee.user_details?.first_name || employee.user_details?.email || 'Staff';
            return (
              <div key={employee.id} className="min-w-[88px] text-center">
                <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                  {employee.user_details?.profile_picture ? (
                    <img
                      src={normalizeMediaUrl(employee.user_details.profile_picture)}
                      alt={firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#e8eef1] text-sm font-semibold text-gray-600">
                      {firstName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-[#2d2d2d]">{firstName}</p>
              </div>
            );
          }) : <div className="h-5" />}
        </div>
      </section>

      <section className="border-t border-gray-100 px-6 py-7">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d]">Business Hours</h3>
        {businessHours.length > 0 ? (
          <>
            {!showFullWeek ? (
              <>
                <div className="mt-5 flex items-center justify-between gap-6">
                  <span className="text-base text-[#444]">Today</span>
                  <span className="text-base font-semibold text-[#444]">{formatBusinessHours(todayHours)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullWeek(true)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#2f95bb]"
                >
                  Show full week
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="mt-6 space-y-5">
                {orderedBusinessHours.map((hour) => {
                  const isToday = hour.day_of_week === todayDayIndex;
                  return (
                    <div key={hour.id} className="flex items-center justify-between gap-6">
                      <span className={`text-[15px] ${isToday ? 'font-bold text-[#444]' : 'font-medium text-[#555]'}`}>
                        {dayLabels[hour.day_of_week]}
                      </span>
                      <span className={`text-[15px] ${isToday ? 'font-bold text-[#444]' : 'font-medium text-[#555]'}`}>
                        {formatBusinessHours(hour)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </section>

      <section className="border-t border-gray-100 px-6 py-7">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d]">Business Details</h3>
        <p className="mt-5 text-base leading-7 text-[#202020]">{profileData.business_name || publicBusinessName || ' '}</p>
        <div className="mt-5 space-y-4">
          {profileData.business_phone || business?.phone_number ? (
            <div className="flex items-center gap-4 text-sm text-[#202020]">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
              <span>{profileData.business_phone || business?.phone_number}</span>
            </div>
          ) : null}
          {profileData.business_email || business?.email ? (
            <div className="flex items-center gap-4 text-sm text-[#202020]">
              <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              <span>{profileData.business_email || business?.email}</span>
            </div>
          ) : null}
          {/* {businessAddressLine ? (
            <div className="flex items-start gap-4 text-sm text-[#202020]">
              <MapPinIcon className="mt-0.5 h-5 w-5 text-gray-500" />
              <span>{businessAddressLine}</span>
            </div>
          ) : null} */}
        </div>
      </section>

    </div>
  ) : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-100">
      {localBusinessSchema ? (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      ) : null}

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/services"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Businesses
            </Link>
            {hasBookingDraftForBusiness ? (
              <button
                type="button"
                onClick={() => setShowDiscardModal(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="max-w-7xl mx-auto overflow-x-hidden px-3 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6 sm:px-4 sm:py-8 sm:gap-8">
        {/* Left: Services */}
        <div className="order-2 xl:order-1 xl:col-span-2">
          {businessHeroSection ? <div className="mb-8">{businessHeroSection}</div> : null}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h3 className="shrink-0 text-2xl font-bold leading-none text-gray-900 sm:text-[2rem]">
                {hasBookingDraftForBusiness ? 'Select services' : 'Popular Services'}
            </h3>
            <div className="flex min-w-0 flex-1 basis-full items-center rounded-2xl border border-gray-200 bg-[#f5f5f5] px-3 py-2 sm:basis-auto">
              <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="ml-2 min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-gray-400" placeholder="Search for service" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} />
            </div>
          </div>
          {filteredServices.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No services found.</div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
              {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b px-4 py-5 sm:grid-cols-[1fr_110px_auto] sm:px-6 ${
                      draftServiceIds.has(service.id)
                        ? 'border-[#b9dced] bg-[#dff0f8]'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2 sm:pr-4">
                      <div className="text-sm font-semibold text-gray-900 sm:text-base">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-gray-500 sm:text-sm">
                          {service.description}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end whitespace-nowrap sm:pr-4">
                      <div className="text-base font-bold text-gray-800 sm:text-lg">
                        {formatPrice(service.price)}
                      </div>
                      <div className="text-xs font-medium text-gray-400 sm:text-sm">
                        {formatDuration(service.duration)}
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end sm:col-span-1">
                      {isBusinessOwner ? (
                        <Link
                          to="/appointments"
                          className="min-w-[92px] rounded-xl border border-[#4a90b0] px-4 py-2 text-center text-sm font-semibold text-[#4a90b0] transition-colors hover:bg-[#eef6fa] sm:min-w-[140px]"
                        >
                          {isOwnBusiness ? 'View bookings' : 'Owner account'}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddServiceToDraft(service)}
                          className={`min-w-[72px] rounded-xl px-4 py-2 text-sm font-semibold text-center transition-colors sm:min-w-[84px] ${
                            draftServiceIds.has(service.id)
                              ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                              : 'bg-[#4a90b0] text-white hover:bg-[#3d7691]'
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

          {/* Reviews — inside left column, below services list */}
          {!hasBookingDraftForBusiness && businessReviewStats.reviewCount > 0 && (
            <div className="mt-8 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
                  <StarIconSolid className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-gray-900">{businessReviewStats.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({businessReviewStats.reviewCount})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {services
                  .flatMap((s) => (s.reviews || []).map((r) => ({ ...r, serviceName: s.name })))
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 8)
                  .map((review) => (
                    <div key={review.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f2f6] text-xs font-bold text-[#4a90b0]">
                            {(review.customer_name || review.customer_email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.customer_name || review.customer_email?.split('@')[0] || 'Customer'}
                            </p>
                            <p className="text-xs text-gray-400">{review.serviceName}</p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <StarIconSolid key={n} className={`h-3.5 w-3.5 ${n <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} />
                          ))}
                          <span className="ml-1 text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 pl-10 text-sm leading-relaxed text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Order / Business Info */}
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
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftService(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white"
                        >
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
                      <button type="button" className="rounded-2xl border border-gray-300 p-2.5 text-gray-900">
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-2xl border border-gray-300 p-2.5 text-gray-900">
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
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
                      const initials =
                        `${employee.user_details?.first_name?.[0] || ''}${employee.user_details?.last_name?.[0] || ''}`.trim() || 'E';

                      return (
                        <div key={employee.id} className="min-w-[74px] text-center">
                          <div className="mb-1 h-6 text-[11px] font-semibold uppercase tracking-wide text-[#f28a32]">
                            {staffLoading ? '' : label ? `From ${formatPreviewTime(label)}` : ''}
                          </div>
                          <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e9ecef] text-xs font-semibold text-gray-700">
                            {employee.user_details?.profile_picture ? (
                              <img
                                src={normalizeMediaUrl(employee.user_details.profile_picture)}
                                alt={employee.user_details.first_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className={`mx-auto mt-2 h-2.5 w-2.5 rounded-full ${label ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <p className="mt-1.5 text-sm text-gray-800">
                            {employee.user_details?.first_name || employee.user_details?.email}
                          </p>
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

              <button
                type="button"
                onClick={() => navigate(`/book/${draft.activeServiceId}`)}
                className="mt-6 w-full rounded-2xl bg-[#4a90b0] px-5 py-3 text-base font-semibold text-white"
              >
                Continue
              </button>
            </div>
          ) : null}

          {!hasBookingDraftForBusiness ? (
            <>
              <div className="hidden xl:block">{businessInfoSections}</div>
            </>
          ) : null}
        </div>
      </div>

      <div className="xl:hidden px-4">{businessInfoSections}</div>

      {activeGalleryIndex !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            onClick={closeGallery}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white">
            {activeGalleryIndex + 1} / {currentGalleryImages.length}
          </div>

          {currentGalleryImages.length > 1 && (
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-4"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-7 w-7" />
            </button>
          )}

          <img
            src={currentGalleryImages[activeGalleryIndex]}
            alt={`${publicBusinessName || 'Business'} gallery ${activeGalleryIndex + 1}`}
            className="max-h-[84vh] max-w-full rounded-lg object-contain shadow-2xl"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          {currentGalleryImages.length > 1 && (
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-4"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-7 w-7" />
            </button>
          )}
        </div>
      ) : null}

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
              <button
                type="button"
                onClick={() => navigate('/login', { state: { from: { pathname: `/business/${businessId}` } } })}
                className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white hover:bg-[#2788aa] transition"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full rounded-2xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDiscardModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-xl sm:max-w-2xl sm:p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500 sm:h-24 sm:w-24">
              <span className="text-3xl font-light sm:text-5xl">i</span>
            </div>
            <h2 className="mt-5 text-center text-2xl font-bold text-gray-900 sm:mt-6 sm:text-3xl">Discard booking?</h2>
            <p className="mx-auto mt-3 text-center text-base text-gray-600 sm:mt-4 sm:text-lg">
              Are you sure you want to abort the booking process? Unsaved changes will be lost.
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white sm:py-4 sm:text-lg"
              >
                Yes, discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="w-full rounded-2xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-900 sm:py-4 sm:text-lg"
              >
                Continue booking
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BusinessDetail;
