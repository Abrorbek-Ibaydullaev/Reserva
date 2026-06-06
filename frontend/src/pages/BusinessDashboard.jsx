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
import { asNumber, responseList } from '../utils/data';

const CHART = {
  primary: 'rgb(var(--primary))',
  accent: 'rgb(var(--accent))',
  success: 'rgb(var(--success))',
  warning: 'rgb(var(--warning))',
  danger: 'rgb(var(--danger))',
  muted: 'rgb(var(--text-muted))',
  border: 'rgb(var(--border))',
};

const STATUS_COLORS = {
  pending: CHART.warning,
  confirmed: CHART.primary,
  completed: CHART.success,
  cancelled: CHART.danger,
  no_show: CHART.muted,
  rescheduled: CHART.accent,
};

const PIE_COLORS = [CHART.primary, CHART.accent, CHART.success, CHART.warning, CHART.danger, CHART.muted];

const fmt = (v) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(v || 0));

const delta = (v) => `${v >= 0 ? '+' : ''}${v}%`;

// ── Compact stat card ────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="app-card flex items-center gap-4 p-4">
    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-muted">{title}</p>
      <p className="text-2xl font-bold text-token">{value}</p>
      {sub && <p className="truncate text-xs text-muted">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
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
    pending: 'badge-warning',
    confirmed: 'badge-brand',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    no_show: 'badge-muted',
    rescheduled: 'badge-brand',
  };
  return (
    <span className={`ui-chip capitalize ${map[status] || 'badge-muted'}`}>
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
        <div className="app-spinner" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="app-page">
        <div className="rounded-[var(--radius-lg)] border border-token bg-muted-token p-4 text-danger">
          {error || 'Dashboard data unavailable.'}
        </div>
      </div>
    );
  }

  const { overview = {}, schedule_overview = {} } = dashboard || {};
  const trends = responseList(dashboard?.trends);
  const status_breakdown = responseList(dashboard?.status_breakdown);
  const busiest_days = responseList(dashboard?.busiest_days);
  const top_services = responseList(dashboard?.top_services);
  const top_employees = responseList(dashboard?.top_employees);

  const statusData = status_breakdown.map((item, i) => ({
    name: String(item.status || 'unknown').replace(/_/g, ' '),
    value: asNumber(item.count),
    color: STATUS_COLORS[item.status] || PIE_COLORS[i % PIE_COLORS.length],
  }));

  const serviceBarData = top_services.slice(0, 6).map((s) => {
    const name = String(s.name || 'Service');
    return {
      name: name.length > 12 ? `${name.slice(0, 12)}...` : name,
      bookings: asNumber(s.appointments),
      revenue: asNumber(s.revenue),
    };
  });

  return (
    <div className="app-page flex min-h-full flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-title">
            Hello, {user?.first_name || 'there'} 👋
          </h1>
          <p className="app-subtitle">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {schedule_overview.today_is_open
              ? ` · Open ${schedule_overview.today_opening_time || ''} - ${schedule_overview.today_closing_time || ''}`
              : ' · Closed today'}
          </p>
        </div>
        <Link
          to="/dashboard/appointments"
          className="btn-primary"
        >
          <CalendarDaysIcon className="h-4 w-4" />
          View appointments
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={asNumber(overview.total_appointments)}
          sub={`${asNumber(overview.upcoming_7_days)} upcoming this week`}
          icon={CalendarDaysIcon}
          color="bg-muted-token text-brand"
          trend={asNumber(overview.appointment_delta_30_days)}
        />
        <StatCard
          title="Employees"
          value={`${asNumber(overview.active_employees)}/${asNumber(overview.total_employees)}`}
          sub={`${asNumber(schedule_overview.staff_on_duty_today)} on duty today`}
          icon={UserGroupIcon}
          color="bg-muted-token text-brand"
        />
        <StatCard
          title="Today's Appointments"
          value={asNumber(overview.today_appointments)}
          sub={`${asNumber(overview.pending_appointments)} pending approval`}
          icon={CheckCircleIcon}
          color="bg-muted-token text-success"
        />
        <StatCard
          title="Total Revenue"
          value={fmt(overview.total_revenue)}
          sub={`${fmt(overview.revenue_30_days)} last 30 days`}
          icon={CurrencyDollarIcon}
          color="bg-muted-token text-warning"
          trend={asNumber(overview.revenue_delta_30_days)}
        />
      </div>

      {/* ── Middle row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Employee list */}
        <div className="app-card flex min-h-[280px] flex-col overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-token">Employees</h2>
            <Link to="/dashboard/employees" className="text-link flex items-center gap-1 text-xs">
              All <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          {top_employees.length === 0 ? (
            <p className="ui-empty text-center">No employees yet.</p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="grid grid-cols-3 text-xs text-muted font-medium px-2 mb-1">
                <span>Name</span>
                <span className="text-center">Status</span>
                <span className="text-right">Done</span>
              </div>
              {top_employees.map((emp) => (
                <div key={emp.id} className="surface-subtle grid grid-cols-3 items-center rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-token truncate">{emp.name}</p>
                    <p className="text-xs text-muted truncate">{emp.position || 'Staff'}</p>
                  </div>
                  <div className="flex justify-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${emp.is_active ? 'bg-muted-token text-success' : 'bg-muted-token text-muted'}`}>
                      {emp.is_active ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <p className="text-right text-sm font-bold text-token">{emp.completed}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Segmentation / Status donut */}
        <div className="app-card flex min-h-[280px] flex-col overflow-hidden p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-token">Appointment Status</h2>
            <span className="text-xs text-muted">{asNumber(overview.completion_rate)}% complete</span>
          </div>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height={170}>
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
                <div key={item.name} className="surface-subtle flex items-center gap-1.5 rounded-lg px-2 py-1">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-xs text-soft capitalize">{item.name}</span>
                  <span className="ml-auto text-xs font-bold text-token">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings trend */}
        <div className="app-card flex min-h-[280px] flex-col overflow-hidden p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-token">Booking Trend</h2>
            <span className="text-xs text-muted">Last 14 days</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.border} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <YAxis stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n === 'revenue' ? 'Revenue' : 'Bookings']} />
                <Area
                  dataKey="bookings"
                  type="monotone"
                  stroke={CHART.primary}
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
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Busiest days */}
        <div className="app-card flex h-56 flex-col overflow-hidden p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-token">Busiest Days</h2>
            <span className="text-xs text-muted">{delta(asNumber(overview.appointment_delta_30_days))} bookings vs last month</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiest_days} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={CHART.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <YAxis stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <Tooltip formatter={(v) => [v, 'Appointments']} />
                <Bar dataKey="appointments" fill={CHART.primary} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services-wise bookings */}
        <div className="app-card flex h-56 flex-col overflow-hidden p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-token">Services-wise Bookings</h2>
            <Link to="/dashboard/services" className="text-link flex items-center gap-1 text-xs">
              Manage <ChevronRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBarData} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={CHART.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <YAxis stroke={CHART.muted} fontSize={10} tick={{ fill: CHART.muted }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n === 'revenue' ? 'Revenue' : 'Bookings']} />
                <Bar dataKey="bookings" fill={CHART.accent} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BusinessDashboard;
