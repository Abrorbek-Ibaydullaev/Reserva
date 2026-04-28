import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const FALLBACK =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';

const BusinessCard = ({ business }) => {
  const services = business.services || [];
  // Use pre-aggregated fields from BusinessSerializer; fall back to per-service computation
  const rating = business.avg_rating != null
    ? Number(business.avg_rating).toFixed(1)
    : (() => {
        const ratings = services.flatMap((s) => s.average_rating ? [s.average_rating] : []);
        return ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
      })();
  const reviews = business.review_count != null
    ? business.review_count
    : services.reduce((sum, s) => sum + (s.review_count || 0), 0);
  const city =
    business.profile?.city ||
    business.profile?.business_address ||
    business.profile?.address ||
    null;
  const preview = services.filter((s) => s.is_active).slice(0, 3);

  return (
    <Link
      to={`/business/${business.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={
            business.gallery_images?.[0]?.image ||
            business.profile_picture ||
            FALLBACK
          }
          alt={business.full_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Avatar badge */}
        <div className="absolute bottom-3 left-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-md">
            <img
              src={business.profile_picture || FALLBACK}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        {/* Rating badge */}
        {rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
            <StarIcon className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-900">{rating}</span>
            <span className="text-xs text-slate-400">({reviews})</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {business.profile?.business_name || business.full_name}
          </h3>
          {city && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              {city}
            </div>
          )}
        </div>

        {/* Services */}
        {preview.length > 0 ? (
          <div className="flex-1 divide-y divide-slate-100">
            {preview.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <ClockIcon className="h-3 w-3" />
                    {s.duration} min
                  </div>
                </div>
                <span className="ml-3 flex-shrink-0 text-sm font-bold text-slate-900">
                  ${Number(s.price).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No services listed yet</p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
            View & Book <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;
