import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { appointmentService, scheduleService, serviceService } from '../services/api';

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#6b7280',
  rescheduled: '#8b5cf6',
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const normalizeList = (response) => response.data?.results || response.data || [];

const BusinessDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    activeServices: 0,
    totalEmployees: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState([]);
  const [weekDelta, setWeekDelta] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [appointmentsResponse, servicesResponse, employeesResponse] = await Promise.all([
        appointmentService.getAllAppointments(),
        serviceService.getMyServices(),
        scheduleService.getEmployees(),
      ]);

      const appointments = normalizeList(appointmentsResponse);
      const services = normalizeList(servicesResponse);
      const employees = normalizeList(employeesResponse);
      const today = format(new Date(), 'yyyy-MM-dd');

      const completedAppointments = appointments.filter((item) => item.status === 'completed');
      const totalRevenue = completedAppointments.reduce(
        (sum, item) => sum + Number(item.total_amount || 0),
        0
      );

      setStats({
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter((item) => item.status === 'pending').length,
        todayAppointments: appointments.filter(
          (item) => item.date === today && item.status !== 'cancelled'
        ).length,
        completedAppointments: completedAppointments.length,
        totalRevenue,
        activeServices: services.filter((item) => item.is_active).length,
        totalEmployees: employees.filter((item) => item.is_active).length,
      });

      setRecentAppointments(
        [...appointments]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      );

      setRevenueData(buildRevenueData(appointments));
      setAppointmentStatusData(buildStatusData(appointments));
      setWeekDelta(buildWeekDelta(appointments));
    } catch (err) {
      console.error('Failed to load business dashboard:', err);
      setError('Failed to load dashboard data.');
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

  const buildStatusData = (appointments) => {
    const counts = appointments.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: statusColors[status] || '#94a3b8',
    }));
  };

  const buildWeekDelta = (appointments) => {
    const currentWeekStart = subDays(new Date(), 6);
    const previousWeekStart = subDays(new Date(), 13);

    const currentWeekCount = appointments.filter(
      (item) => new Date(item.date) >= currentWeekStart
    ).length;
    const previousWeekCount = appointments.filter((item) => {
      const appointmentDate = new Date(item.date);
      return appointmentDate >= previousWeekStart && appointmentDate < currentWeekStart;
    }).length;

    if (previousWeekCount === 0) {
      return currentWeekCount > 0 ? 100 : 0;
    }

    return Math.round(((currentWeekCount - previousWeekCount) / previousWeekCount) * 100);
  };

  const getStatusBadge = (status) => {
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
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="mt-2 text-gray-600">Live performance, bookings, staff, and service activity.</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600 shadow-sm border border-gray-200">
            {weekDelta >= 0 ? '+' : ''}
            {weekDelta}% appointments vs previous 7 days
          </div>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalAppointments}
            subtitle={`${stats.pendingAppointments} pending`}
            icon={<CalendarIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Today"
            value={stats.todayAppointments}
            subtitle={`${stats.completedAppointments} completed overall`}
            icon={<ClockIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Revenue"
            value={formatMoney(stats.totalRevenue)}
            subtitle="From completed appointments"
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Team & Services"
            value={`${stats.totalEmployees} / ${stats.activeServices}`}
            subtitle="Active employees / active services"
            icon={<UserGroupIcon className="h-6 w-6" />}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Revenue Last 7 Days</h2>
                <p className="text-sm text-gray-500">Updated from live appointment data</p>
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
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Booking Status Mix</h2>
              <p className="text-sm text-gray-500">Distribution of all current statuses</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {appointmentStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Appointments']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
              <p className="text-sm text-gray-500">Latest customer bookings for your services</p>
            </div>
            <Link to="/dashboard/appointments" className="inline-flex items-center text-sm font-semibold text-[#4a90b0]">
              View all
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-10 text-center text-gray-500">
              No bookings yet. Publish services to start receiving appointments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {appointment.customer_details?.first_name} {appointment.customer_details?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{appointment.customer_details?.email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{appointment.service_details?.name}</div>
                        <div>{appointment.duration} min</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div>{format(new Date(appointment.date), 'MMM dd, yyyy')}</div>
                        <div className="text-gray-500">{appointment.start_time}</div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatMoney(appointment.total_amount)}
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(appointment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link to="/dashboard/services" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-blue-700">{stats.activeServices} active</span>
            </div>
            <h3 className="font-semibold text-gray-900">Manage Services</h3>
            <p className="mt-2 text-sm text-gray-500">Create, edit, and pause services.</p>
          </Link>

          <Link to="/dashboard/appointments" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-emerald-700">{stats.todayAppointments} today</span>
            </div>
            <h3 className="font-semibold text-gray-900">Manage Appointments</h3>
            <p className="mt-2 text-sm text-gray-500">Confirm, complete, or cancel bookings.</p>
          </Link>

          <Link to="/dashboard/employees" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-violet-700">{stats.totalEmployees} active</span>
            </div>
            <h3 className="font-semibold text-gray-900">Manage Employees</h3>
            <p className="mt-2 text-sm text-gray-500">Add staff and assign services.</p>
          </Link>

          <Link to="/dashboard/schedule" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-amber-700">7-day setup</span>
            </div>
            <h3 className="font-semibold text-gray-900">Business Hours</h3>
            <p className="mt-2 text-sm text-gray-500">Control when customers can book.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
