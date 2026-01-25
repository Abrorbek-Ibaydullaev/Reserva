import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
// import { appointmentService, serviceService, scheduleService } from '../services/api';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const BusinessDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    activeServices: 0,
    totalEmployees: 0
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentStatusData, setAppointmentStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusColors = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444',
    no_show: '#6B7280'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [appointmentsResponse, servicesResponse, employeesResponse] = await Promise.all([
        appointmentService.getAllAppointments(),
        serviceService.getMyServices(),
        scheduleService.getEmployees()
      ]);

      const appointments = appointmentsResponse.data || [];
      const services = servicesResponse.data || [];
      const employees = employeesResponse.data || [];

      // Calculate today's appointments
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayAppointments = appointments.filter(app => 
        app.date === today && app.status !== 'cancelled'
      );

      // Calculate completed appointments with revenue
      const completedAppointments = appointments.filter(app => 
        app.status === 'completed'
      );

      const totalRevenue = completedAppointments.reduce((sum, app) => 
        sum + parseFloat(app.total_amount || 0), 0
      );

      // Calculate active services
      const activeServices = services.filter(service => service.is_active).length;

      // Update stats
      setStats({
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter(app => app.status === 'pending').length,
        todayAppointments: todayAppointments.length,
        completedAppointments: completedAppointments.length,
        totalRevenue,
        activeServices,
        totalEmployees: employees.length
      });

      // Get recent appointments
      const recent = appointments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentAppointments(recent);

      // Generate revenue data for last 7 days
      const revenueByDay = generateRevenueData(appointments);
      setRevenueData(revenueByDay);

      // Generate appointment status data
      const statusCounts = appointments.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: statusColors[status] || '#6B7280'
      }));

      setAppointmentStatusData(statusData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateRevenueData = (appointments) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayRevenue = appointments
        .filter(app => 
          app.date === dateStr && 
          app.status === 'completed' && 
          app.payment_status === 'paid'
        )
        .reduce((sum, app) => sum + parseFloat(app.total_amount || 0), 0);
      
      days.push({
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM dd'),
        revenue: dayRevenue
      });
    }
    
    return days;
  };

  const StatCard = ({ title, value, icon, change, isPositive }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary-50 rounded-lg">
            {icon}
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {change}%
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        class: 'bg-yellow-100 text-yellow-800', 
        icon: <ClockIcon className="h-4 w-4" />, 
        text: 'Pending' 
      },
      confirmed: { 
        class: 'bg-blue-100 text-blue-800', 
        icon: <CheckCircleIcon className="h-4 w-4" />, 
        text: 'Confirmed' 
      },
      completed: { 
        class: 'bg-green-100 text-green-800', 
        icon: <CheckCircleIcon className="h-4 w-4" />, 
        text: 'Completed' 
      },
      cancelled: { 
        class: 'bg-red-100 text-red-800', 
        icon: <ExclamationCircleIcon className="h-4 w-4" />, 
        text: 'Cancelled' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your business performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon={<CalendarIcon className="h-6 w-6 text-primary-600" />}
            change={12}
            isPositive={true}
          />
          
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<ClockIcon className="h-6 w-6 text-primary-600" />}
          />
          
          <StatCard
            title="Pending Appointments"
            value={stats.pendingAppointments}
            icon={<ExclamationCircleIcon className="h-6 w-6 text-primary-600" />}
            change={-5}
            isPositive={false}
          />
          
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={<CurrencyDollarIcon className="h-6 w-6 text-primary-600" />}
            change={15}
            isPositive={true}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Last 7 Days</h3>
                <p className="text-sm text-gray-600">Daily revenue from completed appointments</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${revenueData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-600">+15% from last week</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Appointment Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Appointment Status</h3>
                <p className="text-sm text-gray-600">Distribution of appointment statuses</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Appointments']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
              <p className="text-sm text-gray-600">Latest appointments and their status</p>
            </div>
            <Link
              to="/dashboard/appointments"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
            >
              View all
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments yet</p>
              <Link
                to="/dashboard/services"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Add Services to Get Started
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900">
                              {appointment.customer_details?.first_name?.charAt(0)}
                              {appointment.customer_details?.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.customer_details?.first_name} {appointment.customer_details?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.customer_details?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.service_details?.name}</div>
                        <div className="text-sm text-gray-500">
                          {appointment.duration} min
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(appointment.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.start_time}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${parseFloat(appointment.total_amount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/dashboard/services"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-blue-600 text-sm font-medium">{stats.activeServices} Services</span>
              </div>
              <h4 className="font-medium text-gray-900">Manage Services</h4>
              <p className="text-sm text-gray-600 mt-2">Add, edit, or remove services</p>
            </Link>

            <Link
              to="/dashboard/appointments"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">{stats.todayAppointments} Today</span>
              </div>
              <h4 className="font-medium text-gray-900">View Appointments</h4>
              <p className="text-sm text-gray-600 mt-2">Manage all appointments</p>
            </Link>

            <Link
              to="/dashboard/employees"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-purple-600 text-sm font-medium">{stats.totalEmployees} Employees</span>
              </div>
              <h4 className="font-medium text-gray-900">Manage Employees</h4>
              <p className="text-sm text-gray-600 mt-2">Add or manage staff</p>
            </Link>

            <Link
              to="/dashboard/schedule"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-yellow-600 text-sm font-medium">Set Hours</span>
              </div>
              <h4 className="font-medium text-gray-900">Set Schedule</h4>
              <p className="text-sm text-gray-600 mt-2">Configure business hours</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;