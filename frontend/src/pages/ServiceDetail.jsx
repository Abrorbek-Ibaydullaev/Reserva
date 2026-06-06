import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarIcon, ClockIcon, TagIcon, UserIcon } from '@heroicons/react/24/outline';
import { serviceService, fixMediaUrl } from '../services/api';
import { asNumber } from '../utils/data';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=80';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(asNumber(value));

const formatDuration = (minutes) => {
  const total = asNumber(minutes);
  if (!total) return 'Duration TBD';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadService = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await serviceService.getServiceById(serviceId);
      setService(response.data || null);
    } catch {
      setError('Unable to load this service right now.');
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  if (loading) {
    return (
      <div className="app-page flex min-h-[70vh] items-center justify-center">
        <div className="app-spinner" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="app-page min-h-[70vh]">
        <div className="ui-empty mx-auto max-w-xl border-token bg-muted-token p-8 text-center text-danger border-token bg-muted-token text-danger">
          <p>{error || 'Service not found.'}</p>
          <button
            type="button"
            onClick={loadService}
            className="btn-primary mt-5"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const image = fixMediaUrl(service.thumbnail) || FALLBACK_IMAGE;
  const businessId = service.business_owner;

  return (
    <div className="app-page min-h-[70vh]">
      <div className="app-card-pad mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.95fr_1.05fr] md:p-8">
        <div className="app-media">
          <img
            src={image}
            alt={service.name || 'Service'}
            className="h-72 w-full object-cover md:h-full"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand text-brand">
            {service.category_name || 'Service'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-token text-token">
            {service.name || 'Service'}
          </h1>
          <p className="mt-4 text-base leading-7 text-soft text-soft">
            {service.description || 'No service description is available yet.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="surface-subtle rounded-xl p-4">
              <TagIcon className="h-5 w-5 text-brand" />
              <p className="mt-2 text-sm text-muted">Price</p>
              <p className="text-lg font-semibold text-token">{formatPrice(service.price)}</p>
            </div>
            <div className="surface-subtle rounded-xl p-4">
              <ClockIcon className="h-5 w-5 text-brand" />
              <p className="mt-2 text-sm text-muted">Duration</p>
              <p className="text-lg font-semibold text-token">{formatDuration(service.duration)}</p>
            </div>
            <div className="surface-subtle rounded-xl p-4 sm:col-span-2">
              <UserIcon className="h-5 w-5 text-brand" />
              <p className="mt-2 text-sm text-muted">Provider</p>
              <p className="text-lg font-semibold text-token">
                {service.business_owner_name || 'Business'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/book/${service.id}`}
              className="btn-primary"
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              Book now
            </Link>
            {businessId ? (
              <Link
                to={`/business/${businessId}`}
                className="btn-secondary"
              >
                View business
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
