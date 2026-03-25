import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { appointmentService, scheduleService, serviceService, userService } from '../services/api';

const getToday = () => format(startOfToday(), 'yyyy-MM-dd');
const normalizeList = (response) => response.data?.results || response.data || [];
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

const formatCurrency = (value) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatSlotTime = (timeValue) => {
  if (!timeValue) return '';
  const [hours, minutes] = timeValue.split(':');
  return `${hours}:${minutes}`;
};

const formatDuration = (minutes) => {
  if (!minutes) return '';
  return `${minutes}min`;
};

const getDayBucket = (timeValue) => {
  const hour = Number(timeValue.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

const isPastSlotForDate = (dateValue, timeValue, now) => {
  if (dateValue !== format(now, 'yyyy-MM-dd')) {
    return false;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);
  const slotDate = new Date(now);
  slotDate.setHours(hours, minutes, 0, 0);
  return slotDate <= now;
};

const BookAppointment = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const [service, setService] = useState(null);
  const [business, setBusiness] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [visibleStart, setVisibleStart] = useState(getToday());
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(startOfToday()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('none');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [staffPreviewSlots, setStaffPreviewSlots] = useState({});
  const [slotsMessage, setSlotsMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [error, setError] = useState('');
  const [draftServices, setDraftServices] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    loadBookingContext();
  }, [serviceId]);

  useEffect(() => {
    if (!service) {
      return;
    }

    loadSlots();
    loadStaffPreviewSlots();
  }, [service, selectedDate, selectedEmployee, employees]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredAvailableSlots = useMemo(
    () =>
      availableSlots.filter(
        (slot) => !isPastSlotForDate(selectedDate, slot.start_time, currentTime)
      ),
    [availableSlots, selectedDate, currentTime]
  );

  const selectedSlot = useMemo(
    () => filteredAvailableSlots.find((slot) => slot.start_time === selectedTime) || null,
    [filteredAvailableSlots, selectedTime]
  );

  const groupedSlots = useMemo(() => {
    const buckets = { Morning: [], Afternoon: [], Evening: [] };
    filteredAvailableSlots.forEach((slot) => {
      buckets[getDayBucket(slot.start_time)].push(slot);
    });
    return buckets;
  }, [filteredAvailableSlots]);

  useEffect(() => {
    if (selectedTime && !selectedSlot) {
      setSelectedTime('');
    }
  }, [selectedTime, selectedSlot]);

  const visibleDays = useMemo(() => {
    const startDate = parseISO(visibleStart);
    return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
  }, [visibleStart]);

  const monthGridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const monthLabel = useMemo(() => {
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    const firstLabel = format(first, 'MMM.');
    const lastLabel = format(last, 'MMM. yyyy');

    if (format(first, 'MMM yyyy') === format(last, 'MMM yyyy')) {
      return format(first, 'MMM. yyyy');
    }

    return `${firstLabel} - ${lastLabel}`;
  }, [visibleDays]);

  const filteredEmployees = useMemo(() => {
    if (!service) return [];
    return employees.filter((employee) => {
      const assignedServices = employee.services_details || [];
      return assignedServices.length === 0 || assignedServices.some((item) => item.id === service.id);
    });
  }, [employees, service]);

  const totalAmount = useMemo(
    () => draftServices.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [draftServices]
  );

  const persistCurrentServiceInDraft = (serviceData) => {
    const existingDraft = getDraft();
    const nextDraft =
      existingDraft && String(existingDraft.businessId) === String(serviceData.business_owner)
        ? {
            ...existingDraft,
            activeServiceId: serviceData.id,
            services: existingDraft.services?.some((item) => item.id === serviceData.id)
              ? existingDraft.services
              : [
                  ...(existingDraft.services || []),
                  {
                    id: serviceData.id,
                    name: serviceData.name,
                    price: serviceData.price,
                    duration: serviceData.duration,
                    business_owner: serviceData.business_owner,
                  },
                ],
          }
        : {
            businessId: serviceData.business_owner,
            activeServiceId: serviceData.id,
            services: [
              {
                id: serviceData.id,
                name: serviceData.name,
                price: serviceData.price,
                duration: serviceData.duration,
                business_owner: serviceData.business_owner,
              },
            ],
          };

    saveDraft(nextDraft);
    setDraftServices(nextDraft.services || []);
  };

  const loadBookingContext = async () => {
    try {
      setLoading(true);
      setError('');

      const serviceResponse = await serviceService.getServiceById(serviceId);
      const serviceData = serviceResponse.data;
      setService(serviceData);
      persistCurrentServiceInDraft(serviceData);

      const [businessesResponse, employeesResponse] = await Promise.all([
        userService.getBusinesses(),
        scheduleService.getEmployees({ is_active: true }),
      ]);

      const businesses = normalizeList(businessesResponse);
      setBusiness(businesses.find((item) => item.id === serviceData.business_owner) || null);
      setEmployees(normalizeList(employeesResponse));
      setSelectedDate(getToday());
      setVisibleStart(getToday());
      setCalendarMonth(startOfMonth(startOfToday()));
    } catch (err) {
      console.error('Error loading booking page:', err);
      setError('Unable to load this booking page right now.');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      setSlotsLoading(true);
      setSelectedTime('');
      setSlotsMessage('');

      const response = await appointmentService.getAvailableSlots({
        service_id: serviceId,
        date: selectedDate,
        ...(selectedEmployee !== 'none' ? { employee_id: selectedEmployee } : {}),
      });

      const payload = response.data || {};
      setAvailableSlots(Array.isArray(payload) ? payload : payload.slots || []);
      setSlotsMessage(Array.isArray(payload) ? '' : payload.reason || '');
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
      setSlotsMessage('Failed to load available slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadStaffPreviewSlots = async () => {
    try {
      setStaffLoading(true);

      const previews = {};
      const requests = filteredEmployees.map(async (employee) => {
        const response = await appointmentService.getAvailableSlots({
          service_id: serviceId,
          date: selectedDate,
          employee_id: employee.id,
        });
        const slots = response.data?.slots || [];
        const nextSlot = slots.find(
          (slot) => !isPastSlotForDate(selectedDate, slot.start_time, new Date())
        );
        previews[employee.id] = nextSlot?.start_time || null;
      });

      await Promise.all(requests);
      setStaffPreviewSlots(previews);
    } catch (err) {
      console.error('Failed to load staff previews:', err);
      setStaffPreviewSlots({});
    } finally {
      setStaffLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !service) {
      toast.error('Select a time first.');
      return;
    }

    try {
      setSubmitting(true);
      await appointmentService.createAppointment({
        service: service.id,
        employee: selectedEmployee !== 'none' ? Number(selectedEmployee) : null,
        date: selectedDate,
        start_time: selectedTime,
        duration: service.duration,
        customer_notes: customerNotes.trim(),
      });

      clearDraft();
      setDraftServices([]);
      setSelectedTime('');
      setSelectedEmployee('none');
      setCustomerNotes('');
      setConfirmedBooking({
        date: selectedDate,
        time: selectedTime,
      });
      setShowConfirmation(true);
    } catch (err) {
      console.error('Booking failed:', err);
      toast.error(
        err.response?.data?.details ||
          err.response?.data?.error ||
          'Unable to complete the booking.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate(`/business/${service?.business_owner || ''}`);
  };

  const handleSelectDate = (date) => {
    const nextDate = format(date, 'yyyy-MM-dd');
    setSelectedDate(nextDate);
    setVisibleStart(nextDate);
    setCalendarMonth(startOfMonth(date));
    setCalendarOpen(false);
  };

  const handleBackToServices = () => {
    navigate(`/business/${service?.business_owner || ''}`, {
      state: { bookingDraft: true },
    });
  };

  const handleRemoveDraftService = (draftServiceId) => {
    const currentDraft = getDraft();
    if (!currentDraft) {
      return;
    }

    const nextServices = (currentDraft.services || []).filter((item) => item.id !== draftServiceId);

    if (nextServices.length === 0) {
      clearDraft();
      navigate(`/business/${service?.business_owner || ''}`);
      return;
    }

    const nextActiveServiceId =
      String(currentDraft.activeServiceId) === String(draftServiceId)
        ? nextServices[0].id
        : currentDraft.activeServiceId;

    const nextDraft = {
      ...currentDraft,
      services: nextServices,
      activeServiceId: nextActiveServiceId,
    };

    saveDraft(nextDraft);
    setDraftServices(nextServices);

    if (String(nextActiveServiceId) !== String(serviceId)) {
      navigate(`/book/${nextActiveServiceId}`);
    }
  };

  const handleActivateDraftService = (draftServiceId) => {
    const currentDraft = getDraft();
    if (!currentDraft) return;

    const nextDraft = {
      ...currentDraft,
      activeServiceId: draftServiceId,
    };
    saveDraft(nextDraft);

    if (String(draftServiceId) !== String(serviceId)) {
      navigate(`/book/${draftServiceId}`);
    }
  };

  const handleDiscardBooking = () => {
    clearDraft();
    setShowDiscardModal(false);
    navigate(`/business/${service?.business_owner || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4a90b0]" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error || 'Booking page not found.'}</p>
          <Link to="/services" className="mt-6 inline-flex rounded-2xl bg-[#4a90b0] px-5 py-3 font-semibold text-white">
            Back to services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] px-4 py-8 lg:px-10">
      {showConfirmation && confirmedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 p-6">
          <div className="relative w-full max-w-xl rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-xl">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-6 top-6 text-gray-500"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckIcon className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="mt-8 text-2xl md:text-3xl font-bold text-gray-900">Booking Confirmed</h2>
            <p className="mt-4 text-base md:text-lg text-gray-600">
              {format(parseISO(confirmedBooking.date), 'EEEE, dd MMM yyyy')} at{' '}
              {formatSlotTime(confirmedBooking.time)}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 rounded-2xl bg-[#4a90b0] px-5 py-3 text-base font-semibold text-white"
            >
              Done
            </button>
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
                onClick={handleDiscardBooking}
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

      <input
        ref={dateInputRef}
        type="date"
        min={getToday()}
        value={selectedDate}
        onChange={(event) => {
          setSelectedDate(event.target.value);
          setVisibleStart(event.target.value);
        }}
        className="sr-only"
      />

      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackToServices}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900"
        >
          <ArrowLeftIcon className="h-7 w-7" />
        </button>
        <button
          type="button"
          onClick={() => setShowDiscardModal(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900"
        >
          <XMarkIcon className="h-7 w-7" />
        </button>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-8 xl:grid-cols-[1.35fr_0.85fr]">
        <section>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Select Date & Time</h1>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{monthLabel}</h2>
              <button
                type="button"
                onClick={() => setCalendarOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-full border border-gray-300 px-4 py-2.5 text-gray-800"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${calendarOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>

              {calendarOpen ? (
                <div className="absolute left-0 top-full z-20 mt-4 w-[min(100vw-2rem,680px)] rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {format(calendarMonth, 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
                        className="rounded-2xl border border-gray-200 p-2.5 text-gray-400"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                        className="rounded-2xl border border-gray-300 p-2.5 text-gray-900"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-7 gap-y-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm text-gray-500">
                        {day}
                      </div>
                    ))}

                    {monthGridDays.map((day) => {
                      const isoDate = format(day, 'yyyy-MM-dd');
                      const active = isSameDay(day, parseISO(selectedDate));
                      const inMonth = isSameMonth(day, calendarMonth);
                      const disabled = isoDate < getToday() || !inMonth;
                      const hasAvailability = isoDate >= getToday();

                      return (
                        <button
                          key={isoDate}
                          type="button"
                          onClick={() => !disabled && handleSelectDate(day)}
                          disabled={disabled}
                          className="flex flex-col items-center justify-center py-1.5"
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-full border text-base font-medium transition ${
                              active
                                ? 'border-[#4a90b0] bg-[#2f95bb] text-white'
                                : inMonth
                                  ? 'border-gray-200 bg-[#f2f2f1] text-gray-900'
                                  : 'border-gray-200 bg-white text-gray-300'
                            } ${disabled ? 'opacity-70' : ''}`}
                          >
                            <span className="relative">
                              {format(day, 'd')}
                              {hasAvailability ? (
                                <span className={`absolute -bottom-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full ${active ? 'bg-[#d9eff8]' : 'bg-[#7cc089]'}`} />
                              ) : null}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextStart = format(addDays(parseISO(visibleStart), -7), 'yyyy-MM-dd');
                  setVisibleStart(nextStart < getToday() ? getToday() : nextStart);
                }}
                className="rounded-2xl border border-gray-300 p-3 text-gray-900"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleStart(format(addDays(parseISO(visibleStart), 7), 'yyyy-MM-dd'))}
                className="rounded-2xl border border-gray-300 p-3 text-gray-900"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-4 overflow-x-auto pb-3">
            {visibleDays.map((day) => {
              const active = isSameDay(day, parseISO(selectedDate));
              return (
                <button
                  key={format(day, 'yyyy-MM-dd')}
                  type="button"
                  onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                  className="min-w-[76px] text-center"
                >
                  <div
                    className={`mx-auto flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border text-base md:text-xl font-medium transition ${
                      active
                        ? 'border-[#4a90b0] bg-[#4a90b0] text-white'
                        : 'border-gray-200 bg-[#f2f2f1] text-gray-900'
                    }`}
                  >
                    <span className="relative">
                      {format(day, 'd')}
                      <span className={`absolute -bottom-2 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full ${active ? 'bg-[#d9eff8]' : 'bg-[#7cae95]'}`} />
                    </span>
                  </div>
                  <div className="mt-2 text-sm md:text-base text-gray-800">{format(day, 'EEE')}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {['Morning', 'Afternoon', 'Evening'].map((label) => (
                <div key={label}>
                  <p className="mb-4 text-center text-sm text-gray-500">
                    {label} ({groupedSlots[label].length})
                  </p>
                  <div className="space-y-3">
                    {groupedSlots[label].length > 0 ? (
                      groupedSlots[label].map((slot) => {
                        const active = selectedTime === slot.start_time;
                        return (
                          <button
                            key={`${slot.date}-${slot.start_time}`}
                            type="button"
                            onClick={() => setSelectedTime(slot.start_time)}
                            className={`w-full rounded-full px-4 py-3 text-sm md:text-base font-semibold transition ${
                              active
                                ? 'border-2 border-[#4a90b0] bg-[#dcedf6] text-gray-900'
                                : 'bg-[#efefee] text-gray-900'
                            }`}
                          >
                            {formatSlotTime(slot.start_time)}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-[24px] bg-[#f5f5f4] px-6 py-8 text-center text-sm text-gray-400">
                        No slots
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(slotsLoading || slotsMessage) && (
              <div className="mt-6 rounded-2xl bg-[#f5f7f8] px-5 py-4 text-sm text-gray-600">
                {slotsLoading ? 'Loading slots...' : slotsMessage}
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Your order</h2>

          <div className="mt-6 space-y-3">
            {draftServices.map((draftService) => {
              const isActiveDraftService = String(draftService.id) === String(serviceId);

              return (
                <div key={draftService.id} className="rounded-[24px] bg-[#f2f2f1] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-base md:text-lg text-gray-900">{draftService.name}</p>
                      <p className="mt-2 text-sm md:text-base text-gray-500">{formatDuration(draftService.duration)}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <p className="text-lg md:text-xl font-semibold text-gray-900">
                          {formatCurrency(draftService.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftService(draftService.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-200 pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="font-medium">Staff:</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500">
                          <UserGroupIcon className="h-5 w-5" />
                        </div>
                        <span>
                          {isActiveDraftService
                            ? selectedEmployee === 'none'
                              ? 'No staff preference'
                              : filteredEmployees.find((item) => String(item.id) === String(selectedEmployee))?.user_details?.first_name || 'Selected staff'
                            : 'No staff preference'}
                        </span>
                      </div>
                      {!isActiveDraftService ? (
                        <button
                          type="button"
                          onClick={() => handleActivateDraftService(draftService.id)}
                          className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900"
                        >
                          Change
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-[24px] bg-[#f2f2f1] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">Available staff</h3>
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
                <button
                  type="button"
                  onClick={() => setSelectedEmployee('none')}
                  className="min-w-[74px] text-center"
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[3px] ${selectedEmployee === 'none' ? 'border-[#4a90b0]' : 'border-gray-300'} bg-white text-gray-500`}>
                    <UserGroupIcon className="h-7 w-7" />
                  </div>
                  <p className="mt-2 text-sm text-gray-800">No</p>
                  <p className="text-sm text-gray-800">preference</p>
                </button>

                {filteredEmployees.map((employee) => {
                  const active = String(selectedEmployee) === String(employee.id);
                  const label = staffPreviewSlots[employee.id];
                  const initials = `${employee.user_details?.first_name?.[0] || ''}${employee.user_details?.last_name?.[0] || ''}`.trim() || 'E';

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedEmployee(String(employee.id))}
                      className="min-w-[74px] text-center"
                    >
                      <div className="mb-1 h-6 text-[11px] font-semibold uppercase tracking-wide text-[#f28a32]">
                        {staffLoading ? '' : label ? `From ${formatSlotTime(label)}` : ''}
                      </div>
                      <div className={`mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-[3px] ${active ? 'border-[#4a90b0]' : 'border-transparent'} bg-[#e9ecef] text-xs font-semibold text-gray-700`}>
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
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBackToServices}
            className="mt-6 inline-flex items-center text-base text-[#4a90b0]"
          >
            <span className="mr-3 text-xl">+</span>
            Add another service
          </button>

          <div className="mt-8 border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between text-lg md:text-xl font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBooking}
            disabled={!selectedSlot || submitting}
            className="mt-6 w-full rounded-2xl bg-[#4a90b0] px-5 py-3 text-sm md:text-base font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Continue'}
          </button>

          <div className="mt-5 rounded-2xl bg-[#f8fafb] p-4">
            <div className="flex items-start gap-3">
              <ClockIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-900">
                  {selectedSlot
                    ? `${format(parseISO(selectedDate), 'EEE, dd MMM')} at ${formatSlotTime(selectedTime)}`
                    : 'Select a date and time'}
                </p>
                <p className="mt-1">{selectedEmployee === 'none' ? 'No staff preference' : 'Selected staff member'}</p>
              </div>
            </div>
            {business?.profile?.location ? (
              <div className="mt-4 flex items-start gap-3">
                <MapPinIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
                <p className="text-sm text-gray-600">{business.profile.location}</p>
              </div>
            ) : null}
            <div className="mt-4 flex items-start gap-3">
              <PencilSquareIcon className="mt-1 h-5 w-5 text-[#4a90b0]" />
              <textarea
                rows={4}
                value={customerNotes}
                onChange={(event) => setCustomerNotes(event.target.value)}
                placeholder="Add a note"
                className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#4a90b0]"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookAppointment;
