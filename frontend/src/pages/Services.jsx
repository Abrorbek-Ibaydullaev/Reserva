import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/api';
import BusinessCard from '../components/Business/BusinessCard';
import { categoryKey } from '../../../shared/categories.js';

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
  const { t } = useTranslation();
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
      .getBusinesses(cityFilter ? { city: cityFilter } : undefined)
      .then((r) => setBusinesses(r.data.results || r.data || []))
      .catch(() => setError(t('services_page.failed_load')))
      .finally(() => setLoading(false));
  }, [cityFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    businesses.forEach((b) =>
      (b.services || []).forEach((s) => s.category_name && set.add(s.category_name))
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
        [...(b.services || []), ...(b.services_active || [])].some(
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
          [...(b.services || []), ...(b.services_active || [])].some(
            (s) => s.name?.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [businesses, search, selectedCategory, cityFilter]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#0f1118]">
      {/* Hero / Search bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-1 text-2xl font-extrabold text-white sm:text-3xl">
            {selectedCategory !== 'All' ? t(categoryKey(selectedCategory), { defaultValue: selectedCategory }) : t('services_page.find_service')}
          </h1>
          {cityFilter && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {cityFilter}
            </div>
          )}
          <p className="mb-6 text-blue-100">
            {t('services_page.subtitle')}
          </p>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('services_page.search_placeholder')}
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
      <div className="sticky top-16 z-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400'
                }`}
              >
                {cat !== 'All' && (
                  <span className="text-base leading-none">{getCategoryIcon(cat)}</span>
                )}
                {cat === 'All' ? t('common.all') : t(categoryKey(cat), { defaultValue: cat })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {!loading && !error && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filtered.length === 0
                ? t('services_page.no_businesses')
                : t('services_page.businesses_found', { count: filtered.length })}
              {selectedCategory !== 'All' && ` · ${t(categoryKey(selectedCategory), { defaultValue: selectedCategory })}`}
              {cityFilter && ` · ${cityFilter}`}
            </p>
            {(search || selectedCategory !== 'All') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <XMarkIcon className="h-4 w-4" />
                {t('services_page.clear_filters')}
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
              {t('services_page.try_again')}
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center">
            <p className="mb-3 text-4xl">🔍</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('services_page.no_results_title')}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('services_page.no_results_desc')}
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t('services_page.show_all')}
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
