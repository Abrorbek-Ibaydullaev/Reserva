import React from 'react';
import { Link } from 'react-router-dom';
import { 
  StarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ServiceCard = ({ service }) => {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Service Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        <img 
          src={service.thumbnail || 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {service.is_active ? (
            <span className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
              Available
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
              Unavailable
            </span>
          )}
        </div>
        
        {/* Category Badge */}
        {service.category_name && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-xs font-medium bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-gray-200 rounded-full">
              {service.category_name}
            </span>
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Link to={`/services/${service.id}`} className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
              {service.name}
            </h3>
          </Link>
          <div className="font-bold text-primary-600 dark:text-primary-400 text-xl">
            {formatPrice(service.price)}
          </div>
        </div>

        {/* Provider Info */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
          <UserIcon className="h-4 w-4 mr-1" />
          <span>{service.business_owner_name}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {service.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDuration(service.duration)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex mr-2">
              {renderStars(service.average_rating || 0)}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {service.average_rating ? service.average_rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({service.review_count || 0} reviews)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/book/${service.id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Book Now
          </Link>
          <Link
            to={`/services/${service.id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <InformationCircleIcon className="h-4 w-4 mr-2" />
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;