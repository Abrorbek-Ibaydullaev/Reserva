import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/api';
import BusinessCard from '../components/Business/BusinessCard';

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
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    userService
      .getBusinesses()
      .then((r) => setBusinesses(r.data.results || r.data || []))
      .catch(() => setError('Failed to load businesses. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    businesses.forEach((b) =>
      (b.services || []).forEach((s) => s.category_name && set.add(s.category_name))
    );
    return ['All', ...Array.from(set).sort()];
  }, [businesses]);

  const filtered = useMemo(() => {
    let list = businesses;

    if (selectedCategory !== 'All') {
      list = list.filter((b) =>
        (b.services || []).some((s) => s.category_name === selectedCategory)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.full_name?.toLowerCase().includes(q) ||
          b.profile?.business_name?.toLowerCase().includes(q) ||
          b.profile?.city?.toLowerCase().includes(q) ||
          (b.services || []).some((s) => s.name?.toLowerCase().includes(q))
      );
    }

    return list;
  }, [businesses, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero / Search bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 text-3xl font-extrabold text-white">
            Find a service near you
          </h1>
          <p className="mb-6 text-blue-100">
            Browse trusted professionals and book instantly
          </p>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by business, service, or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border-0 py-3.5 pl-12 pr-12 text-slate-900 shadow-lg outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
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
            <p className="text-sm text-slate-500">
              {filtered.length === 0
                ? 'No businesses found'
                : `${filtered.length} business${filtered.length !== 1 ? 'es' : ''} found`}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
            {(search || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
            <button
              className="mt-3 block mx-auto text-sm font-semibold underline"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="mb-3 text-4xl">🔍</p>
            <h2 className="text-lg font-semibold text-slate-900">No results found</h2>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term or category.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
