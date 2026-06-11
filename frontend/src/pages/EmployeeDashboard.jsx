import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const STATUS_STYLE = {
  pending:     'bg-amber-100 text-amber-800',
  confirmed:   'bg-blue-100 text-blue-800',
  completed:   'bg-emerald-100 text-emerald-800',
  cancelled:   'bg-red-100 text-red-800',
  rescheduled: 'bg-violet-100 text-violet-800',
};

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

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">
    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
);

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadAppts = () =>
    appointmentService
      .getAllAppointments()
      .then((r) => setAppointments(r.data.results || r.data || []))
      .catch(() => toast.error(t('employee_dashboard.failed_load')))
      .finally(() => setLoading(false));

  useEffect(() => { loadAppts(); }, []);

  const handleStatus = async (id, status) => {
    try {
      setBusyId(id);
      await appointmentService.updateAppointmentStatus(id, { status });
      toast.success(t('booking.marked_as', { status }));
      await loadAppts();
    } catch {
      toast.error(t('employee_dashboard.failed_update'));
    } finally {
      setBusyId(null);
    }
  };

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  const todayAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => apptStart(a) - apptStart(b));

  const upcoming = appointments
    .filter(
      (a) =>
        ['pending', 'confirmed', 'rescheduled'].includes(a.status) &&
        apptStart(a) > now
    )
    .sort((a, b) => apptStart(a) - apptStart(b));

  const completed = appointments.filter((a) => a.status === 'completed').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;

  const hour = now.getHours();
  const greetingKey = hour < 12 ? 'employee_dashboard.good_morning'
    : hour < 17 ? 'employee_dashboard.good_afternoon'
    : 'employee_dashboard.good_evening';

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t(greetingKey, { name: user?.first_name })}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {format(now, 'EEEE, MMMM d, yyyy')} ·{' '}
          {todayAppts.length === 1
            ? t('employee_dashboard.appointments_today', { count: todayAppts.length })
            : t('employee_dashboard.appointments_today_plural', { count: todayAppts.length })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('employee_dashboard.today')} value={todayAppts.length} icon={CalendarDaysIcon} color="bg-violet-50 text-violet-600" />
        <StatCard label={t('employee_dashboard.upcoming')} value={upcoming.length} icon={ClockIcon} color="bg-blue-50 text-blue-600" />
        <StatCard label={t('employee_dashboard.completed')} value={completed} icon={CheckCircleIcon} color="bg-emerald-50 text-emerald-600" />
        <StatCard label={t('employee_dashboard.awaiting_approval')} value={pending} icon={UserCircleIcon} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Today's schedule */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('employee_dashboard.todays_schedule')}</h2>
          <Link
            to="/employee/appointments"
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
          >
            {t('employee_dashboard.see_all')} <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-8 text-center">
            <p className="mb-2 text-2xl">🗓️</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('employee_dashboard.no_appointments_today')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map((a) => {
              const custName =
                [a.customer_details?.first_name, a.customer_details?.last_name]
                  .filter(Boolean).join(' ') ||
                a.customer_details?.email ||
                'Customer';
              const isPast = apptStart(a) < now;

              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${
                    isPast
                      ? 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                      : 'border-violet-100 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-900/10'
                  }`}
                >
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{fmtTime(a.start_time)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{a.duration}{t('common.min')}</p>
                  </div>

                  <div className="h-10 w-px flex-shrink-0 bg-slate-200 dark:bg-slate-600" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {a.service_details?.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
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
                      {a.status?.replace('_', ' ')}
                    </span>
                    {!isPast && ['pending', 'confirmed'].includes(a.status) && (
                      <div className="flex gap-1">
                        {a.status === 'pending' && (
                          <button
                            onClick={() => handleStatus(a.id, 'confirmed')}
                            disabled={busyId === a.id}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {t('employee_dashboard.confirm')}
                          </button>
                        )}
                        <button
                          onClick={() => handleStatus(a.id, 'completed')}
                          disabled={busyId === a.id}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {t('employee_dashboard.done')}
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
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('employee_dashboard.coming_up')}</h2>
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
                    className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 px-4 py-3"
                  >
                    <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {a.service_details?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{custName}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-medium">
                        {new Date(`${a.date}T00:00:00`).toLocaleDateString('en-US', {
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
