import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BusinessCard = ({ business }) => {
  // Get up to 3 services
  const services = business.services || [];

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Business Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={business.profile_picture || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
          alt={business.full_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Rating and Reviews */}
        <div className="absolute top-0 right-0 bg-black bg-opacity-50 rounded px-2 py-1">
          <div className="text-center">
            <span className="block text-base font-bold text-white">
              4.5
            </span>
            <span className="block text-[10px] font-bold text-white text-opacity-90">
              120 reviews
            </span>
          </div>
        </div>
      </div>

      {/* Business Content */}
      <div className="p-6">
        {/* Business Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link to={`/business/${business.id}`} className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
                {business.full_name}
              </h3>
            </Link>

            {/* Rating and Reviews */}
            {/* <div>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">
                4.5
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                (120 reviews)
              </span>
            </div> */}
          </div>
        </div>

        {/* Location Info */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">
            {business.profile?.business_address && `${business.profile.business_address}, `}
            {business.profile?.city && `${business.profile.city}`}
            {business.profile?.postal_code && `, ${business.profile.postal_code}`}
          </span>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {services.slice(0, 3).map((service, index) => (
            <div key={service.id} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* First line: Service Name (left), Price (middle), Book button (right) */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                  {service.name}
                </h4>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    ${service.price}
                  </span>
                  <Link
                    to={`/business/${business.id}?service=${service.id}`}
                    className="px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Book
                  </Link>
                </div>
              </div>
              {/* Second line: Duration under price */}
              <div className="flex justify-end mt-1">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mr-20">
                  {service.duration} min
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Services Link */}
        {services.length > 3 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Link
              to={`/business/${business.id}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View all services →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCard;