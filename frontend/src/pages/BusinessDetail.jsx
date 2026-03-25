import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
// Replaced ServiceCard with a simple vertical list layout for services
import { appointmentService, scheduleService, userService, serviceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

  useEffect(() => {
    fetchBusinessAndServices();
  }, [businessId]);

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
      setServices(servicesResponse.data.results || servicesResponse.data);

    } catch (err) {
      console.error('Error fetching business details:', err);
      setError('Failed to load business details. Please try again later.');
    } finally {
      setLoading(false);
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

  const isBusinessOwner = user?.user_type === 'business_owner';
  const isOwnBusiness = isBusinessOwner && user?.id === Number(businessId);
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

  const formatPreviewTime = (timeValue) => {
    if (!timeValue) return '';
    const [hours, minutes] = timeValue.split(':');
    return `${hours}:${minutes}`;
  };

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

  return (
    <div className="min-h-screen bg-gray-100">
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
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Services */}
        <div className="md:col-span-2">
          <div className="mb-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="flex-1 ml-2 outline-none py-2 bg-transparent" placeholder="Search services" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} />
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {hasBookingDraftForBusiness ? 'Select services' : 'Popular Services'}
              </h3>
            </div>
          </div>
          {filteredServices.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No services found.</div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredServices.map((service) => (
                  /* Change 1: Use 'grid' instead of 'flex'. 
                     grid-cols-[1fr_100px_auto] defines 3 columns:
                     - 1fr: Service name/desc takes all available left space.
                     - 100px: Fixed width for Price/Duration (The "Green Line" effect).
                     - auto: The Book button.
                  */
                  <div
                    key={service.id}
                    className={`grid grid-cols-[1fr_110px_auto] items-center rounded-xl border p-6 shadow-sm ${
                      draftServiceIds.has(service.id)
                        ? 'border-[#b9dced] bg-[#dff0f8]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Column 1: Service Details */}
                    <div className="pr-4">
                      <div className="text-lg font-bold text-gray-900">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.description}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Price and Duration (ALIGNED VERTICALLY) */}
                    <div className="flex flex-col items-end pr-6 whitespace-nowrap">
                      <div className="text-xl font-bold text-gray-800">
                        {formatPrice(service.price)}
                      </div>
                      <div className="text-sm font-medium text-gray-400">
                        {formatDuration(service.duration)}
                      </div>
                    </div>

                    {/* Column 3: Book Button */}
                    <div className="flex justify-end">
                      {isBusinessOwner ? (
                        <Link
                          to="/appointments"
                          className="px-8 py-3 border border-[#4a90b0] text-[#4a90b0] rounded-xl text-lg font-semibold hover:bg-[#eef6fa] transition-colors min-w-[170px] text-center"
                        >
                          {isOwnBusiness ? 'View bookings' : 'Owner account'}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddServiceToDraft(service)}
                          className={`px-8 py-3 rounded-xl text-lg font-semibold transition-colors min-w-[140px] text-center ${
                            draftServiceIds.has(service.id)
                              ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                              : 'bg-[#4a90b0] text-white hover:bg-[#3d7691]'
                          }`}
                        >
                          {draftServiceIds.has(service.id) ? 'Added' : isAuthenticated ? 'Book' : 'Sign in to book'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Booking Order / Business Info */}
        <div className="space-y-6">
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
                                src={employee.user_details.profile_picture}
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
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
                <img
                  src={business.profile_picture || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'}
                  alt={business.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">{business.full_name}</h1>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full mb-2">Business Owner</span>
                <div className="flex items-center justify-center mb-2">
                  <div className="flex mr-2">{renderStars(4.5)}</div>
                  <span className="text-base font-medium text-gray-900 mr-2">4.5</span>
                  <span className="text-gray-500">(120 reviews)</span>
                </div>
                <div className="space-y-2 w-full text-gray-600 text-sm mt-2">
                  {business.email && (
                    <div className="flex items-center"><EnvelopeIcon className="h-5 w-5 mr-2" /><span>{business.email}</span></div>
                  )}
                  {business.phone_number && (
                    <div className="flex items-center"><PhoneIcon className="h-5 w-5 mr-2" /><span>{business.phone_number}</span></div>
                  )}
                  {business.profile?.location && (
                    <div className="flex items-center"><MapPinIcon className="h-5 w-5 mr-2" /><span>{business.profile.location}</span></div>
                  )}
                  <div className="flex items-center"><BuildingStorefrontIcon className="h-5 w-5 mr-2" /><span>{business.services_count} services available</span></div>
                </div>
                {business.profile?.bio && (
                  <p className="text-gray-700 text-center text-base mt-4">{business.profile.bio}</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
                <div className="flex space-x-6 mb-2">
                  <a href="#" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
                    <svg className="h-7 w-7 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a4.5 4.5 0 0 0-9.724 0C6.09 6.336 4.5 8.747 4.5 12.005c0 3.257 1.59 5.668 2.638 7.517a4.5 4.5 0 0 0 9.724 0c1.048-1.849 2.638-4.26 2.638-7.517 0-3.258-1.59-5.669-2.638-7.518Z" /></svg>
                    <span className="text-xs">Instagram</span>
                  </a>
                  <a href="#" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
                    <svg className="h-7 w-7 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-6a2.25 2.25 0 0 1-2.25-2.25V6.75m10.5 0A2.25 2.25 0 0 0 15 4.5h-6a2.25 2.25 0 0 0-2.25 2.25m10.5 0v10.5m0 0A2.25 2.25 0 0 1 15 19.5h-6a2.25 2.25 0 0 1-2.25-2.25m0 0V6.75" /></svg>
                    <span className="text-xs">Facebook</span>
                  </a>
                </div>
                <div className="text-xs text-gray-500 text-center">Social links placeholder</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">CONSUMER INFORMATION</h4>
                <p className="text-xs text-gray-600">This is a placeholder for consumer information, terms, or other legal text. You can update this section as needed.</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

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
