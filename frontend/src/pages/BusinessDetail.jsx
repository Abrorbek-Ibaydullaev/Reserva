import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Replaced ServiceCard with a simple vertical list layout for services
import { userService, serviceService } from '../services/api';
import {
  ArrowLeftIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BusinessDetail = () => {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '' });

  useEffect(() => {
    fetchBusinessAndServices();
  }, [businessId]);

  const fetchBusinessAndServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch business details
      const businessResponse = await userService.getBusinesses();
      const businesses = businessResponse.data.results || businessResponse.data;
      const foundBusiness = businesses.find(b => b.id === parseInt(businessId));
      if (!foundBusiness) {
        throw new Error('Business not found');
      }
      setBusiness(foundBusiness);

      // Fetch services for this business
      const servicesResponse = await serviceService.getAllServices({
        business_owner: businessId
      });
      setServices(servicesResponse.data.results || servicesResponse.data);

    } catch (err) {
      console.error('Error fetching business details:', err);
      setError('Failed to load business details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    } catch {
      return `$${price}`;
    }
  };
  const formatDuration = (mins) => {
    if (!mins) return '';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Business not found'}</div>
          <Link
            to="/services"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/services"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Businesses
          </Link>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Services */}
        <div className="md:col-span-2">
          <div className="mb-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input className="flex-1 ml-2 outline-none py-2 bg-transparent" placeholder="Search services" value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} />
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Popular Services</h3>
          </div>
          {services.filter((s) => s.name?.toLowerCase().includes(filters.search.toLowerCase())).length === 0 ? (
            <div className="text-center py-6 text-gray-500">No services found.</div>
          ) : (
            <div className="flex flex-col space-y-4">
              {services
                .filter((s) => s.name?.toLowerCase().includes(filters.search.toLowerCase()))
                .map((service) => (
                  /* Change 1: Use 'grid' instead of 'flex'. 
                     grid-cols-[1fr_100px_auto] defines 3 columns:
                     - 1fr: Service name/desc takes all available left space.
                     - 100px: Fixed width for Price/Duration (The "Green Line" effect).
                     - auto: The Book button.
                  */
                  <div
                    key={service.id}
                    className="grid grid-cols-[1fr_110px_auto] items-center bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                  >
                    {/* Column 1: Service Details */}
                    <div className="pr-4">
                      <div className="text-lg font-bold text-gray-900">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.description}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Price and Duration (ALIGNED VERTICALLY) */}
                    <div className="flex flex-col items-end pr-6 whitespace-nowrap">
                      <div className="text-xl font-bold text-gray-800">
                        {formatPrice(service.price)}
                      </div>
                      <div className="text-sm font-medium text-gray-400">
                        {formatDuration(service.duration)}
                      </div>
                    </div>

                    {/* Column 3: Book Button */}
                    <div className="flex justify-end">
                      <Link
                        to={`/book/${service.id}`}
                        className="px-8 py-3 bg-[#4a90b0] text-white rounded-xl text-lg font-semibold hover:bg-[#3d7691] transition-colors min-w-[100px] text-center"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Business Info & Social/Consumer Info */}
        <div className="space-y-6">
          {/* Business Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center">
            <img
              src={business.profile_picture || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'}
              alt={business.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
              }}
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">{business.full_name}</h1>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full mb-2">Business Owner</span>
            <div className="flex items-center justify-center mb-2">
              <div className="flex mr-2">{renderStars(4.5)}</div>
              <span className="text-base font-medium text-gray-900 mr-2">4.5</span>
              <span className="text-gray-500">(120 reviews)</span>
            </div>
            <div className="space-y-2 w-full text-gray-600 text-sm mt-2">
              {business.email && (
                <div className="flex items-center"><EnvelopeIcon className="h-5 w-5 mr-2" /><span>{business.email}</span></div>
              )}
              {business.phone_number && (
                <div className="flex items-center"><PhoneIcon className="h-5 w-5 mr-2" /><span>{business.phone_number}</span></div>
              )}
              {business.profile?.location && (
                <div className="flex items-center"><MapPinIcon className="h-5 w-5 mr-2" /><span>{business.profile.location}</span></div>
              )}
              <div className="flex items-center"><BuildingStorefrontIcon className="h-5 w-5 mr-2" /><span>{business.services_count} services available</span></div>
            </div>
            {business.profile?.bio && (
              <p className="text-gray-700 text-center text-base mt-4">{business.profile.bio}</p>
            )}
          </div>

          {/* Social Links (placeholder) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center">
            <div className="flex space-x-6 mb-2">
              <a href="#" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
                <svg className="h-7 w-7 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a4.5 4.5 0 0 0-9.724 0C6.09 6.336 4.5 8.747 4.5 12.005c0 3.257 1.59 5.668 2.638 7.517a4.5 4.5 0 0 0 9.724 0c1.048-1.849 2.638-4.26 2.638-7.517 0-3.258-1.59-5.669-2.638-7.518Z" /></svg>
                <span className="text-xs">Instagram</span>
              </a>
              <a href="#" className="flex flex-col items-center text-gray-500 hover:text-gray-700">
                <svg className="h-7 w-7 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-6a2.25 2.25 0 0 1-2.25-2.25V6.75m10.5 0A2.25 2.25 0 0 0 15 4.5h-6a2.25 2.25 0 0 0-2.25 2.25m10.5 0v10.5m0 0A2.25 2.25 0 0 1 15 19.5h-6a2.25 2.25 0 0 1-2.25-2.25m0 0V6.75" /></svg>
                <span className="text-xs">Facebook</span>
              </a>
            </div>
            <div className="text-xs text-gray-500 text-center">Social links placeholder</div>
          </div>

          {/* Consumer Info (placeholder) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">CONSUMER INFORMATION</h4>
            <p className="text-xs text-gray-600">This is a placeholder for consumer information, terms, or other legal text. You can update this section as needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
