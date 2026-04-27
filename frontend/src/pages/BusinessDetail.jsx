import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
// Replaced ServiceCard with a simple vertical list layout for services
import { appointmentService, scheduleService, userService, serviceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
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
const BUSINESS_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
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
      ...((business?.gallery_images || [])
        .filter((item) => (item.image_type || 'space') === 'space')
        .map((item) => normalizeMediaUrl(item.image))),
    ].filter((value, index, array) => value && array.indexOf(value) === index);

    if (uniqueImages.length === 0) {
      return [BUSINESS_FALLBACK_IMAGE];
    }

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

  const primaryImage = spaceGallery[0] || BUSINESS_FALLBACK_IMAGE;
  const thumbnailImages = portfolioGallery.slice(0, 6);
  const orderedGalleryImages =
    activeGalleryIndex === null
      ? currentGalleryImages
      : [
          ...currentGalleryImages.slice(activeGalleryIndex),
          ...currentGalleryImages.slice(0, activeGalleryIndex),
        ];
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
      sameAs: [profileData.facebook, profileData.instagram].filter(Boolean),
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

  const mapQuery = [
    profileData.business_name || publicBusinessName,
    businessAddressLine,
  ]
    .filter(Boolean)
    .join(', ');
  const latitude = profileData.latitude ? Number(profileData.latitude) : null;
  const longitude = profileData.longitude ? Number(profileData.longitude) : null;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const routeTarget = hasCoordinates
    ? `${latitude},${longitude}`
    : mapQuery;
  const yandexMapsUrl = hasCoordinates
    ? `https://yandex.com/maps/?rtext=~${encodeURIComponent(routeTarget)}&rtt=auto`
    : routeTarget
      ? `https://yandex.com/maps/?rtext=~${encodeURIComponent(routeTarget)}&rtt=auto`
      : null;

  const handleAddServiceToDraft = (service) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: {
            pathname: `/business/${businessId}`,
          },
        },
      });
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
      <div className="relative">
        <img
          src={primaryImage}
          alt={publicBusinessName || 'Business'}
          className="h-64 w-full object-cover md:h-[420px]"
          onClick={() => openGalleryAt(0, 'space')}
          onError={(e) => {
            e.target.src = BUSINESS_FALLBACK_IMAGE;
          }}
        />
        <button
          type="button"
          onClick={() => openGalleryAt(0, 'space')}
          className="absolute bottom-4 right-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-md"
        >
          Show all photos
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1 border-t border-gray-100 bg-white p-1 md:gap-0 md:p-0">
        {thumbnailImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => openGalleryAt(index, 'portfolio')}
            className="overflow-hidden rounded-xl bg-gray-100 md:rounded-none"
          >
            <img
              src={image}
              alt={`${publicBusinessName || 'Business'} ${index + 2}`}
              className="h-14 w-full object-cover md:h-[120px]"
              onError={(e) => {
                e.target.src = BUSINESS_FALLBACK_IMAGE;
              }}
            />
          </button>
        ))}
      </div>

      <div className="px-6 pb-6 pt-5 md:px-6 md:pb-7 md:pt-6">
        <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-[#1f1f1f] md:text-[1.65rem]">
          {publicBusinessName || ' '}
        </h1>

        <p className="mt-2 text-xs leading-5 text-[#7a7a7a] md:text-sm">
          {businessAddressLine || ' '}
        </p>

        {businessReviewStats.reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs md:text-sm">
            <span className="text-amber-400">★</span>
            <span className="font-semibold text-[#1f1f1f]">{businessReviewStats.averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({businessReviewStats.reviewCount} {businessReviewStats.reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const businessInfoSections = !hasBookingDraftForBusiness ? (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
      {yandexMapsUrl ? (
        <a
          href={yandexMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group block"
          aria-label={`Open ${publicBusinessName || 'business'} in Yandex Maps`}
        >
          <div className="relative h-80 overflow-hidden bg-[linear-gradient(135deg,#eaf1e3_0%,#f5efe5_52%,#dbeaf5_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(148,213,117,0.35),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(255,220,130,0.28),transparent_18%),radial-gradient(circle_at_72%_78%,rgba(105,185,255,0.22),transparent_20%)]" />
            <div className="absolute inset-0 opacity-60">
              <div className="absolute left-[8%] top-[12%] h-[2px] w-[38%] rotate-[16deg] bg-white/80" />
              <div className="absolute left-[12%] top-[28%] h-[2px] w-[58%] -rotate-[8deg] bg-white/75" />
              <div className="absolute left-[22%] top-[46%] h-[2px] w-[52%] rotate-[10deg] bg-white/80" />
              <div className="absolute left-[10%] top-[68%] h-[2px] w-[62%] -rotate-[6deg] bg-white/70" />
              <div className="absolute left-[18%] top-[8%] h-[56%] w-[2px] rotate-[4deg] bg-white/65" />
              <div className="absolute left-[58%] top-[14%] h-[64%] w-[2px] -rotate-[8deg] bg-white/65" />
              <div className="absolute left-[78%] top-[6%] h-[72%] w-[2px] rotate-[6deg] bg-white/60" />
            </div>
            <div className="absolute left-1/2 top-9 -translate-x-1/2 rounded-full bg-white p-2 shadow-lg">
              <MapPinIcon className="h-9 w-9 text-[#1f1f1f]" />
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#2f95bb] shadow-sm">
              Open in Yandex Maps
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[22px] bg-white/95 p-4 shadow-lg backdrop-blur transition group-hover:bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#3a3a3a]">{publicBusinessName || ' '}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#7a7a7a]">{businessAddressLine || ' '}</p>
                </div>
                <div className="rounded-full border border-gray-200 p-2 text-gray-400 transition group-hover:text-[#2f95bb]">
                  <ChevronRightMiniIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </a>
      ) : (
        <div className="relative h-80 bg-[linear-gradient(135deg,#eaf1e3_0%,#f5efe5_52%,#dbeaf5_100%)]">
          <div className="absolute left-1/2 top-9 -translate-x-1/2 rounded-full bg-white p-2 shadow-lg">
            <MapPinIcon className="h-9 w-9 text-[#1f1f1f]" />
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-[22px] bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#3a3a3a]">{publicBusinessName || ' '}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#7a7a7a]">{businessAddressLine || ' '}</p>
              </div>
              <div className="rounded-full border border-gray-200 p-2 text-gray-400">
                <ChevronRightMiniIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

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
                      src={normalizeMediaUrl(employee.user_details.profile_picture) || BUSINESS_FALLBACK_IMAGE}
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

      <section className="border-t border-gray-100 px-6 py-7">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#3d3d3d]">Social Media</h3>
        <div className="mt-5 flex justify-center gap-10">
          {profileData.instagram ? (
            <a href={profileData.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d0d0d0] text-lg text-white">I</div>
              <span className="mt-2 text-xs">Instagram</span>
            </a>
          ) : null}
          {profileData.facebook ? (
            <a href={profileData.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d0d0d0] text-lg text-white">f</div>
              <span className="mt-2 text-xs">Facebook</span>
            </a>
          ) : null}
          {!profileData.instagram && !profileData.facebook ? <div className="h-5" /> : null}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-100">
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
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Services */}
        <div className="order-2 xl:order-1 xl:col-span-2">
          {businessHeroSection ? <div className="mb-8">{businessHeroSection}</div> : null}

          <div className="mb-5 flex items-center gap-3">
            <h3 className="shrink-0 text-[2rem] font-bold leading-none text-gray-900">
                {hasBookingDraftForBusiness ? 'Select services' : 'Popular Services'}
            </h3>
            <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-gray-200 bg-[#f5f5f5] px-3 py-2">
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
                                src={normalizeMediaUrl(employee.user_details.profile_picture) || BUSINESS_FALLBACK_IMAGE}
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
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
              <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
                <button
                  type="button"
                  onClick={closeGallery}
                  className="inline-flex items-center gap-2 text-gray-900"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGallerySection('space');
                      setActiveGalleryIndex(0);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      activeGallerySection === 'space'
                        ? 'border border-[#4a90b0] bg-[#eef7fb] text-[#1f1f1f]'
                        : 'bg-[#f1f1f1] text-[#1f1f1f]'
                    }`}
                  >
                    The space ({spaceGallery.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGallerySection('portfolio');
                      setActiveGalleryIndex(0);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      activeGallerySection === 'portfolio'
                        ? 'border border-[#4a90b0] bg-[#eef7fb] text-[#1f1f1f]'
                        : 'bg-[#f1f1f1] text-[#1f1f1f]'
                    }`}
                  >
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
                    <div
                      key={`${image}-${index}-portfolio`}
                      className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                    >
                      <img
                        src={image}
                        alt={`${publicBusinessName || 'Business'} gallery ${index + 1}`}
                        className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]"
                        onError={(e) => {
                          e.target.src = BUSINESS_FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mx-auto max-w-7xl space-y-4">
                  {orderedGalleryImages.map((image, index) => (
                    <div key={`${image}-${index}-space`} className="overflow-hidden rounded-[24px] bg-white shadow-sm">
                      <img
                        src={image}
                        alt={`${publicBusinessName || 'Business'} gallery ${index + 1}`}
                        className="max-h-[82vh] w-full object-contain bg-white"
                        onError={(e) => {
                          e.target.src = BUSINESS_FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showDiscardModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <span className="text-5xl font-light">i</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Discard booking?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-gray-600">
              Are you sure you want to abort the booking process? Unsaved changes will be lost.
            </p>
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="w-full rounded-2xl bg-[#2f95bb] px-6 py-4 text-lg font-semibold text-white"
              >
                Yes, discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="w-full rounded-2xl border border-gray-300 px-6 py-4 text-lg font-semibold text-gray-900"
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
