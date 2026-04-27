import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  Bars3Icon,
  BellIcon,
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

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
          <CalendarDaysIcon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">Reserva</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-4 py-2.5">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
              <span className="text-sm font-semibold text-violet-700">
                {user?.first_name?.[0]?.toUpperCase() || 'E'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500">Employee</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f3ff]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-shrink-0 flex-col bg-white shadow-lg transition-transform duration-200 lg:relative lg:translate-x-0 lg:shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <p className="text-base font-semibold text-slate-700">
              {currentPage?.name || 'Employee Portal'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="hidden items-center gap-2 md:flex">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <span className="text-sm font-semibold text-violet-700">
                    {user?.first_name?.[0]?.toUpperCase() || 'E'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">Employee</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
