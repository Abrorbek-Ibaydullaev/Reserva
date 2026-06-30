import React, { Fragment, useState } from 'react';
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
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';

const Navbar = () => {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const publicNavigation = [
    { name: t('nav.home'), href: '/', current: true },
    { name: t('nav.services'), href: '/services', current: false },
    { name: t('nav.about'), href: '/about', current: false },
    { name: t('nav.contact'), href: '/contact', current: false },
  ];

  const staffFacingNavigation = [
    { name: t('nav.home'), href: '/', current: true },
    { name: t('nav.services'), href: '/services', current: false },
    { name: t('nav.about'), href: '/about', current: false },
    { name: t('nav.contact'), href: '/contact', current: false },
  ];

  const userNavigation = [
    { name: t('nav.profile'), href: '/profile', icon: UserCircleIcon },
    { name: t('nav.my_appointments'), href: '/appointments', icon: ClipboardDocumentListIcon },
    { name: t('nav.settings'), href: '/settings', icon: Cog6ToothIcon },
  ];

  const businessNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('nav.profile'), href: '/profile', icon: UserCircleIcon },
    { name: t('nav.settings'), href: '/settings', icon: Cog6ToothIcon },
    { name: t('nav.my_appointments'), href: '/appointments', icon: ClipboardDocumentListIcon },
    { name: t('nav.services'), href: '/dashboard/services', icon: BriefcaseIcon },
    { name: t('nav.appointments'), href: '/dashboard/appointments', icon: CalendarIcon },
  ];

  const employeeNavigation = [
    { name: t('nav.dashboard'), href: '/employee/dashboard', icon: HomeIcon },
    { name: t('nav.my_appointments'), href: '/employee/appointments', icon: CalendarIcon },
    { name: t('nav.profile'), href: '/profile', icon: UserCircleIcon },
    { name: t('nav.settings'), href: '/settings', icon: Cog6ToothIcon },
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

  const authPlaceholder = (
    <div aria-hidden="true" className="h-9 w-[148px] rounded-full bg-gray-100 dark:bg-gray-800" />
  );

  return (
    <Disclosure as="nav" className="relative z-[1000] bg-white dark:bg-gray-900 shadow-lg">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              {/* Logo and Desktop Navigation */}
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="flex items-center space-x-2">
                    <CalendarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Reserva</span>
                  </Link>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {getTopNavigation().map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border-b-2 border-transparent hover:border-primary-600 dark:hover:border-primary-400"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right side items */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Theme Toggle */}
                <ThemeToggle />

                {authLoading ? (
                  authPlaceholder
                ) : (
                  <>
                    {/* Notifications */}
                    {isAuthenticated && (
                      <NotificationBell />
                    )}

                    {/* User Menu */}
                    {isAuthenticated ? (
                      <Menu as="div" className="relative ml-3">
                        <div>
                          <Menu.Button className="flex items-center space-x-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                            {user?.profile_picture ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={user.profile_picture}
                                alt={user.first_name}
                              />
                            ) : (
                              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            )}
                            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user?.first_name || t('nav.profile')}
                            </span>
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-[1000] mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {getNavigationItems().map((item) => (
                              <Menu.Item key={item.href}>
                                {({ active }) => (
                                  <Link
                                    to={item.href}
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                  >
                                    <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    {item.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleLogout}
                                  className={`${
                                    active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                  } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                >
                                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                  {t('auth.logout')}
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <Link
                          to="/login"
                          className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {t('nav.login')}
                        </Link>
                        <Link
                          to="/register"
                          className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {t('nav.sign_up')}
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">{t('nav.open_main_menu')}</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {getTopNavigation().map((item) => (
                <Disclosure.Button
                  key={item.href}
                  as={Link}
                  to={item.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>

            {/* Mobile language + theme */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {authLoading ? (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div aria-hidden="true" className="mx-4 h-10 w-40 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            ) : isAuthenticated ? (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex min-w-0 items-center px-4">
                  {user?.profile_picture ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.profile_picture}
                      alt={user.first_name}
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="ml-3 min-w-0">
                    <div className="truncate text-base font-medium text-gray-800 dark:text-gray-100">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {getNavigationItems().map((item) => (
                    <Disclosure.Button
                      key={item.href}
                      as={Link}
                      to={item.href}
                      className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <Disclosure.Button
                    as="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    {t('auth.logout')}
                  </Disclosure.Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    {t('nav.login')}
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    {t('nav.sign_up')}
                  </Disclosure.Button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
