import React from 'react';
import BusinessList from '../components/Business/BusinessList';

const Services = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">Discover Businesses</h1>
            <p className="text-xl text-primary-100">Find and book services from trusted business owners</p>
          </div>
        </div>

        {/* Businesses Section */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <BusinessList />
        </div>
      </div>
    </>
  );
};

export default Services;
