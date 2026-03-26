import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import ServiceList from '../components/Services/ServiceList';
import { 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  StarIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <CalendarIcon className="h-12 w-12 text-primary-600" />,
      title: 'Easy Booking',
      description: 'Book appointments in just a few clicks with our intuitive interface.'
    },
    {
      icon: <ClockIcon className="h-12 w-12 text-primary-600" />,
      title: 'Real-time Availability',
      description: 'See available time slots in real-time and book instantly.'
    },
    {
      icon: <CheckCircleIcon className="h-12 w-12 text-primary-600" />,
      title: 'Automatic Reminders',
      description: 'Get email and SMS reminders for your upcoming appointments.'
    },
    {
      icon: <UserGroupIcon className="h-12 w-12 text-primary-600" />,
      title: 'Professional Network',
      description: 'Connect with verified professionals in your area.'
    },
    {
      icon: <StarIcon className="h-12 w-12 text-primary-600" />,
      title: 'Verified Reviews',
      description: 'Read authentic reviews from other customers.'
    },
    {
      icon: <MapPinIcon className="h-12 w-12 text-primary-600" />,
      title: 'Local Search',
      description: 'Find services near you with our location-based search.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,black,rgba(0,0,0,0.6))]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Book Appointments with{' '}
                <span className="bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                  Ease
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Discover and book appointments with local professionals. From beauty services to healthcare, 
                find the perfect provider for your needs.
              </p>
              
              {/* Search Bar */}
              <div className="mb-8 max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="What service are you looking for?"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="City or ZIP code"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 shadow-sm transition-colors"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                ) : user?.user_type === 'business_owner' ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 shadow-sm transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                ) : user?.user_type === 'employee' ? (
                  <Link
                    to="/employee/dashboard"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 shadow-sm transition-colors"
                  >
                    Go to Staff Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/services"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 shadow-sm transition-colors"
                  >
                    Browse Services
                  </Link>
                )}
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl blur-2xl opacity-30"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Booking Appointments"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Reserva?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform makes booking appointments simple and efficient
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-600 hover:shadow-xl transition-all duration-300"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Services Preview */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Browse our most booked services
            </p>
          </div>

          {/* <ServiceList limit={6} /> */}

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View All Services
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who use Reserva to manage their appointments and grow their customer base.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?type=business"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-100 shadow-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/business"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-600">Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">50,000+</div>
              <div className="text-gray-600">Appointments Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">4.8</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">100+</div>
              <div className="text-gray-600">Cities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
