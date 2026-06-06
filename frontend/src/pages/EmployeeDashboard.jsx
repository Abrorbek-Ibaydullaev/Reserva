import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { appointmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  compareAppointmentAsc,
  formatCalendarDate,
  formatClockTime,
  getAppointmentStart,
  responseList,
} from '../utils/data';

const STATUS_STYLE = {
  pending: 'badge-warning',
  confirmed: 'badge-brand',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  rescheduled: 'badge-brand',
};

const fmtTime = (t) => formatClockTime(t);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="app-card flex items-center gap-4 p-4">
    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-token">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  </div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadAppts = () =>
    appointmentService
      .getAllAppointments()
      .then((r) => setAppointments(responseList(r)))
      .catch(() => toast.error('Failed to load appointments.'))
      .finally(() => setLoading(false));

  useEffect(() => { loadAppts(); }, []);

  const handleStatus = async (id, status) => {
    try {
      setBusyId(id);
      await appointmentService.updateAppointmentStatus(id, { status });
      toast.success(`Marked as ${status}.`);
      await loadAppts();
    } catch {
      toast.error('Failed to update.');
    } finally {
      setBusyId(null);
    }
  };

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort(compareAppointmentAsc);

  const upcoming = appointments
    .filter(
      (a) =>
        ['pending', 'confirmed', 'rescheduled'].includes(a.status) &&
        (getAppointmentStart(a)?.getTime() ?? 0) > now.getTime()
    )
    .sort(compareAppointmentAsc);

  const completed = appointments.filter((a) => a.status === 'completed').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="app-spinner h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="app-page space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="app-title">
          Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.first_name} 👋
        </h1>
        <p className="app-subtitle">
          {format(now, 'EEEE, MMMM d, yyyy')} ·{' '}
          {todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today" value={todayAppts.length} icon={CalendarDaysIcon} color="bg-muted-token text-brand" />
        <StatCard label="Upcoming" value={upcoming.length} icon={ClockIcon} color="bg-muted-token text-brand" />
        <StatCard label="Completed" value={completed} icon={CheckCircleIcon} color="bg-muted-token text-success" />
        <StatCard label="Awaiting approval" value={pending} icon={UserCircleIcon} color="bg-muted-token text-warning" />
      </div>

      {/* Today's schedule */}
      <div className="app-card-pad">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-token">Today's Schedule</h2>
          <Link
            to="/employee/appointments"
            className="flex items-center gap-1 text-xs font-medium text-brand hover:underline text-brand"
          >
            See all <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="ui-empty text-center">
            <p className="mb-2 text-2xl">🗓️</p>
            <p className="text-sm text-muted">No appointments scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map((a) => {
              const custName =
                [a.customer_details?.first_name, a.customer_details?.last_name]
                  .filter(Boolean).join(' ') ||
                a.customer_details?.email ||
                'Customer';
              const isPast = (getAppointmentStart(a)?.getTime() ?? 0) < now.getTime();

              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${
                    isPast
                      ? 'border-token bg-app border-token bg-surface-token'
                      : 'border-token bg-muted-token border-token dark:bg-muted-token0/10'
                  }`}
                >
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-token">{fmtTime(a.start_time)}</p>
                    <p className="text-xs text-muted">{a.duration || 0}min</p>
                  </div>

                  <div className="h-10 w-px flex-shrink-0 bg-muted-token" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-token">
                      {a.service_details?.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <UserCircleIcon className="h-3.5 w-3.5" />
                      {custName}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        STATUS_STYLE[a.status] || ''
                      }`}
                    >
                        {String(a.status || 'unknown').replace(/_/g, ' ')}
                    </span>
                    {!isPast && ['pending', 'confirmed'].includes(a.status) && (
                      <div className="flex gap-1">
                        {a.status === 'pending' && (
                          <button
                            onClick={() => handleStatus(a.id, 'confirmed')}
                            disabled={busyId === a.id}
                            className="btn-primary px-2.5 py-1 text-xs"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleStatus(a.id, 'completed')}
                          disabled={busyId === a.id}
                          className="inline-flex items-center justify-center rounded-xl bg-success px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-success disabled:opacity-60"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coming up (non-today upcoming) */}
      {upcoming.filter((a) => a.date !== today).length > 0 && (
        <div className="app-card-pad">
          <h2 className="mb-4 font-semibold text-token">Coming up</h2>
          <div className="space-y-2">
            {upcoming
              .filter((a) => a.date !== today)
              .slice(0, 5)
              .map((a) => {
                const custName =
                  [a.customer_details?.first_name, a.customer_details?.last_name]
                    .filter(Boolean).join(' ') || 'Customer';
                return (
                  <div
                    key={a.id}
                    className="surface-subtle flex items-center gap-3 rounded-xl px-4 py-3"
                  >
                    <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-token">
                        {a.service_details?.name}
                      </p>
                      <p className="text-xs text-muted">{custName}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p className="font-medium">
                        {formatCalendarDate(a.date, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p>{fmtTime(a.start_time)}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
