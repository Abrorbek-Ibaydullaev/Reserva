import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { appointmentService } from '../../services/api';
import CancelAppointmentModal from '../../components/CancelAppointmentModal';

const normalizeList = (response) => response.data?.results || response.data || [];
const activeStatuses = ['pending', 'confirmed', 'rescheduled'];
const statusBadgeClasses = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-700',
  rescheduled: 'bg-violet-100 text-violet-800',
};

const BusinessAppointments = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointments();
      setAppointments(normalizeList(response));
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error(t('business_appointments.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setBusyId(appointmentId);
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success(t('business_appointments.marked_as', { status }));
      await loadAppointments();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      toast.error(t('business_appointments.failed_update'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (appointmentId) => {
    setCancelTargetId(appointmentId);
  };

  const handleConfirmCancel = async (reason) => {
    if (!cancelTargetId) return;

    try {
      setBusyId(cancelTargetId);
      await appointmentService.cancelAppointment(cancelTargetId, reason);
      toast.success(t('business_appointments.cancelled_success'));
      setCancelTargetId(null);
      await loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error(t('business_appointments.failed_cancel'));
    } finally {
      setBusyId(null);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === 'all') return true;
    if (filter === 'active') return activeStatuses.includes(appointment.status);
    return appointment.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0f1118] p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('business_appointments.title')}</h1>
            <p className="mt-2 text-gray-500 dark:text-slate-400">{t('business_appointments.subtitle')}</p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-2xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-[#4a90b0]"
          >
            <option value="all">{t('business_appointments.all_appointments')}</option>
            <option value="active">{t('business_appointments.active')}</option>
            <option value="pending">{t('business_appointments.pending')}</option>
            <option value="confirmed">{t('business_appointments.confirmed')}</option>
            <option value="completed">{t('business_appointments.completed')}</option>
            <option value="cancelled">{t('business_appointments.cancelled')}</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">{t('business_appointments.loading')}</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 dark:bg-slate-700 p-8 text-gray-500 dark:text-slate-400">
            {t('business_appointments.no_appointments')}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {appointment.service_details?.name}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusBadgeClasses[appointment.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-slate-300 md:grid-cols-2">
                      <p>
                        {t('business_appointments.customer_label')} {appointment.customer_details?.first_name} {appointment.customer_details?.last_name}
                      </p>
                      <p>{t('business_appointments.email_label')} {appointment.customer_details?.email}</p>
                      <p>{t('business_appointments.date_label')} {appointment.date}</p>
                      <p>{t('business_appointments.time_label')} {appointment.start_time}</p>
                      <p>{t('business_appointments.amount_label')} ${Number(appointment.total_amount || 0).toFixed(2)}</p>
                      <p>{t('business_appointments.duration_label')} {appointment.duration} {t('common.min')}</p>
                    </div>
                    {appointment.customer_notes ? (
                      <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                        {t('business_appointments.customer_note_label')} {appointment.customer_notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {appointment.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={busyId === appointment.id}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {t('business_appointments.confirm')}
                      </button>
                    ) : null}
                    {activeStatuses.includes(appointment.status) ? (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        disabled={busyId === appointment.id}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {t('business_appointments.complete')}
                      </button>
                    ) : null}
                    {activeStatuses.includes(appointment.status) ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(appointment.id)}
                        disabled={busyId === appointment.id}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                      >
                        {t('business_appointments.cancel')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CancelAppointmentModal
        isOpen={Boolean(cancelTargetId)}
        onClose={() => setCancelTargetId(null)}
        onConfirm={handleConfirmCancel}
        isLoading={Boolean(busyId)}
      />
    </div>
  );
};

export default BusinessAppointments;
