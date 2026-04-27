import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { appointmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#64748b',
  rescheduled: '#8b5cf6',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const fmt = (v) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(v || 0));

const delta = (v) => `${v >= 0 ? '+' : ''}${v}%`;

// ── Compact stat card ────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0
          ? <ArrowTrendingUpIcon className="h-4 w-4" />
          : <ArrowTrendingDownIcon className="h-4 w-4" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

// ── Status badge ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-slate-100 text-slate-600',
    rescheduled: 'bg-violet-100 text-violet-800',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const BusinessDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    appointmentService
      .getBusinessDashboardStats()
      .then((r) => setDashboard(r.data))
      .catch(() => setError('Failed to load dashboard statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Dashboard data unavailable.'}
        </div>
      </div>
    );
  }

  const { overview, trends, status_breakdown, busiest_days, top_services, top_employees } = dashboard;

  const statusData = status_breakdown.map((item, i) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: STATUS_COLORS[item.status] || PIE_COLORS[i % PIE_COLORS.length],
  }));

  const serviceBarData = top_services.slice(0, 6).map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    bookings: s.appointments,
    revenue: Number(s.revenue),
  }));

  return (
    <div className="flex h-full flex-col gap-4 p-5 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Hello, {user?.first_name || 'there'} 👋
          </h1>
          <p className="text-xs text-slate-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {dashboard.schedule_overview.today_is_open
              ? ` · Open ${dashboard.schedule_overview.today_opening_time || ''} – ${dashboard.schedule_overview.today_closing_time || ''}`
              : ' · Closed today'}
          </p>
        </div>
        <Link
          to="/dashboard/appointments"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <CalendarDaysIcon className="h-4 w-4" />
          View appointments
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={overview.total_appointments}
          sub={`${overview.upcoming_7_days} upcoming this week`}
          icon={CalendarDaysIcon}
          color="bg-blue-50 text-blue-600"
          trend={overview.appointment_delta_30_days}
        />
        <StatCard
          title="Employees"
          value={`${overview.active_employees}/${overview.total_employees}`}
          sub={`${dashboard.schedule_overview.staff_on_duty_today} on duty today`}
          icon={UserGroupIcon}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Today's Appointments"
          value={overview.today_appointments}
          sub={`${overview.pending_appointments} pending approval`}
          icon={CheckCircleIcon}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Revenue"
          value={fmt(overview.total_revenue)}
          sub={`${fmt(overview.revenue_30_days)} last 30 days`}
          icon={CurrencyDollarIcon}
          color="bg-amber-50 text-amber-600"
          trend={overview.revenue_delta_30_days}
        />
      </div>

      {/* ── Middle row ─────────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Employee list */}
        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Employees</h2>
            <Link to="/dashboard/employees" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              All <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          {top_employees.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">No employees yet.</p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="grid grid-cols-3 text-xs text-slate-400 font-medium px-2 mb-1">
                <span>Name</span>
                <span className="text-center">Status</span>
                <span className="text-right">Done</span>
              </div>
              {top_employees.map((emp) => (
                <div key={emp.id} className="grid grid-cols-3 items-center rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.position || 'Staff'}</p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {emp.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <p className="text-right text-sm font-bold text-slate-900">{emp.completed}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Segmentation / Status donut */}
        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Appointment Status</h2>
            <span className="text-xs text-slate-400">{overview.completion_rate}% complete</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="60%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="40%"
                  outerRadius="70%"
                  paddingAngle={3}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'appointments']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-xs text-slate-600 capitalize">{item.name}</span>
                  <span className="ml-auto text-xs font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings trend */}
        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Booking Trend</h2>
            <span className="text-xs text-slate-400">Last 14 days</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n === 'revenue' ? 'Revenue' : 'Bookings']} />
                <Area
                  dataKey="bookings"
                  type="monotone"
                  stroke="#3b82f6"
                  fill="url(#bFill)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ height: '180px' }}>

        {/* Busiest days */}
        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm overflow-hidden">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Busiest Days</h2>
            <span className="text-xs text-slate-400">{delta(overview.appointment_delta_30_days)} bookings vs last month</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiest_days} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => [v, 'Appointments']} />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services-wise bookings */}
        <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm overflow-hidden">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Services-wise Bookings</h2>
            <Link to="/dashboard/services" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              Manage <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBarData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n === 'revenue' ? 'Revenue' : 'Bookings']} />
                <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BusinessDashboard;
