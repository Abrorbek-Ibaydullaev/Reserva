import React, { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  CalendarIcon,
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', current: true },
    { name: 'Services', href: '/services', current: false },
    { name: 'About', href: '/about', current: false },
    { name: 'Contact', href: '/contact', current: false },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'My Appointments', href: '/appointments', icon: ClipboardDocumentListIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const businessNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Services', href: '/dashboard/services', icon: BriefcaseIcon },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) return userNavigation;
    return user?.user_type === 'business_owner' 
      ? businessNavigation 
      : userNavigation;
  };

  return (
    <Disclosure as="nav" className="bg-white shadow-lg">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              {/* Logo and Desktop Navigation */}
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="flex items-center space-x-2">
                    <CalendarIcon className="h-8 w-8 text-primary-600" />
                    <span className="text-xl font-bold text-gray-900">Reserva</span>
                  </Link>
                </div>
                
                {/* Desktop Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-600"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right side items */}
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                {/* Notifications */}
                {isAuthenticated && (
                  <button className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
                  </button>
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
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        )}
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                          {user?.first_name || 'User'}
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {getNavigationItems().map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                to={item.href}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center px-4 py-2 text-sm text-gray-700`}
                              >
                                <item.icon className="mr-3 h-5 w-5 text-gray-400" />
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
                                active ? 'bg-gray-100' : ''
                              } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                              Logout
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
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
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
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:border-primary-500 hover:bg-gray-50 hover:text-gray-800"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            
            {isAuthenticated ? (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  {user?.profile_picture ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.profile_picture}
                      alt={user.first_name}
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {getNavigationItems().map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <Disclosure.Button
                    as="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Logout
                  </Disclosure.Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Login
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign Up
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