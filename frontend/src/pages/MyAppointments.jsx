import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { categoryKey } from '../../../shared/categories.js';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { appointmentService, serviceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CancelAppointmentModal from '../components/CancelAppointmentModal';

const fmtDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const apptStart = (a) => {
  const [h, m] = a.start_time.split(':').map(Number);
  const d = new Date(`${a.date}T00:00:00`); d.setHours(h, m);
  return d;
};

const STATUS_STYLE = {
  pending:     'bg-amber-100 text-amber-800',
  confirmed:   'bg-blue-100 text-blue-800',
  completed:   'bg-emerald-100 text-emerald-800',
  cancelled:   'bg-red-100 text-red-800',
  rescheduled: 'bg-violet-100 text-violet-800',
  no_show:     'bg-slate-100 text-slate-600',
};

// ── Star picker ───────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="focus:outline-none"
      >
        <StarIcon
          className={`h-8 w-8 transition-colors ${n <= value ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
        />
      </button>
    ))}
  </div>
);

// ── Review modal ──────────────────────────────────────────────────────────────
const ReviewModal = ({ appointment: a, onClose, onSubmitted }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels = ['', t('booking.rating_poor'), t('booking.rating_fair'), t('booking.rating_good'), t('booking.rating_very_good'), t('booking.rating_excellent')];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error(t('booking.select_star')); return; }
    if (!comment.trim()) { toast.error(t('booking.write_comment')); return; }
    try {
      setSubmitting(true);
      await serviceService.addReview(a.service_details.id, { rating, comment });
      toast.success(t('booking.review_submitted'));
      onSubmitted(a.service_details.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'string' && msg.toLowerCase().includes('already')) {
        toast.info(t('booking.already_reviewed'));
        onSubmitted(a.service_details.id);
        onClose();
      } else {
        toast.error(t('booking.failed_submit_review'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">{t('booking.rate_experience')}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-700">{a.service_details?.name}</p>
            <p className="text-xs text-slate-400">{t('booking.how_would_you_rate')}</p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-5">
            <StarPicker value={rating} onChange={setRating} />
            <p className="text-sm font-medium text-slate-600">
              {rating === 0 ? t('booking.tap_to_rate') : ratingLabels[rating]}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('booking.your_review')}</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('booking.review_placeholder')}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? t('booking.submitting') : t('booking.submit_review')}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Detail modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ appointment: a, onClose, onCancel, onStatusUpdate, onReview, isEmployee, isBusinessOwner, cancellingId, statusBusyId, reviewedIds }) => {
  const { t } = useTranslation();
  if (!a) return null;
  const now = new Date();
  const canCancel =
    !isBusinessOwner &&
    !isEmployee &&
    ['pending', 'confirmed', 'rescheduled'].includes(a.status) &&
    apptStart(a) > now;

  const bName =
    [a.business_owner_details?.first_name, a.business_owner_details?.last_name]
      .filter(Boolean).join(' ') || a.business_owner_details?.email || 'Business';
  const empName =
    [a.employee_details?.user_details?.first_name, a.employee_details?.user_details?.last_name]
      .filter(Boolean).join(' ') || null;
  const custName =
    [a.customer_details?.first_name, a.customer_details?.last_name]
      .filter(Boolean).join(' ') || a.customer_details?.email || 'Customer';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">{t('booking.appointment_details')}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Service + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-slate-900">{a.service_details?.name}</p>
              {a.service_details?.category_name && (
                <p className="text-sm text-slate-500">{t(categoryKey(a.service_details.category_name), { defaultValue: a.service_details.category_name })}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>
              {a.status?.replace('_', ' ')}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDaysIcon className="h-4 w-4" /> {t('booking.date')}
              </div>
              <p className="break-words text-sm font-semibold text-slate-900">{fmtDate(a.date)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                <ClockIcon className="h-4 w-4" /> {t('booking.time')}
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {fmtTime(a.start_time)} · {a.duration} {t('common.min')}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                <CurrencyDollarIcon className="h-4 w-4" /> {t('booking.amount')}
              </div>
              <p className="text-sm font-semibold text-slate-900">
                ${Number(a.total_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                <BriefcaseIcon className="h-4 w-4" /> {t('booking.ref')}
              </div>
              <p className="text-xs font-semibold text-slate-700 truncate">#{a.appointment_number}</p>
            </div>
          </div>

          {/* People */}
          <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
            {(isBusinessOwner || isEmployee) && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircleIcon className="h-5 w-5 text-slate-400" />
                <span className="text-slate-500">{t('booking.customer')}</span>
                <span className="font-medium text-slate-900">{custName}</span>
              </div>
            )}
            {!isEmployee && !isBusinessOwner && (
              <div className="flex items-center gap-2 text-sm">
                <BriefcaseIcon className="h-5 w-5 text-slate-400" />
                <span className="text-slate-500">{t('booking.business')}</span>
                <span className="font-medium text-slate-900">{bName}</span>
              </div>
            )}
            {empName && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircleIcon className="h-5 w-5 text-slate-400" />
                <span className="text-slate-500">{t('booking.staff')}</span>
                <span className="font-medium text-slate-900">{empName}</span>
              </div>
            )}
          </div>

          {a.customer_notes && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">{t('booking.note')}</p>
              <p>{a.customer_notes}</p>
            </div>
          )}

          {/* Actions */}
          {isEmployee && ['pending', 'confirmed', 'rescheduled'].includes(a.status) && (
            <div className="flex gap-2">
              {a.status === 'pending' && (
                <button
                  onClick={() => onStatusUpdate(a.id, 'confirmed')}
                  disabled={statusBusyId === a.id}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {t('booking.confirm')}
                </button>
              )}
              <button
                onClick={() => onStatusUpdate(a.id, 'completed')}
                disabled={statusBusyId === a.id}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t('booking.complete')}
              </button>
              <button
                onClick={() => onCancel(a.id)}
                disabled={cancellingId === a.id}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
              >
                {t('booking.cancel')}
              </button>
            </div>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(a.id)}
              disabled={cancellingId === a.id}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5" />
              {cancellingId === a.id ? t('booking.cancelling') : t('booking.cancel')}
            </button>
          )}

          {/* Review button — only for customers with completed appointments */}
          {!isBusinessOwner && !isEmployee && a.status === 'completed' && a.service_details?.id && (
            reviewedIds.has(a.service_details.id) ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
                <StarIcon className="h-4 w-4 text-amber-400" />
                {t('booking.review_submitted')}
              </div>
            ) : (
              <button
                onClick={() => onReview(a)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <StarIcon className="h-4 w-4" />
                {t('booking.leave_review')}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ── Appointment card ──────────────────────────────────────────────────────────
const ApptCard = ({ appointment: a, onClick, isBusinessOwner, isEmployee }) => {
  const bName =
    [a.business_owner_details?.first_name, a.business_owner_details?.last_name]
      .filter(Boolean).join(' ') || a.business_owner_details?.email || 'Business';
  const custName =
    [a.customer_details?.first_name, a.customer_details?.last_name]
      .filter(Boolean).join(' ') || a.customer_details?.email || 'Customer';
  const displayName = (isBusinessOwner || isEmployee) ? custName : bName;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{a.service_details?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{displayName}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>
          {a.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <CalendarDaysIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {new Date(`${a.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {fmtTime(a.start_time)} · {a.duration} min
        </span>
        <span className="ml-auto font-semibold text-slate-700 dark:text-slate-300">
          ${Number(a.total_amount || 0).toFixed(2)}
        </span>
      </div>
    </button>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isBusinessOwner = user?.user_type === 'business_owner';
  const isEmployee = user?.user_type === 'employee';

  const TABS = [t('booking.upcoming'), t('booking.past'), t('booking.cancelled')];
  const TAB_KEYS = ['Upcoming', 'Past', 'Cancelled'];

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await appointmentService.getAllAppointments();
      setAppointments(r.data.results || r.data || []);
    } catch {
      toast.error(t('booking.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = (id) => {
    setCancelTargetId(id);
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelTargetId) return;

    try {
      setCancellingId(cancelTargetId);
      await appointmentService.cancelAppointment(cancelTargetId, reason);
      toast.success(t('booking.cancelled_success'));
      setCancelTargetId(null);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('booking.failed_to_cancel'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setStatusBusyId(id);
      await appointmentService.updateAppointmentStatus(id, { status });
      toast.success(t('booking.marked_as', { status }));
      setSelected(null);
      await load();
    } catch {
      toast.error(t('booking.failed_update_status'));
    } finally {
      setStatusBusyId(null);
    }
  };

  const now = new Date();

  const buckets = [
    appointments.filter(
      (a) => ['pending', 'confirmed', 'rescheduled'].includes(a.status) && apptStart(a) > now
    ).sort((a, b) => apptStart(a) - apptStart(b)),
    appointments.filter(
      (a) => a.status === 'completed' || (apptStart(a) <= now && !['cancelled', 'no_show'].includes(a.status))
    ).sort((a, b) => apptStart(b) - apptStart(a)),
    appointments.filter((a) => ['cancelled', 'no_show'].includes(a.status))
      .sort((a, b) => apptStart(b) - apptStart(a)),
  ];

  const emptyLabels = [t('booking.no_upcoming'), t('booking.no_past'), t('booking.no_cancelled')];

  const pageTitle = isBusinessOwner ? t('booking.service_bookings') : isEmployee ? t('booking.my_schedule') : t('booking.your_appointments');
  const pageSubtitle = isBusinessOwner
    ? t('booking.customer_bookings')
    : isEmployee
    ? t('booking.appointments_assigned')
    : t('booking.your_appointments');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1118]">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pageSubtitle}</p>

          {/* Tabs */}
          <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {TABS.map((tabLabel, idx) => (
              <button
                key={TAB_KEYS[idx]}
                onClick={() => setActiveTabIdx(idx)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  activeTabIdx === idx ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tabLabel}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTabIdx === idx ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                  {buckets[idx].length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : buckets[activeTabIdx].length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
            <p className="text-3xl mb-3">
              {activeTabIdx === 0 ? '📅' : activeTabIdx === 1 ? '🗂️' : '❌'}
            </p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {emptyLabels[activeTabIdx]}
            </h2>
            {activeTabIdx === 0 && !isBusinessOwner && !isEmployee && (
              <Link
                to="/services"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t('booking.browse_services')}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {buckets[activeTabIdx].map((a) => (
              <ApptCard
                key={a.id}
                appointment={a}
                isBusinessOwner={isBusinessOwner}
                isEmployee={isEmployee}
                onClick={() => setSelected(a)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <DetailModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
          onStatusUpdate={handleStatusUpdate}
          onReview={(a) => { setReviewTarget(a); setSelected(null); }}
          isBusinessOwner={isBusinessOwner}
          isEmployee={isEmployee}
          cancellingId={cancellingId}
          statusBusyId={statusBusyId}
          reviewedIds={reviewedIds}
        />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          appointment={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={(serviceId) =>
            setReviewedIds((prev) => new Set([...prev, serviceId]))
          }
        />
      )}

      <CancelAppointmentModal
        isOpen={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleConfirmCancel}
        isLoading={Boolean(cancellingId)}
      />
    </div>
  );
};

export default MyAppointments;
