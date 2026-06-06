import React from 'react';
import { Link } from 'react-router-dom';
import { fixMediaUrl } from '../../services/api';
import { 
  StarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { asNumber } from '../../utils/data';

const ServiceCard = ({ service }) => {
  const renderStars = (rating) => {
    const stars = [];
    const safeRating = asNumber(rating);
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-warning" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-muted" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <StarIconSolid className="h-4 w-4 text-warning" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-muted" />);
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
    }).format(asNumber(price));
  };

  const formatDuration = (minutes) => {
    const total = asNumber(minutes);
    if (total < 60) {
      return `${total} min`;
    } else {
      const hours = Math.floor(total / 60);
      const remainingMinutes = total % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  };

  return (
    <div className="card-hover group flex h-full flex-col overflow-hidden">
      <div className="app-media relative h-48 flex-shrink-0 rounded-none">
        <img 
          src={fixMediaUrl(service?.thumbnail) || 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
          alt={service?.name || 'Service'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {service?.is_active ? (
            <span className="ui-chip ui-badge-success">
              Available
            </span>
          ) : (
            <span className="ui-chip ui-badge-danger">
              Unavailable
            </span>
          )}
        </div>
        
        {/* Category Badge */}
        {service?.category_name && (
          <div className="absolute top-3 left-3">
            <span className="ui-chip ui-badge-muted backdrop-blur">
          {service.category_name}
            </span>
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <Link to={service?.id ? `/services/${service.id}` : '/services'} className="transition-colors group-hover:text-brand">
            <h3 className="line-clamp-1 text-lg font-bold text-token">
              {service?.name || 'Service'}
            </h3>
          </Link>
          <div className="text-xl font-bold text-brand">
          {formatPrice(service?.price)}
          </div>
        </div>

        {/* Provider Info */}
        <div className="mb-3 flex items-center text-sm text-soft">
          <UserIcon className="mr-1 h-4 w-4" />
          <span>{service?.business_owner_name || 'Business'}</span>
        </div>

        {/* Description */}
        <p className="body-text mb-4 line-clamp-2 flex-grow">
          {service?.description || 'No description available.'}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-soft">
              <ClockIcon className="mr-1 h-4 w-4" />
              <span>{formatDuration(service?.duration)}</span>
            </div>
            <div className="flex items-center text-sm text-soft">
              <MapPinIcon className="mr-1 h-4 w-4" />
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="mr-2 flex">
              {renderStars(service.average_rating || 0)}
            </div>
            <span className="text-sm font-bold text-token">
              {service.average_rating ? asNumber(service.average_rating).toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="text-sm text-muted">
            ({asNumber(service.review_count)} reviews)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2">
          <Link
            to={service?.id ? `/book/${service.id}` : '/services'}
            className="btn-primary flex-1 px-4 py-2"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Book Now
          </Link>
          <Link
            to={service?.id ? `/services/${service.id}` : '/services'}
            className="btn-secondary flex-1 px-4 py-2"
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
