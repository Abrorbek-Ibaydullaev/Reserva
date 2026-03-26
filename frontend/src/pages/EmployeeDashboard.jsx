import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';
import { appointmentService } from '../services/api';

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const normalizeList = (response) => response.data?.results || response.data || [];

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const getAppointmentDateTime = (appointment) =>
    new Date(`${appointment.date}T${appointment.start_time}`);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const appointmentsResponse = await appointmentService.getAllAppointments();
      const appointments = normalizeList(appointmentsResponse);
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const completedAppointments = appointments.filter((item) => item.status === 'completed');

      setStats({
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter((item) => item.date === today).length,
        upcomingAppointments: appointments.filter(
          (item) =>
            ['pending', 'confirmed', 'rescheduled'].includes(item.status) &&
            getAppointmentDateTime(item) > now
        ).length,
        completedAppointments: completedAppointments.length,
        totalRevenue: completedAppointments.reduce(
          (sum, item) => sum + Number(item.total_amount || 0),
          0
        ),
      });

      setRecentAppointments(
        [...appointments]
          .sort((a, b) => getAppointmentDateTime(b) - getAppointmentDateTime(a))
          .slice(0, 5)
      );

      setRevenueData(buildRevenueData(appointments));
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError('Failed to load employee dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const buildRevenueData = (appointments) => {
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = subDays(new Date(), offset);
      const dayKey = format(day, 'yyyy-MM-dd');
      const revenue = appointments
        .filter((item) => item.date === dayKey && item.status === 'completed')
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

      days.push({
        label: format(day, 'EEE'),
        revenue,
      });
    }

    return days;
  };

  const statusBadge = (status) => {
    const palette = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-slate-100 text-slate-700',
      rescheduled: 'bg-violet-100 text-violet-800',
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${palette[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const StatCard = ({ title, value, subtitle, icon }) => (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="rounded-2xl bg-[#e8f2f6] p-3 text-[#4a90b0]">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your own bookings, schedule, and completed revenue.</p>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            subtitle={`${stats.upcomingAppointments} upcoming`}
            icon={<CalendarIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Today"
            value={stats.todayAppointments}
            subtitle="Scheduled for today"
            icon={<ClockIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Completed"
            value={stats.completedAppointments}
            subtitle="Finished appointments"
            icon={<CheckCircleIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Revenue"
            value={formatMoney(stats.totalRevenue)}
            subtitle="From your completed appointments"
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Revenue Last 7 Days</h2>
                <p className="text-sm text-gray-500">Only your completed work is included here.</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatMoney(revenueData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
                <p className="text-sm text-gray-500">7-day total</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid stroke="#edf2f7" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value) => [formatMoney(value), 'Revenue']} />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    stroke="#4a90b0"
                    fill="#4a90b0"
                    fillOpacity={0.15}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Schedule</h2>
                <p className="text-sm text-gray-500">Your latest assigned appointments.</p>
              </div>
              <Link to="/employee/appointments" className="inline-flex items-center text-sm font-semibold text-[#4a90b0]">
                View all
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-8 text-gray-500">No assigned appointments yet.</div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    to="/employee/appointments"
                    className="block rounded-2xl border border-gray-200 p-4 transition hover:border-[#4a90b0] hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{appointment.service_details?.name}</h3>
                          {statusBadge(appointment.status)}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {appointment.customer_details?.first_name} {appointment.customer_details?.last_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {appointment.date} at {appointment.start_time}
                        </p>
                      </div>
                      <div className="text-right text-sm font-semibold text-gray-900">
                        {formatMoney(appointment.total_amount)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
