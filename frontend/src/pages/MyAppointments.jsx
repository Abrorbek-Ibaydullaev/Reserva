import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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
import {
  compareAppointmentAsc,
  compareAppointmentDesc,
  formatCalendarDate,
  formatClockTime,
  formatStatus,
  getAppointmentStart,
  responseList,
} from '../utils/data';

const fmtDate = (d) =>
  formatCalendarDate(d, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

const fmtTime = (t) => formatClockTime(t);

const STATUS_STYLE = {
  pending:     'bg-muted-token text-warning',
  confirmed:   'bg-muted-token text-brand',
  completed:   'bg-muted-token text-success',
  cancelled:   'bg-muted-token text-danger',
  rescheduled: 'bg-muted-token text-brand',
  no_show:     'bg-muted-token text-soft',
};

const TABS = ['Upcoming', 'Past', 'Cancelled'];

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
          className={`h-8 w-8 transition-colors ${n <= value ? 'text-warning' : 'text-muted hover:text-warning'}`}
        />
      </button>
    ))}
  </div>
);

// ── Review modal ──────────────────────────────────────────────────────────────
const ReviewModal = ({ appointment: a, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating.'); return; }
    if (!comment.trim()) { toast.error('Please write a comment.'); return; }
    try {
      setSubmitting(true);
      if (!a.service_details?.id) {
        toast.error('This appointment is missing service details.');
        return;
      }
      await serviceService.addReview(a.service_details.id, { rating, comment });
      toast.success('Review submitted — thank you!');
      onSubmitted(a.service_details.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'string' && msg.toLowerCase().includes('already')) {
        toast.info('You have already reviewed this service.');
        onSubmitted(a.service_details.id);
        onClose();
      } else {
        toast.error('Failed to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] bg-surface-token shadow-2xl">
        <div className="flex items-center justify-between border-b border-token px-6 py-4">
          <h2 className="text-base font-bold text-token">Rate your experience</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted-token">
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="mb-1 text-sm font-semibold text-soft">{a.service_details?.name}</p>
            <p className="text-xs text-muted">How would you rate this service?</p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] bg-app py-5">
            <StarPicker value={rating} onChange={setRating} />
            <p className="text-sm font-medium text-soft">
              {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-soft">Your review</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service…"
              className="w-full resize-none rounded-xl border border-token p-3 text-sm text-token placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Detail modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ appointment: a, onClose, onCancel, onStatusUpdate, onReview, isEmployee, isBusinessOwner, cancellingId, statusBusyId, reviewedIds }) => {
  if (!a) return null;
  const now = new Date();
  const start = getAppointmentStart(a);
  const canCancel =
    !isBusinessOwner &&
    !isEmployee &&
    ['pending', 'confirmed', 'rescheduled'].includes(a.status) &&
    start &&
    start > now;

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-surface-token shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-token px-6 py-4">
          <h2 className="text-base font-bold text-token">Appointment details</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted-token">
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Service + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-token">{a.service_details?.name}</p>
              {a.service_details?.category_name && (
                <p className="text-sm text-muted">{a.service_details.category_name}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[a.status] || 'bg-muted-token text-soft'}`}>
              {formatStatus(a.status)}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[var(--radius-lg)] bg-app p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <CalendarDaysIcon className="h-4 w-4" /> Date
              </div>
              <p className="text-sm font-semibold text-token">{fmtDate(a.date)}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-app p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <ClockIcon className="h-4 w-4" /> Time
              </div>
              <p className="text-sm font-semibold text-token">
                {fmtTime(a.start_time)} · {a.duration || 0} min
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-app p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <CurrencyDollarIcon className="h-4 w-4" /> Amount
              </div>
              <p className="text-sm font-semibold text-token">
                ${Number(a.total_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-app p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                <BriefcaseIcon className="h-4 w-4" /> Ref
              </div>
              <p className="text-xs font-semibold text-soft truncate">#{a.appointment_number}</p>
            </div>
          </div>

          {/* People */}
          <div className="rounded-[var(--radius-lg)] border border-token p-4 space-y-2">
            {(isBusinessOwner || isEmployee) && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircleIcon className="h-5 w-5 text-muted" />
                <span className="text-muted">Customer:</span>
                <span className="font-medium text-token">{custName}</span>
              </div>
            )}
            {!isEmployee && !isBusinessOwner && (
              <div className="flex items-center gap-2 text-sm">
                <BriefcaseIcon className="h-5 w-5 text-muted" />
                <span className="text-muted">Business:</span>
                <span className="font-medium text-token">{bName}</span>
              </div>
            )}
            {empName && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircleIcon className="h-5 w-5 text-muted" />
                <span className="text-muted">Staff:</span>
                <span className="font-medium text-token">{empName}</span>
              </div>
            )}
          </div>

          {a.customer_notes && (
            <div className="rounded-[var(--radius-lg)] bg-muted-token p-4 text-sm text-warning">
              <p className="font-semibold mb-1">Note</p>
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
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Confirm
                </button>
              )}
              <button
                onClick={() => onStatusUpdate(a.id, 'completed')}
                disabled={statusBusyId === a.id}
                className="flex-1 rounded-xl bg-success py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Complete
              </button>
              <button
                onClick={() => onCancel(a.id)}
                disabled={cancellingId === a.id}
                className="rounded-xl border border-token px-4 py-2.5 text-sm font-semibold text-danger disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(a.id)}
              disabled={cancellingId === a.id}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-token py-2.5 text-sm font-semibold text-danger hover:bg-muted-token disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5" />
              {cancellingId === a.id ? 'Cancelling…' : 'Cancel appointment'}
            </button>
          )}

          {/* Review button — only for customers with completed appointments */}
          {!isBusinessOwner && !isEmployee && a.status === 'completed' && a.service_details?.id && (
            reviewedIds.has(a.service_details.id) ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-muted-token py-2.5 text-sm font-semibold text-success">
                <StarIcon className="h-4 w-4 text-warning" />
                Review submitted — thank you!
              </div>
            ) : (
              <button
                onClick={() => onReview(a)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-token bg-muted-token py-2.5 text-sm font-semibold text-warning hover:bg-muted-token transition-colors"
              >
                <StarIcon className="h-4 w-4" />
                Leave a review
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
      className="w-full rounded-[var(--radius-lg)] border border-token bg-surface-token p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted-token">
            <CalendarDaysIcon className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-token">{a.service_details?.name}</p>
            <p className="truncate text-xs text-muted">{displayName}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[a.status] || 'bg-muted-token text-soft'}`}>
          {formatStatus(a.status)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <CalendarDaysIcon className="h-3.5 w-3.5" />
          {formatCalendarDate(a.date, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          {fmtTime(a.start_time)} · {a.duration || 0} min
        </span>
        <span className="ml-auto font-semibold text-soft">
          ${Number(a.total_amount || 0).toFixed(2)}
        </span>
      </div>
    </button>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const { user } = useAuth();
  const isBusinessOwner = user?.user_type === 'business_owner';
  const isEmployee = user?.user_type === 'employee';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Upcoming');
  const [selected, setSelected] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [cancellingId, setCancellingId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await appointmentService.getAllAppointments();
      setAppointments(responseList(r));
    } catch {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    const reason = window.prompt('Cancellation reason (optional):', '');
    if (reason === null) return;
    try {
      setCancellingId(id);
      await appointmentService.cancelAppointment(id, reason);
      toast.success('Appointment cancelled.');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setStatusBusyId(id);
      await appointmentService.updateAppointmentStatus(id, { status });
      toast.success(`Marked as ${status}.`);
      setSelected(null);
      await load();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setStatusBusyId(null);
    }
  };

  const now = new Date();

  const buckets = {
    Upcoming: appointments.filter(
      (a) => ['pending', 'confirmed', 'rescheduled'].includes(a.status) && (getAppointmentStart(a)?.getTime() ?? 0) > now.getTime()
    ).sort(compareAppointmentAsc),
    Past: appointments.filter(
      (a) => a.status === 'completed' || ((getAppointmentStart(a)?.getTime() ?? Number.MAX_SAFE_INTEGER) <= now.getTime() && !['cancelled', 'no_show'].includes(a.status))
    ).sort(compareAppointmentDesc),
    Cancelled: appointments.filter((a) => ['cancelled', 'no_show'].includes(a.status))
      .sort(compareAppointmentDesc),
  };

  const pageTitle = isBusinessOwner ? 'Service Bookings' : isEmployee ? 'My Schedule' : 'My Appointments';

  return (
    <div className="app-page p-0">
      {/* Header */}
      <div className="border-b border-token bg-surface-token px-4 py-6 backdrop-blur-xl border-token bg-surface-token">
        <div className="mx-auto max-w-3xl">
          <h1 className="app-title">{pageTitle}</h1>
          <p className="app-subtitle">
            {isBusinessOwner
              ? 'Customer bookings for your services'
              : isEmployee
              ? 'Appointments assigned to you'
              : 'Your upcoming and past appointments'}
          </p>

          {/* Tabs */}
          <div className="surface-subtle mt-5 flex gap-1 rounded-xl p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === t ? 'bg-surface-token text-token shadow-sm bg-muted-token text-token' : 'text-muted hover:text-soft'
                }`}
              >
                {t}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === t ? 'bg-muted-token text-brand' : 'bg-muted-token text-muted'}`}>
                  {buckets[t].length}
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
            <div className="app-spinner" />
          </div>
        ) : buckets[tab].length === 0 ? (
          <div className="ui-empty p-10 text-center">
            <p className="text-3xl mb-3">
              {tab === 'Upcoming' ? '📅' : tab === 'Past' ? '🗂️' : '❌'}
            </p>
            <h2 className="text-base font-semibold text-token">
              No {tab.toLowerCase()} appointments
            </h2>
            {tab === 'Upcoming' && !isBusinessOwner && !isEmployee && (
              <Link
                to="/services"
                className="btn-primary mt-4"
              >
                Browse services
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {buckets[tab].map((a) => (
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
    </div>
  );
};

export default MyAppointments;
