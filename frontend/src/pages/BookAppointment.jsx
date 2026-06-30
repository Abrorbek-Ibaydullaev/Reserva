import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
import { enUS, ru, uz } from 'date-fns/locale';
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
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatSlotTime = (timeValue) => {
  if (!timeValue) return '';
  const [hours, minutes] = timeValue.split(':');
  return `${hours}:${minutes}`;
};

const formatDuration = (minutes, unit = 'min') => {
  if (!minutes) return '';
  return `${minutes} ${unit}`;
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

const getAvailabilityTone = (count) => {
  if (count >= 10) return 'bg-[#7cc089]';
  if (count >= 6) return 'bg-[#f3c400]';
  if (count >= 1) return 'bg-[#e79a21]';
  return 'bg-transparent';
};

const BookAppointment = () => {
  const { t, i18n } = useTranslation();
  const dfLocale = useMemo(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    return { ru, uz, en: enUS }[lang] || enUS;
  }, [i18n.language]);
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
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [staffPreviewSlots, setStaffPreviewSlots] = useState({});
  const [staffAvailableSlots, setStaffAvailableSlots] = useState({});
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

  const staffAvailabilityByTime = useMemo(() => {
    const map = {};

    Object.entries(staffAvailableSlots).forEach(([employeeId, slots]) => {
      (slots || []).forEach((slot) => {
        const key = slot.start_time;
        if (!map[key]) {
          map[key] = new Set();
        }
        map[key].add(String(employeeId));
      });
    });

    return map;
  }, [staffAvailableSlots]);

  useEffect(() => {
    if (selectedTime && !selectedSlot) {
      setSelectedTime('');
    }
  }, [selectedTime, selectedSlot]);

  useEffect(() => {
    if (
      selectedEmployee !== 'none' &&
      selectedTime &&
      !staffAvailabilityByTime[selectedTime]?.has(String(selectedEmployee))
    ) {
      setSelectedEmployee('none');
    }
  }, [selectedEmployee, selectedTime, staffAvailabilityByTime]);

  const visibleDays = useMemo(() => {
    const startDate = parseISO(visibleStart);
    return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
  }, [visibleStart]);

  const monthGridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const weekdayLabels = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'EEE', { locale: dfLocale }));
  }, [dfLocale]);

  const monthLabel = useMemo(() => {
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    const firstLabel = format(first, 'MMM.', { locale: dfLocale });
    const lastLabel = format(last, 'MMM. yyyy', { locale: dfLocale });

    if (format(first, 'MMM yyyy') === format(last, 'MMM yyyy')) {
      return format(first, 'MMM. yyyy', { locale: dfLocale });
    }

    return `${firstLabel} - ${lastLabel}`;
  }, [visibleDays, dfLocale]);

  const selectedDateObject = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const todayDate = useMemo(() => startOfToday(), []);
  const headerLabel = calendarOpen ? format(calendarMonth, 'MMMM yyyy', { locale: dfLocale }) : monthLabel;

  const filteredEmployees = useMemo(() => {
    if (!service) return [];
    const hasExplicitAssignments = employees.some((employee) =>
      (employee.services_details || []).some((item) => item.id === service.id)
    );

    if (!hasExplicitAssignments) {
      return employees;
    }

    return employees.filter((employee) =>
      (employee.services_details || []).some((item) => item.id === service.id)
    );
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
        scheduleService.getEmployees({
          business_owner: serviceData.business_owner,
          is_active: true,
        }),
      ]);

      const businesses = normalizeList(businessesResponse);
      setBusiness(businesses.find((item) => item.id === serviceData.business_owner) || null);
      setEmployees(normalizeList(employeesResponse));
      setSelectedDate(getToday());
      setVisibleStart(getToday());
      setCalendarMonth(startOfMonth(startOfToday()));
    } catch (err) {
      console.error('Error loading booking page:', err);
      setError(t('book_appointment.booking_page_error'));
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
      const availability = {};
      const requests = filteredEmployees.map(async (employee) => {
        const response = await appointmentService.getAvailableSlots({
          service_id: serviceId,
          date: selectedDate,
          employee_id: employee.id,
        });
        const payload = response.data || {};
        const slots = Array.isArray(payload) ? payload : payload.slots || [];
        const nextSlot = slots.find(
          (slot) => !isPastSlotForDate(selectedDate, slot.start_time, new Date())
        );
        previews[employee.id] = nextSlot?.start_time || null;
        availability[employee.id] = slots;
      });

      await Promise.all(requests);
      setStaffPreviewSlots(previews);
      setStaffAvailableSlots(availability);
    } catch (err) {
      console.error('Failed to load staff previews:', err);
      setStaffPreviewSlots({});
      setStaffAvailableSlots({});
    } finally {
      setStaffLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !service) {
      toast.error(t('book_appointment.select_time_first'));
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
      });

      clearDraft();
      setDraftServices([]);
      setSelectedTime('');
      setSelectedEmployee('none');
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
          t('book_appointment.unable_to_complete')
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1118]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4a90b0]" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1118] px-4">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
          <p className="text-red-600">{error || t('book_appointment.booking_not_found')}</p>
          <Link to="/services" className="mt-6 inline-flex rounded-2xl bg-[#4a90b0] px-5 py-3 font-semibold text-white">
            {t('book_appointment.back_to_services')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1118] overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8 lg:px-10">
      {showConfirmation && confirmedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-black/70 p-4">
          <div className="relative w-full max-w-xl rounded-[28px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-xl sm:p-8">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-6 top-6 text-gray-500 dark:text-slate-400"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
              <CheckIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            <h2 className="mt-8 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('book_appointment.booking_confirmed')}</h2>
            <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-slate-300">
              {format(parseISO(confirmedBooking.date), 'EEEE, dd MMM yyyy', { locale: dfLocale })} {t('book_appointment.at_time')}{' '}
              {formatSlotTime(confirmedBooking.time)}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 rounded-2xl bg-[#4a90b0] px-5 py-3 text-base font-semibold text-white"
            >
              {t('employee_dashboard.done')}
            </button>
          </div>
        </div>
      ) : null}

      {showDiscardModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-slate-800 p-5 shadow-xl sm:max-w-2xl sm:p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 sm:h-24 sm:w-24">
              <span className="text-3xl font-light sm:text-5xl">i</span>
            </div>
            <h2 className="mt-5 text-center text-2xl font-bold text-gray-900 dark:text-white sm:mt-6 sm:text-3xl">{t('book_appointment.discard_booking')}</h2>
            <p className="mx-auto mt-3 text-center text-base text-gray-600 dark:text-slate-300 sm:mt-4 sm:text-lg">
              {t('book_appointment.discard_confirm')}
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleDiscardBooking}
                className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white sm:py-4 sm:text-lg"
              >
                {t('book_appointment.yes_discard')}
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="w-full rounded-2xl border border-gray-300 dark:border-slate-600 px-6 py-3 text-base font-semibold text-gray-900 dark:text-slate-200 sm:py-4 sm:text-lg"
              >
                {t('book_appointment.continue_booking')}
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-slate-200"
        >
          <ArrowLeftIcon className="h-7 w-7" />
        </button>
        <button
          type="button"
          onClick={() => setShowDiscardModal(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-slate-200"
        >
          <XMarkIcon className="h-7 w-7" />
        </button>
      </div>

      <div className="mx-auto grid max-w-[1280px] items-start gap-8 xl:grid-cols-[1.35fr_0.85fr]">
        <section>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{t('book_appointment.select_date_time')}</h1>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{headerLabel}</h2>
              <button
                type="button"
                onClick={() => setCalendarOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-full border border-gray-300 dark:border-slate-600 px-4 py-2.5 text-gray-800 dark:text-slate-200"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${calendarOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (calendarOpen) {
                    setCalendarMonth((prev) => subMonths(prev, 1));
                    return;
                  }
                  const nextStart = format(addDays(parseISO(visibleStart), -7), 'yyyy-MM-dd');
                  setVisibleStart(nextStart < getToday() ? getToday() : nextStart);
                }}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-200"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (calendarOpen) {
                    setCalendarMonth((prev) => addMonths(prev, 1));
                    return;
                  }
                  setVisibleStart(format(addDays(parseISO(visibleStart), 7), 'yyyy-MM-dd'));
                }}
                className="rounded-2xl border border-gray-300 dark:border-slate-600 p-3 text-gray-900 dark:text-slate-200"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {calendarOpen ? (
            <div className="mt-8 max-w-[860px] rounded-[24px] bg-white/60 dark:bg-slate-800/60 p-1">
              <div className="flex flex-wrap gap-2.5">
                {[t('booking.morning'), t('booking.afternoon'), t('booking.evening')].map((label) => (
                  <div key={label} className="rounded-full bg-[#efefee] dark:bg-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-slate-200">
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-7 gap-y-3">
                {weekdayLabels.map((day, idx) => (
                  <div key={idx} className="text-center text-base text-gray-500 dark:text-slate-400">
                    {day}
                  </div>
                ))}

                {monthGridDays.map((day) => {
                  const isoDate = format(day, 'yyyy-MM-dd');
                  const active = isSameDay(day, selectedDateObject);
                  const inMonth = isSameMonth(day, calendarMonth);
                  const isPastDay = day < todayDate;
                  const disabled = isPastDay || !inMonth;
                  const isTodayOrFuture = day >= todayDate;
                  const availabilityCount = active && isTodayOrFuture ? filteredAvailableSlots.length : isTodayOrFuture ? 10 : 0;
                  const availabilityTone = getAvailabilityTone(availabilityCount);

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => !disabled && handleSelectDate(day)}
                      disabled={disabled}
                      className="flex flex-col items-center justify-center py-1"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition sm:h-14 sm:w-14 sm:text-lg ${
                          active
                            ? 'border-[#4a90b0] bg-[#2f95bb] text-white'
                            : inMonth
                              ? 'border-gray-200 dark:border-slate-600 bg-[#f2f2f1] dark:bg-slate-700 text-gray-900 dark:text-slate-200'
                              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-300 dark:text-slate-600'
                        } ${disabled ? 'bg-white dark:bg-slate-800 text-gray-300 dark:text-slate-600' : ''}`}
                      >
                        <span className="relative">
                          {format(day, 'd')}
                          {isPastDay ? (
                            <span className="absolute left-1/2 top-1/2 h-[2px] w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-300" />
                          ) : null}
                          {inMonth && !isPastDay ? (
                            <span className={`absolute -bottom-2.5 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full ${active ? 'bg-[#f7eed2]' : availabilityTone}`} />
                          ) : null}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                <span>{t('book_appointment.available_slots')}</span>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-[#7cc089]" />
                  <span>+10</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-[#f3c400]" />
                  <span>6-10</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-[#e79a21]" />
                  <span>1-5</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-7 gap-1 sm:flex sm:gap-4 sm:overflow-x-auto pb-3">
              {visibleDays.map((day) => {
                const active = isSameDay(day, selectedDateObject);
                return (
                  <button
                    key={format(day, 'yyyy-MM-dd')}
                    type="button"
                    onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                    className="text-center sm:min-w-[76px]"
                  >
                    <div
                      className={`mx-auto flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full border text-sm sm:text-base lg:text-xl font-medium transition ${
                        active
                          ? 'border-[#4a90b0] bg-[#4a90b0] text-white'
                          : 'border-gray-200 dark:border-slate-600 bg-[#f2f2f1] dark:bg-slate-700 text-gray-900 dark:text-slate-200'
                      }`}
                    >
                      <span className="relative">
                        {format(day, 'd')}
                        <span className={`absolute -bottom-2 left-1/2 h-1.5 w-6 sm:w-8 -translate-x-1/2 rounded-full ${active ? 'bg-[#d9eff8]' : 'bg-[#7cae95]'}`} />
                      </span>
                    </div>
                    <div className="mt-2 text-xs sm:text-base text-gray-800 dark:text-slate-300">{format(day, 'EEE', { locale: dfLocale })}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {['Morning', 'Afternoon', 'Evening'].map((bucket, bIdx) => {
                const bucketLabel = [t('booking.morning'), t('booking.afternoon'), t('booking.evening')][bIdx];
                return (
                <div key={bucket}>
                  <p className="mb-4 text-center text-sm text-gray-500 dark:text-slate-400">
                    {bucketLabel} ({groupedSlots[bucket].length})
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-3">
                    {groupedSlots[bucket].length > 0 ? (
                      groupedSlots[bucket].map((slot) => {
                        const active = selectedTime === slot.start_time;
                        return (
                          <button
                            key={`${slot.date}-${slot.start_time}`}
                            type="button"
                            onClick={() => setSelectedTime(slot.start_time)}
                            className={`w-full rounded-full px-2 py-2.5 sm:px-4 sm:py-3 text-sm md:text-base font-semibold transition ${
                              active
                                ? 'border-2 border-[#4a90b0] bg-[#dcedf6] dark:bg-[#1e3a4a] text-gray-900 dark:text-white'
                                : 'bg-[#efefee] dark:bg-slate-700 text-gray-900 dark:text-slate-200'
                            }`}
                          >
                            {formatSlotTime(slot.start_time)}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-3 sm:col-span-1 rounded-[24px] bg-[#f5f5f4] dark:bg-slate-700/50 px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                        {t('book_appointment.no_slots')}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {(slotsLoading || slotsMessage) && (
              <div className="mt-6 rounded-2xl bg-[#f5f7f8] dark:bg-slate-700 px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                {slotsLoading ? t('book_appointment.loading_slots') : slotsMessage}
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit self-start rounded-[24px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('book_appointment.your_order')}</h2>

          <div className="mt-6 space-y-3">
            {draftServices.map((draftService) => {
              const isActiveDraftService = String(draftService.id) === String(serviceId);

              return (
                <div key={draftService.id} className="rounded-[24px] bg-[#f2f2f1] dark:bg-slate-700 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-base md:text-lg text-gray-900 dark:text-white">{draftService.name}</p>
                      <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-slate-400">{formatDuration(draftService.duration, t('book_appointment.minutes_short'))}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <p className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(draftService.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftService(draftService.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 dark:bg-slate-500 text-white"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-200 dark:border-slate-600 pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                        <span className="font-medium">{t('book_appointment.staff_label')}</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-600 text-gray-500 dark:text-slate-300">
                          <UserGroupIcon className="h-5 w-5" />
                        </div>
                        <span>
                          {isActiveDraftService
                            ? selectedEmployee === 'none'
                              ? t('book_appointment.no_staff_preference')
                              : filteredEmployees.find((item) => String(item.id) === String(selectedEmployee))?.user_details?.first_name || t('book_appointment.selected_staff')
                            : t('book_appointment.no_staff_preference')}
                        </span>
                      </div>
                      {!isActiveDraftService ? (
                        <button
                          type="button"
                          onClick={() => handleActivateDraftService(draftService.id)}
                          className="rounded-2xl border border-gray-300 dark:border-slate-500 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200"
                        >
                          {t('book_appointment.change')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-[24px] bg-[#f2f2f1] dark:bg-slate-700 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">{t('book_appointment.available_staff')}</h3>
                <div className="flex gap-3">
                  <button type="button" className="rounded-2xl border border-gray-300 dark:border-slate-500 p-2.5 text-gray-900 dark:text-slate-200">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-2xl border border-gray-300 dark:border-slate-500 p-2.5 text-gray-900 dark:text-slate-200">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee('none')}
                  className="flex min-w-[92px] flex-col items-center text-center"
                >
                  <div className="mb-1 h-6" />
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[3px] ${selectedEmployee === 'none' ? 'border-[#4a90b0]' : 'border-gray-300 dark:border-slate-500'} bg-white dark:bg-slate-600 text-gray-500 dark:text-slate-300`}>
                    <UserGroupIcon className="h-7 w-7" />
                  </div>
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-green-500" />
                  <p className="mt-2 text-sm text-gray-800 dark:text-slate-300">{t('book_appointment.no_preference')}</p>
                </button>

                {filteredEmployees.map((employee) => {
                  const active = String(selectedEmployee) === String(employee.id);
                  const label = staffPreviewSlots[employee.id];
                  const initials = `${employee.user_details?.first_name?.[0] || ''}${employee.user_details?.last_name?.[0] || ''}`.trim() || 'E';
                  const isBlockedForSelectedTime =
                    !!selectedTime && !staffAvailabilityByTime[selectedTime]?.has(String(employee.id));

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => {
                        if (!isBlockedForSelectedTime) {
                          setSelectedEmployee(String(employee.id));
                        }
                      }}
                      disabled={isBlockedForSelectedTime}
                      className={`flex min-w-[92px] flex-col items-center text-center ${
                        isBlockedForSelectedTime ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                    >
                      <div className="mb-1 h-6 text-center text-[11px] font-semibold uppercase tracking-wide text-[#f28a32]">
                        {staffLoading ? '' : isBlockedForSelectedTime ? t('book_appointment.unavailable') : label ? t('book_appointment.from_time', { time: formatSlotTime(label) }) : ''}
                      </div>
                      <div className={`mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-[3px] ${active ? 'border-[#4a90b0]' : 'border-transparent'} bg-[#e9ecef] dark:bg-slate-600 text-xs font-semibold text-gray-700 dark:text-slate-200`}>
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
                      <p className="mt-2 max-w-[92px] text-sm text-gray-800 dark:text-slate-300">
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
            {t('book_appointment.add_another_service')}
          </button>

          <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-5">
            <div className="flex items-center justify-between text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              <span>{t('book_appointment.total')}</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBooking}
            disabled={!selectedSlot || submitting}
            className="mt-6 w-full rounded-2xl bg-[#4a90b0] px-5 py-3 text-sm md:text-base font-semibold text-white disabled:opacity-50"
          >
            {submitting ? t('book_appointment.booking') : t('book_appointment.continue')}
          </button>
        </aside>
      </div>
    </div>
  );
};

export default BookAppointment;
