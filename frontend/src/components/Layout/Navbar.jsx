import React, { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const publicNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const staffFacingNavigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'My Appointments', href: '/appointments', icon: ClipboardDocumentListIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const businessNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Services', href: '/dashboard/services', icon: BriefcaseIcon },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  ];

  const employeeNavigation = [
    { name: 'Dashboard', href: '/employee/dashboard', icon: HomeIcon },
    { name: 'Appointments', href: '/employee/appointments', icon: CalendarIcon },
    { name: 'Profile', href: '/employee/profile', icon: UserCircleIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) return userNavigation;
    if (user?.user_type === 'business_owner') return businessNavigation;
    if (user?.user_type === 'employee') return employeeNavigation;
    return userNavigation;
  };

  const getTopNavigation = () => {
    if (user?.user_type === 'business_owner' || user?.user_type === 'employee') {
      return staffFacingNavigation;
    }

    return publicNavigation;
  };

  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'U';

  return (
    <Disclosure as="nav" className="nav-shell">
      {({ open }) => (
        <>
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-8">
              <Link to="/" className="flex items-center gap-3">
                <span className="metric-icon h-10 w-10">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <span className="text-xl font-bold tracking-normal text-token">Reserva</span>
              </Link>

              <div className="hidden items-center gap-1 sm:flex">
                {getTopNavigation().map((item) => (
                  <Link key={item.name} to={item.href} className="nav-link">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <ThemeToggle />
              {isAuthenticated ? <NotificationBell /> : null}

              {isAuthenticated ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="btn-secondary min-h-0 px-2 py-1.5">
                    {user?.profile_picture ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={user.profile_picture}
                        alt={user.first_name || 'User'}
                      />
                    ) : (
                      <span className="avatar-token h-8 w-8 text-sm">{userInitial}</span>
                    )}
                    <span className="hidden max-w-28 truncate text-sm md:block">
                      {user?.first_name || 'User'}
                    </span>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Menu.Items className="dropdown-panel right-0 mt-3 w-60 min-w-0 origin-top-right p-2 focus:outline-none">
                      {getNavigationItems().map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              to={item.href}
                              className={`dropdown-item ${active ? 'bg-muted-token' : ''}`}
                            >
                              <item.icon className="h-5 w-5 text-muted" />
                              <span className="font-semibold">{item.name}</span>
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={handleLogout}
                            className={`dropdown-item text-danger ${active ? 'bg-muted-token' : ''}`}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            <span className="font-semibold">Logout</span>
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <ThemeToggle />
              <Disclosure.Button className="icon-button">
                <span className="sr-only">Open main menu</span>
                {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </Disclosure.Button>
            </div>
          </div>

          <Disclosure.Panel className="border-t border-token bg-surface-token sm:hidden">
            <div className="space-y-1 p-3">
              {getTopNavigation().map((item) => (
                <Disclosure.Button key={item.name} as={Link} to={item.href} className="nav-link w-full">
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>

            <div className="border-t border-token p-3">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-3">
                    {user?.profile_picture ? (
                      <img className="h-10 w-10 rounded-full object-cover" src={user.profile_picture} alt="" />
                    ) : (
                      <span className="avatar-token h-10 w-10 text-sm">{userInitial}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-token">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                  </div>
                  {getNavigationItems().map((item) => (
                    <Disclosure.Button key={item.name} as={Link} to={item.href} className="nav-link w-full">
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <Disclosure.Button as="button" onClick={handleLogout} className="nav-link w-full text-danger">
                    Logout
                  </Disclosure.Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Disclosure.Button as={Link} to="/login" className="btn-secondary">
                    Login
                  </Disclosure.Button>
                  <Disclosure.Button as={Link} to="/register" className="btn-primary">
                    Sign Up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
