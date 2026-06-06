import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  Bars3Icon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', href: '/employee/dashboard', icon: HomeIcon },
  { name: 'My Appointments', href: '/employee/appointments', icon: CalendarIcon },
  { name: 'Schedule', href: '/employee/schedule', icon: ClockIcon },
  { name: 'Profile', href: '/employee/profile', icon: UserCircleIcon },
];

const EmployeeLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item) => location.pathname === item.href;
  const currentPage = navItems.find(isActive);
  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'E';

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-token px-5">
        <span className="metric-icon h-10 w-10">
          <CalendarDaysIcon className="h-5 w-5" />
        </span>
        <span className="text-xl font-bold tracking-normal text-token">Reserva</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-token p-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="avatar-token h-9 w-9 text-sm">{userInitial}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-token">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="caption-text">Employee</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="sidebar-link w-full">
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-30 flex w-64 flex-shrink-0 flex-col shadow-xl transition-transform duration-200 lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="topbar flex h-16 flex-shrink-0 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="h-5 w-5" />
            </button>
            <p className="font-bold text-token">{currentPage?.name || 'Employee Portal'}</p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden items-center gap-2 md:flex">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="avatar-token h-9 w-9 text-sm">{userInitial}</span>
              )}
              <div>
                <p className="text-sm font-bold text-token">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="caption-text">Employee</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
