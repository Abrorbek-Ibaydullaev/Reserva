import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateValue) =>
  new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getAppointmentStart = (appointment) => {
  const [hours, minutes] = appointment.start_time.split(':').map(Number);
  const start = new Date(`${appointment.date}T00:00:00`);
  start.setHours(hours, minutes, 0, 0);
  return start;
};

const statusClasses = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-purple-100 text-purple-800',
};

const MyAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const isBusinessOwner = user?.user_type === 'business_owner';
  const isEmployee = user?.user_type === 'employee';

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAllAppointments();
      const items = response.data.results || response.data || [];
      setAppointments(items);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    const reason = window.prompt('Cancellation reason (optional):', '');
    if (reason === null) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Appointment cancelled.');
      await loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.details ||
          'Failed to cancel appointment.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setStatusBusyId(appointmentId);
      await appointmentService.updateAppointmentStatus(appointmentId, { status });
      toast.success(`Appointment marked as ${status}.`);
      await loadAppointments();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      toast.error('Failed to update appointment status.');
    } finally {
      setStatusBusyId(null);
    }
  };

  const now = new Date();

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) &&
      getAppointmentStart(appointment) > now
  );

  const pastAppointments = appointments.filter(
    (appointment) =>
      !(
        ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) &&
        getAppointmentStart(appointment) > now
      )
  );

  const renderAppointmentCard = (appointment) => {
    const businessName =
      appointment.business_owner_details?.first_name || appointment.business_owner_details?.last_name
        ? `${appointment.business_owner_details?.first_name || ''} ${appointment.business_owner_details?.last_name || ''}`.trim()
        : appointment.business_owner_details?.email || 'Business';
    const customerName =
      appointment.customer_details?.first_name || appointment.customer_details?.last_name
        ? `${appointment.customer_details?.first_name || ''} ${appointment.customer_details?.last_name || ''}`.trim()
        : appointment.customer_details?.email || 'Customer';
    const employeeName =
      appointment.employee_details?.user_details?.first_name || appointment.employee_details?.user_details?.last_name
        ? `${appointment.employee_details?.user_details?.first_name || ''} ${appointment.employee_details?.user_details?.last_name || ''}`.trim()
        : appointment.employee_details?.user_details?.email || 'Assigned staff';
    const counterpartName = isBusinessOwner ? customerName : isEmployee ? customerName : businessName;

    return (
      <div
        key={appointment.id}
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 ${isEmployee ? 'cursor-pointer transition hover:border-[#4a90b0] hover:shadow-md' : ''}`}
        onClick={isEmployee ? () => navigate('/employee/appointments') : undefined}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {appointment.service_details?.name}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  statusClasses[appointment.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {appointment.status}
              </span>
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>
                  {formatTime(appointment.start_time)} • {appointment.duration} min
                </span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>{counterpartName}</span>
              </div>
              {(isBusinessOwner || isEmployee) && appointment.customer_details?.email && (
                <div className="pl-7 text-sm text-gray-500">
                  {appointment.customer_details.email}
                </div>
              )}
              {isEmployee ? (
                <div className="pl-7 text-sm text-gray-500">
                  Business: {businessName}
                </div>
              ) : null}
              {!isEmployee && !isBusinessOwner && appointment.employee_details ? (
                <div className="pl-7 text-sm text-gray-500">
                  Staff: {employeeName}
                </div>
              ) : null}
            </div>

            {appointment.customer_notes && (
              <p className="mt-4 text-sm text-gray-500">
                {isBusinessOwner || isEmployee ? `Customer note: ${appointment.customer_notes}` : appointment.customer_notes}
              </p>
            )}
          </div>

          <div className="md:text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${Number(appointment.total_amount || 0).toFixed(2)}
            </div>
            {isEmployee && ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) ? (
              <div className="mt-4 flex flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                {appointment.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                    disabled={statusBusyId === appointment.id}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                  disabled={statusBusyId === appointment.id}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(appointment.id)}
                  disabled={cancellingId === appointment.id}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                >
                  {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            ) : null}
            {!isBusinessOwner &&
              !isEmployee &&
              ['pending', 'confirmed', 'rescheduled'].includes(appointment.status) &&
              getAppointmentStart(appointment) > now && (
              <button
                type="button"
                onClick={() => handleCancel(appointment.id)}
                disabled={cancellingId === appointment.id}
                className="mt-4 inline-flex items-center rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            {isBusinessOwner ? 'Service Bookings' : isEmployee ? 'My Schedule' : 'My Appointments'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isBusinessOwner
              ? 'Review bookings made by customers for your services.'
              : isEmployee
                ? 'See your assigned bookings, upcoming schedule, and finished work.'
              : 'View upcoming bookings, review past visits, and cancel if needed.'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
              {isBusinessOwner ? 'No customer bookings yet' : isEmployee ? 'No assigned appointments yet' : 'No appointments yet'}
              </h2>
              <p className="text-gray-600 mt-3">
              {isBusinessOwner
                ? 'Bookings for your services will appear here.'
                : isEmployee
                  ? 'Appointments assigned to you will appear here.'
                : 'Book a service to see it here.'}
              </p>
            {!isBusinessOwner && !isEmployee && (
              <Link
                to="/services"
                className="inline-flex mt-6 rounded-xl bg-primary-600 px-5 py-3 text-white font-semibold hover:bg-primary-700"
              >
                Browse services
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Upcoming</h2>
                <span className="text-sm text-gray-500">{upcomingAppointments.length} active</span>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(renderAppointmentCard)
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
                    No upcoming appointments.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">History</h2>
                <span className="text-sm text-gray-500">{pastAppointments.length} items</span>
              </div>
              <div className="space-y-4">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map(renderAppointmentCard)
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
                    No past appointments yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
