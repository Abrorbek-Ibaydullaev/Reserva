import React, { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import { serviceService } from '../../services/api';
import { responseList } from '../../utils/data';
import { 
  FunnelIcon,
  BarsArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const ServiceList = ({ limit = null }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'popular',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceService.getAllServices();
      const items = responseList(response);
      setServices(items);
      setFilteredServices(items);
    } catch {
      setError('Failed to load services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await serviceService.getCategories();
      setCategories(responseList(response));
    } catch {}
  };

  const applyFilters = () => {
    let filtered = [...services];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        (service.category_name && service.category_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(service => 
        service.category === parseInt(filters.category)
      );
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(service => 
        parseFloat(service.price) >= parseFloat(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(service => 
        parseFloat(service.price) <= parseFloat(filters.maxPrice)
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
    }

    // Apply limit if specified
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    setFilteredServices(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'popular',
      search: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="app-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-empty py-12 text-center">
        <p className="mb-4 text-danger text-danger">{error}</p>
        <button 
          onClick={fetchServices}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="app-filterbar">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search services, categories, or providers..."
                className="auth-input-password w-full"
              />
              {filters.search && (
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-token"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 space-y-4 border-t border-token pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Category Filter */}
              <div>
                <label className="field-label">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="field-label">
                  Sort By
                </label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="field-label">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-full"
                    min="0"
                  />
                  <span className="self-center text-muted">to</span>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-full"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="app-link text-sm"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">
          Showing <span className="font-semibold">{filteredServices.length}</span> of{' '}
          <span className="font-semibold">{services.length}</span> services
        </p>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="ui-empty py-12 text-center">
          <FunnelIcon className="mx-auto mb-4 h-12 w-12 text-muted" />
          <h3 className="section-title mb-2">No services found</h3>
          <p className="body-text mb-4">Try adjusting your filters or search term</p>
          <button
            onClick={clearFilters}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {limit && filteredServices.length >= limit && (
            <div className="text-center">
              <button className="btn-secondary">
                View More Services
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;
