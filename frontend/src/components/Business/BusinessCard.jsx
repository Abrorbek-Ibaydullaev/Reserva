

import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// const BusinessCard = ({ business }) => {
//   // Get up to 3 services
//   const services = business.services || [];

//   // Mock data for demo - replace with real data from your API
//   const rating = 5.0;
//   const reviewCount = 107;
//   const distance = '3.4 km';

//   // Check if there are promotional services
//   const hasPromotions = services.some(service => service.discount_percentage > 0);

//   return (
//     <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
//       {/* Hero Image with Rating Badge */}
//       <div className="relative h-56 overflow-hidden bg-gray-100">
//         <img
//           src={business.profile_picture || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
//           alt={business.full_name}
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//           onError={(e) => {
//             e.target.src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
//           }}
//         />

//         {/* Promoted Badge */}
//         {hasPromotions && (
//           <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-md">
//             <SparklesIcon className="h-3 w-3 text-primary-600" />
//             <span className="text-xs font-semibold text-gray-900 dark:text-white">Promoted</span>
//           </div>
//         )}

//         {/* Rating Badge - Top Right */}
//         <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
//           <div className="flex flex-col items-center">
//             <div className="flex items-center gap-0.5 mb-0.5">
//               <StarIcon className="h-3 w-3 text-yellow-400" />
//               <span className="text-white font-bold text-sm">{rating}</span>
//             </div>
//             <span className="text-white/90 text-[10px] font-medium whitespace-nowrap">
//               {reviewCount} reviews
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Business Content */}
//       <div className="p-5">
//         {/* Business Header */}
//         <div className="mb-3">
//           <Link to={`/business/${business.id}`}>
//             <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1">
//               {business.full_name}
//             </h3>
//           </Link>

//           {/* Distance and Location */}
//           <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
//             <span className="font-medium">{distance}</span>
//             <span className="mx-1.5">•</span>
//             <MapPinIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
//             <span className="truncate">
//               {business.profile?.business_address && `${business.profile.business_address}, `}
//               {business.profile?.city || 'Lublin'}
//             </span>
//           </div>
//         </div>

//         {/* Services List */}
//         {/* Services List */}
//         <div className="space-y-4 mt-4">
//           {services.slice(0, 3).map((service, index) => {
//             const hasDiscount = service.discount_percentage > 0;
//             const originalPrice = parseFloat(service.price);
//             const discountedPrice = hasDiscount
//               ? (originalPrice * (1 - service.discount_percentage / 100)).toFixed(2)
//               : originalPrice.toFixed(2);

//             return (
//               <div key={service.id} className="group/service">
//                 {/* Container: items-start keeps the Name at the top-left */}
//                 <div className="flex items-start justify-between py-4">

//                   {/* LEFT SIDE: Name and Add-ons pill */}
//                   <div className="flex-1">
//                     <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
//                       {service.name}
//                     </h4>

//                     {service.has_addons && (
//                       <button className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors border border-gray-200 dark:border-gray-600">
//                         <SparklesIcon className="h-3 w-3" />
//                         Add-ons
//                       </button>
//                     )}
//                   </div>

//                   {/* RIGHT SIDE: Price Group and Book Button side-by-side */}
//                   <div className="flex items-start gap-4 ml-4">
//                     <div className="flex flex-col items-end pt-1">
//                       {hasDiscount && (
//                         <span className="text-gray-400 text-[11px] line-through leading-none mb-1">
//                           {originalPrice.toFixed(2)} zł
//                         </span>
//                       )}
//                       <span className="text-gray-900 dark:text-white font-bold text-sm leading-none">
//                         {discountedPrice} zł
//                       </span>
//                       {/* Duration sits right under the price */}
//                       <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
//                         {service.duration} min
//                       </span>
//                     </div>

//                     <Link
//                       to={`/business/${business.id}?service=${service.id}`}
//                       className="px-5 py-1.5 bg-[#1B809E] text-white text-xs font-bold rounded hover:bg-opacity-90 transition-all shadow-sm"
//                     >
//                       Book
//                     </Link>
//                   </div>
//                 </div>

//                 {/* Divider - thin and subtle */}
//                 {index < Math.min(services.length - 1, 2) && (
//                   <div className="border-t border-gray-100 dark:border-gray-700/50" />
//                 )}
//               </div>
//             );
//           })}
//         </div>

//         {/* View All Services Link */}
//         {services.length > 3 && (
//           <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
//             <Link
//               to={`/business/${business.id}`}
//               className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold inline-flex items-start group"
//             >
//               View all {services.length} services
//               <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//               </svg>
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
const BusinessCard = ({ business }) => {
  const services = business.services || [];

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
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
                            {parseFloat(service.price).toFixed(2)} zł
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