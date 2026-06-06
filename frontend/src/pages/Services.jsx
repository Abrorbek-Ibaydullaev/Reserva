import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/api';
import BusinessCard from '../components/Business/BusinessCard';
import { asArray, responseList } from '../utils/data';

const CATEGORY_ICONS = {
  'Barber': '✂️',
  'Hair': '💇',
  'Nail': '💅',
  'Massage': '💆',
  'Spa': '🧖',
  'Makeup': '💄',
  'Tattoo': '🖊️',
  'Fitness': '🏋️',
  'Dental': '🦷',
  'Beauty': '✨',
};

const getCategoryIcon = (name) => {
  if (!name) return '🏪';
  const key = Object.keys(CATEGORY_ICONS).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? CATEGORY_ICONS[key] : '🏪';
};

const Services = () => {
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get('category') || 'All'
  );
  const [cityFilter] = useState(() => searchParams.get('city') || '');

  useEffect(() => {
    userService
      .getBusinesses()
      .then((r) => setBusinesses(responseList(r)))
      .catch(() => setError('Failed to load businesses. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    businesses.forEach((b) =>
      asArray(b.services).forEach((s) => s.category_name && set.add(s.category_name))
    );
    return ['All', ...Array.from(set).sort()];
  }, [businesses]);

  const filtered = useMemo(() => {
    let list = businesses;

    // Filter by city (from URL param)
    if (cityFilter.trim()) {
      const city = cityFilter.toLowerCase();
      list = list.filter((b) =>
        b.profile?.city?.toLowerCase().includes(city)
      );
    }

    // Filter by category (checks both services and services_active arrays)
    if (selectedCategory !== 'All') {
      list = list.filter((b) =>
        [...asArray(b.services), ...asArray(b.services_active)].some(
          (s) => s.category_name === selectedCategory
        )
      );
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.full_name?.toLowerCase().includes(q) ||
          b.profile?.business_name?.toLowerCase().includes(q) ||
          b.profile?.city?.toLowerCase().includes(q) ||
          [...asArray(b.services), ...asArray(b.services_active)].some(
            (s) => s.name?.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [businesses, search, selectedCategory, cityFilter]);

  return (
    <div className="app-page p-0">
      {/* Hero / Search bar */}
      <div className="border-b border-token bg-surface-token px-4 py-12 border-token bg-app">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand text-brand">Marketplace</p>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-token text-token">
            {selectedCategory !== 'All' ? selectedCategory : 'Find a service near you'}
          </h1>
          {cityFilter && (
            <div className="ui-chip ui-badge-brand mb-3 inline-flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {cityFilter}
            </div>
          )}
          <p className="mx-auto mb-6 max-w-xl text-sm leading-6 text-muted text-muted">
            Browse trusted professionals and book instantly
          </p>
          <div className="relative mx-auto max-w-2xl">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by business, service, or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="auth-input-password w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-soft"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="sticky top-0 z-10 border-b border-token bg-surface-token px-4 py-3 backdrop-blur-xl border-token bg-surface-token">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-app text-white shadow-sm dark:bg-app dark:text-token'
                    : 'border border-token bg-surface-token text-soft hover:border-token hover:text-brand border-token bg-surface-token text-soft'
                }`}
              >
                {cat !== 'All' && (
                  <span className="text-base leading-none">{getCategoryIcon(cat)}</span>
                )}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {!loading && !error && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted">
              {filtered.length === 0
                ? 'No businesses found'
                : `${filtered.length} business${filtered.length !== 1 ? 'es' : ''} found`}
              {selectedCategory !== 'All' && ` · ${selectedCategory}`}
              {cityFilter && ` · ${cityFilter}`}
            </p>
            {(search || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="app-link flex items-center gap-1 text-sm"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="app-spinner" />
          </div>
        )}

        {error && (
          <div className="ui-empty border-token bg-muted-token p-6 text-center text-danger border-token bg-muted-token text-danger">
            {error}
            <button
              className="app-link mx-auto mt-3 block text-sm"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="ui-empty p-12 text-center">
            <p className="mb-3 text-4xl">🔍</p>
            <h2 className="text-lg font-semibold text-token text-token">No results found</h2>
            <p className="mt-1 text-sm text-muted">
              Try a different search term or category.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              className="btn-primary mt-4"
            >
              Show all businesses
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
