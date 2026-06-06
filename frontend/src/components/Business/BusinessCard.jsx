import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { fixMediaUrl } from '../../services/api';
import { asArray, asNumber } from '../../utils/data';

const FALLBACK =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';

const BusinessCard = ({ business }) => {
  const services = asArray(business?.services);
  // Use pre-aggregated fields from BusinessSerializer; fall back to per-service computation
  const rating = business.avg_rating != null
    ? Number(business.avg_rating).toFixed(1)
    : (() => {
        const ratings = services.flatMap((s) => s.average_rating ? [asNumber(s.average_rating)] : []);
        return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
      })();
  const reviews = business.review_count != null
    ? business.review_count
    : services.reduce((sum, s) => sum + asNumber(s.review_count), 0);
  const city =
    business.profile?.city ||
    business.profile?.business_address ||
    business.profile?.address ||
    null;
  const preview = services.filter((s) => s.is_active).slice(0, 3);

  return (
    <Link
      to={business?.id ? `/business/${business.id}` : '/services'}
      className="card-hover group flex h-full flex-col overflow-hidden"
    >
      <div className="app-media relative h-44 w-full rounded-none">
        <img
          src={
            fixMediaUrl(asArray(business?.gallery_images)[0]?.image) ||
            fixMediaUrl(business?.profile_picture) ||
            FALLBACK
          }
          alt={business?.full_name || 'Business'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-3 left-3">
          <div className="h-12 w-12 overflow-hidden rounded-[var(--radius-md)] border border-token bg-surface-token shadow-md">
            <img
              src={fixMediaUrl(business?.profile_picture) || FALLBACK}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        {rating && (
          <div className="badge badge-warning absolute right-3 top-3 shadow-sm backdrop-blur-sm">
            <StarIcon className="h-3.5 w-3.5" />
            <span>{rating}</span>
            <span className="font-semibold opacity-70">({reviews})</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3">
          <h3 className="text-base font-bold text-token transition-colors group-hover:text-brand">
            {business?.profile?.business_name || business?.full_name || 'Business'}
          </h3>
          {city && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
              {city}
            </div>
          )}
        </div>

        {preview.length > 0 ? (
          <div className="divide-token flex-1 divide-y">
            {preview.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-soft">{s.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <ClockIcon className="h-3 w-3" />
                  {s.duration || 0} min
                  </div>
                </div>
                <span className="ml-3 flex-shrink-0 text-sm font-bold text-token">
                  ${asNumber(s.price).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="caption-text">No services listed yet</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-token pt-3">
          <span className="caption-text">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </span>
          <span className="app-link flex items-center gap-1 text-xs">
            View & Book <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;
