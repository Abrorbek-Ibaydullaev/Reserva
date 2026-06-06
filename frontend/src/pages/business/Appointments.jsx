import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { appointmentService } from '../../services/api';
import { formatStatus, responseList } from '../../utils/data';

const normalizeList = responseList;
const activeStatuses = ['pending', 'confirmed', 'rescheduled'];
const statusBadgeClasses = {
  pending: 'bg-muted-token text-warning',
  confirmed: 'bg-muted-token text-brand',
  completed: 'bg-muted-token text-success',
  cancelled: 'bg-muted-token text-danger',
  no_show: 'bg-muted-token text-soft',
  rescheduled: 'bg-muted-token text-brand',
};

const BusinessAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointments();
      setAppointments(normalizeList(response));
    } catch {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setBusyId(appointmentId);
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success(`Appointment marked as ${status}.`);
      await loadAppointments();
    } catch {
      toast.error('Failed to update appointment status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (appointmentId) => {
    const reason = window.prompt('Cancellation reason:', '');
    if (reason === null) {
      return;
    }

    try {
      setBusyId(appointmentId);
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Appointment cancelled.');
      await loadAppointments();
    } catch {
      toast.error('Failed to cancel appointment.');
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
    <div className="app-page">
      <div className="app-container app-card-pad">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="app-title">Appointments</h1>
            <p className="app-subtitle">Manage customer bookings for your services.</p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-w-56"
          >
            <option value="all">All appointments</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-sm text-muted">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="ui-empty">No appointments found.</div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-xl border border-token bg-surface-token p-5 transition hover:border-token hover:shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-token">
                        {appointment.service_details?.name || 'Service'}
                      </h2>
                      <span
                        className={`ui-chip ${
                          statusBadgeClasses[appointment.status] || 'bg-muted-token text-soft'
                        }`}
                      >
                        {formatStatus(appointment.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-soft md:grid-cols-2">
                      <p>
                        Customer: {[appointment.customer_details?.first_name, appointment.customer_details?.last_name].filter(Boolean).join(' ') || 'Customer'}
                      </p>
                      <p>Email: {appointment.customer_details?.email || 'Not provided'}</p>
                      <p>Date: {appointment.date || 'Date TBD'}</p>
                      <p>Time: {appointment.start_time || 'Time TBD'}</p>
                      <p>Amount: ${Number(appointment.total_amount || 0).toFixed(2)}</p>
                      <p>Duration: {appointment.duration || 0} min</p>
                    </div>
                    {appointment.customer_notes ? (
                      <p className="mt-3 text-sm text-muted">
                        Customer note: {appointment.customer_notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {appointment.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={busyId === appointment.id}
                        className="btn-primary"
                      >
                        Confirm
                      </button>
                    ) : null}
                    {activeStatuses.includes(appointment.status) ? (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        disabled={busyId === appointment.id}
                        className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-success disabled:opacity-60"
                      >
                        Complete
                      </button>
                    ) : null}
                    {activeStatuses.includes(appointment.status) ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(appointment.id)}
                        disabled={busyId === appointment.id}
                        className="btn-danger"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAppointments;
