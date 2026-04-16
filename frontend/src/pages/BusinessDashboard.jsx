import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellAlertIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { appointmentService } from '../services/api';

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#64748b',
  rescheduled: '#8b5cf6',
};

const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatPercentDelta = (value) => `${value >= 0 ? '+' : ''}${value}%`;

const BusinessDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentService.getBusinessDashboardStats();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load business dashboard:', err);
      setError('Failed to load business dashboard statistics.');
    } finally {
      setLoading(false);
    }
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
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          palette[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {String(status).replace('_', ' ')}
      </span>
    );
  };

  const StatCard = ({ title, value, subtitle, delta, icon, tone = 'sky' }) => {
    const tones = {
      sky: 'bg-[#e8f2f6] text-[#4a90b0]',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
      violet: 'bg-violet-50 text-violet-600',
      rose: 'bg-rose-50 text-rose-600',
      slate: 'bg-slate-100 text-slate-700',
    };

    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <div className={`rounded-2xl p-3 ${tones[tone] || tones.sky}`}>{icon}</div>
        </div>
        {delta ? (
          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {delta}
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error || 'Dashboard data is unavailable.'}
          </div>
        </div>
      </div>
    );
  }

  const { overview, trends, status_breakdown, busiest_days, top_services, top_employees } =
    dashboard;
  const statusData = status_breakdown.map((item) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: statusColors[item.status] || '#94a3b8',
  }));

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Business Dashboard</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Dynamic business intelligence for bookings, revenue, staff workload, service
              demand, and schedule health.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Last 30 Days
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatPercentDelta(overview.appointment_delta_30_days)} bookings
              </p>
              <p className="text-sm text-slate-500">
                {formatPercentDelta(overview.revenue_delta_30_days)} revenue
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Generated
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {format(new Date(dashboard.generated_at), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-slate-500">
                {format(new Date(dashboard.generated_at), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Revenue"
            value={formatMoney(overview.total_revenue)}
            subtitle={`${formatMoney(overview.revenue_30_days)} in the last 30 days`}
            delta={formatPercentDelta(overview.revenue_delta_30_days)}
            tone="emerald"
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Bookings"
            value={overview.total_appointments}
            subtitle={`${overview.upcoming_7_days} upcoming in the next 7 days`}
            delta={formatPercentDelta(overview.appointment_delta_30_days)}
            tone="sky"
            icon={<CalendarDaysIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Completion Rate"
            value={`${overview.completion_rate}%`}
            subtitle={`${overview.completed_appointments} completed appointments`}
            tone="violet"
            icon={<CheckCircleIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Team Capacity"
            value={`${overview.active_employees}/${overview.total_employees}`}
            subtitle={`${dashboard.schedule_overview.staff_on_duty_today} staff on duty today`}
            tone="amber"
            icon={<UserGroupIcon className="h-6 w-6" />}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Bookings and Revenue Trend</h2>
                <p className="text-sm text-slate-500">Live backend data for the last 14 days</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {formatMoney(overview.average_booking_value)}
                </p>
                <p className="text-sm text-slate-500">Average completed booking</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="bookingFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#4a90b0" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#4a90b0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'revenue' ? formatMoney(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Bookings',
                    ]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="bookings"
                    radius={[8, 8, 0, 0]}
                    fill="#cbd5e1"
                    barSize={18}
                  />
                  <Area
                    yAxisId="right"
                    dataKey="revenue"
                    type="monotone"
                    stroke="#4a90b0"
                    fill="url(#bookingFill)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Status Mix</h2>
                  <p className="text-sm text-slate-500">Current distribution of appointment states</p>
                </div>
                <ChartBarIcon className="h-6 w-6 text-slate-400" />
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Appointments']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {statusData.map((item) => (
                  <div key={item.name} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-slate-600 capitalize">{item.name}</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Operational Health</h2>
                  <p className="text-sm text-slate-500">Key daily indicators for the business</p>
                </div>
                <BellAlertIcon className="h-6 w-6 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Today&apos;s bookings</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {overview.today_appointments}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Unread notifications</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {dashboard.notifications.unread}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Cancellation rate</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {overview.cancellation_rate}%
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">No-show rate</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{overview.no_show_rate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Best Performing Services</h2>
                <p className="text-sm text-slate-500">Revenue and demand by service</p>
              </div>
              <Link
                to="/dashboard/services"
                className="inline-flex items-center text-sm font-semibold text-[#4a90b0]"
              >
                Manage services
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {top_services.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                  No services found yet.
                </div>
              ) : (
                top_services.map((service) => (
                  <div
                    key={service.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-900">{service.name}</p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            service.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {service.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {service.appointments} total bookings, {service.pending} pending approval
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Revenue</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatMoney(service.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Completed</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {service.completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Demand</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {service.appointments}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Alerts & Attention Items</h2>
              <p className="text-sm text-slate-500">Issues that may need quick action</p>
            </div>

            <div className="space-y-3">
              {dashboard.alerts.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  No urgent issues detected right now.
                </div>
              ) : (
                dashboard.alerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.title}`}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-amber-900">{alert.title}</p>
                        <p className="mt-1 text-sm text-amber-800">{alert.description}</p>
                      </div>
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-amber-900">{alert.value}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Employee Performance</h2>
                <p className="text-sm text-slate-500">Workload and output by staff member</p>
              </div>
              <Link
                to="/dashboard/employees"
                className="inline-flex items-center text-sm font-semibold text-[#4a90b0]"
              >
                Staff list
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {top_employees.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                  No employees found yet.
                </div>
              ) : (
                top_employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-500">{employee.position}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          employee.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Completed</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {employee.completed}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Upcoming</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {employee.upcoming}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-slate-500">Revenue</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatMoney(employee.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Demand by Weekday</h2>
                <p className="text-sm text-slate-500">Identify the busiest operating days</p>
              </div>
              <ClockIcon className="h-6 w-6 text-slate-400" />
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busiest_days}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value, name) => [name === 'revenue' ? formatMoney(value) : value, name === 'revenue' ? 'Revenue' : 'Appointments']} />
                  <Bar dataKey="appointments" fill="#4a90b0" radius={[8, 8, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Open days per week</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dashboard.schedule_overview.open_days_per_week}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Employees on time off today</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dashboard.schedule_overview.employees_on_time_off_today}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Today&apos;s schedule</p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {dashboard.schedule_overview.today_is_open
                    ? `${dashboard.schedule_overview.today_opening_time || '--:--'} - ${
                        dashboard.schedule_overview.today_closing_time || '--:--'
                      }`
                    : 'Closed'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Active services</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {overview.active_services}/{overview.total_services}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Appointment Activity</h2>
              <p className="text-sm text-slate-500">Latest customer bookings and assignment status</p>
            </div>
            <Link
              to="/dashboard/appointments"
              className="inline-flex items-center text-sm font-semibold text-[#4a90b0]"
            >
              View all appointments
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {dashboard.recent_appointments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">
              No appointment activity yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dashboard.recent_appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{appointment.customer_name}</div>
                        <div className="text-sm text-slate-500">{appointment.customer_email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-medium text-slate-900">{appointment.service_name}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{appointment.employee_name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div>{format(new Date(appointment.date), 'MMM dd, yyyy')}</div>
                        <div className="text-slate-500">{appointment.start_time}</div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {formatMoney(appointment.amount)}
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
          <Link
            to="/dashboard/services"
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-blue-700">
                {overview.active_services} active
              </span>
            </div>
            <h3 className="font-semibold text-slate-900">Manage Services</h3>
            <p className="mt-2 text-sm text-slate-500">
              Update services based on demand and revenue data.
            </p>
          </Link>

          <Link
            to="/dashboard/appointments"
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-emerald-700">
                {overview.pending_appointments} pending
              </span>
            </div>
            <h3 className="font-semibold text-slate-900">Manage Appointments</h3>
            <p className="mt-2 text-sm text-slate-500">
              Confirm bookings faster and reduce operational delays.
            </p>
          </Link>

          <Link
            to="/dashboard/employees"
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-violet-700">
                {dashboard.schedule_overview.staff_on_duty_today} on duty
              </span>
            </div>
            <h3 className="font-semibold text-slate-900">Manage Employees</h3>
            <p className="mt-2 text-sm text-slate-500">
              Review staff workload, assignments, and capacity coverage.
            </p>
          </Link>

          <Link
            to="/dashboard/schedule"
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-amber-700">
                {dashboard.schedule_overview.today_is_open ? 'Open today' : 'Closed today'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900">Business Schedule</h3>
            <p className="mt-2 text-sm text-slate-500">
              Keep availability accurate so booking analytics stay reliable.
            </p>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-900">Completed</p>
                <p className="text-sm text-slate-500">
                  {overview.completed_appointments} finished bookings
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-rose-600" />
              <div>
                <p className="font-semibold text-slate-900">Cancelled</p>
                <p className="text-sm text-slate-500">
                  {overview.cancelled_appointments} cancelled bookings
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <BellAlertIcon className="h-6 w-6 text-sky-600" />
              <div>
                <p className="font-semibold text-slate-900">Needs Response</p>
                <p className="text-sm text-slate-500">
                  {overview.pending_appointments} pending, {dashboard.notifications.unread} unread notices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
