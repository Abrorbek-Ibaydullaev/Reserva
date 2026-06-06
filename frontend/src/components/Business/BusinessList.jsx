import React, { useCallback, useEffect, useState } from 'react';
import BusinessCard from './BusinessCard';
import { userService } from '../../services/api';
import { responseList } from '../../utils/data';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getBusinesses();
      const businessesData = responseList(response);
      setBusinesses(businessesData);
      setFilteredBusinesses(businessesData);
    } catch {
      setError('Failed to load businesses. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    const searchLower = filters.search.trim().toLowerCase();

    if (!searchLower) {
      setFilteredBusinesses(businesses);
      return;
    }

    setFilteredBusinesses(
      businesses.filter((business) =>
        business.full_name?.toLowerCase().includes(searchLower) ||
        business.email?.toLowerCase().includes(searchLower) ||
        business.profile?.bio?.toLowerCase().includes(searchLower)
      )
    );
  }, [filters, businesses]);

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="app-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-empty py-12 text-center">
        <div className="mb-4 text-danger text-danger">{error}</div>
        <button
          type="button"
          onClick={fetchBusinesses}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="app-filterbar">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="auth-input w-full"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <AdjustmentsHorizontalIcon className="mr-2 h-5 w-5" />
            Filters
          </button>

          {filters.search ? (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-ghost"
            >
              <XMarkIcon className="mr-1 h-5 w-5" />
              Clear
            </button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-4 border-t border-token pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="field-label">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Showing {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {filteredBusinesses.length === 0 ? (
        <div className="ui-empty py-12 text-center">
          <div className="mb-4">No businesses found matching your criteria.</div>
          <button
            type="button"
            onClick={clearFilters}
            className="app-link"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business, index) => (
            <BusinessCard key={business.id ?? index} business={business} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessList;
