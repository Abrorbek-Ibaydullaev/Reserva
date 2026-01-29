import React from 'react';
import ServiceList from '../components/Services/ServiceList';

const Services = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">Discover Services</h1>
            <p className="text-xl text-primary-100">Find and book the perfect service for your needs</p>
          </div>
        </div>

        {/* Services Section */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <ServiceList />
        </div>
      </div>
    </>
  );
};

export default Services;
