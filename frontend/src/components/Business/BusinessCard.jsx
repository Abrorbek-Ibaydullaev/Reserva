

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const BusinessCard = ({ business }) => {
  const services = business.services || [];
  const navigate = useNavigate();

  const openBusiness = () => {
    navigate(`/business/${business.id}`);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBusiness();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openBusiness}
      onKeyDown={handleCardKeyDown}
      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* MAIN HORIZONTAL CONTAINER */}
      <div className="flex flex-col md:flex-row">

        {/* LEFT SIDE: Business Image */}
        <div className="relative w-full md:w-72 lg:w-96 h-64 md:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={business.profile_picture || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
            alt={business.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Rating Badge Overlay */}
          <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex flex-col items-center text-white">
              <span className="font-bold text-sm">5.0</span>
              <span className="text-[10px]">107 reviews</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Business Info & Services */}
        <div className="flex-1 p-6">
          {/* Business Header */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-2xl mb-1">
              {business.full_name}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <span>3.4 km</span>
              <span className="mx-2">•</span>
              <span>{business.profile?.business_address || 'Krakowskie Przedmieście, 19'}</span>
            </div>
          </div>

          {/* Services List - Booksy Style Alignment */}
          <div className="space-y-0">
            {services.slice(0, 3).map((service, index) => {
              const discountedPrice = service.discount_percentage > 0
                ? (service.price * (1 - service.discount_percentage / 100)).toFixed(2)
                : parseFloat(service.price).toFixed(2);

              return (
                <div key={service.id} className="py-4 border-t border-gray-100 dark:border-gray-700/50 first:border-0">
                  <div className="flex items-start justify-between">
                    {/* Service Name & Add-ons */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {service.name}
                      </h4>
                      {service.has_addons && (
                        <button className="mt-3 flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full text-[11px] font-bold text-gray-600 dark:text-gray-300">
                          Add-ons
                        </button>
                      )}
                    </div>

                    {/* Price, Duration, and Button Group */}
                    <div className="flex items-start gap-6">
                      <div className="text-right">
                        {service.discount_percentage > 0 && (
                          <span className="block text-gray-400 text-xs line-through mb-1">
                            {parseFloat(service.price).toFixed(2)} $
                          </span>
                        )}
                        <span className="block text-gray-900 dark:text-white font-bold text-sm">
                          {discountedPrice} $
                        </span>
                        <span className="block text-[10px] text-gray-500 mt-1">
                          {service.duration}min
                        </span>
                      </div>

                      <Link
                        to={`/business/${business.id}?service=${service.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="px-5 py-2 bg-[#1B809E] text-white text-xs font-bold rounded hover:bg-opacity-90 transition-all"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
