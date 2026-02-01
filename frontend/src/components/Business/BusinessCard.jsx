import React from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingStorefrontIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BusinessCard = ({ business }) => {
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

        {/* Services Count Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
            {business.services_count} services
          </span>
        </div>
      </div>

      {/* Business Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Link to={`/business/${business.id}`} className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
              {business.full_name}
            </h3>
          </Link>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <BuildingStorefrontIcon className="h-4 w-4 mr-1" />
            <span>Business</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {business.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{business.email}</span>
            </div>
          )}
          {business.phone_number && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{business.phone_number}</span>
            </div>
          )}
          {business.profile?.location && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{business.profile.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {business.profile?.bio && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {business.profile.bio}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex mr-2">
              {renderStars(4.5)} {/* Placeholder rating */}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              4.5
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (120 reviews)
          </span>
        </div>

        {/* Action Button */}
        <Link
          to={`/business/${business.id}`}
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          View Services
        </Link>
      </div>
    </div>
  );
};

export default BusinessCard;