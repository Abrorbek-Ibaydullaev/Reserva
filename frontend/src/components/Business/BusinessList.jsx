// import React, { useState, useEffect } from 'react';
// import BusinessCard from './BusinessCard';
// import { userService } from '../../services/api';
// import {
//   MagnifyingGlassIcon,
//   AdjustmentsHorizontalIcon,
//   XMarkIcon
// } from '@heroicons/react/24/outline';

// const BusinessList = () => {
//   const [businesses, setBusinesses] = useState([]);
//   const [filteredBusinesses, setFilteredBusinesses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [filters, setFilters] = useState({
//     search: ''
//   });

//   const [showFilters, setShowFilters] = useState(false);

//   useEffect(() => {
//     fetchBusinesses();
//   }, []);

//   useEffect(() => {
//     applyFilters();
//   }, [filters, businesses]);

//   const fetchBusinesses = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await userService.getBusinesses();
//       // Handle both paginated and non-paginated responses
//       const businessesData = response.data.results || response.data;
//       setBusinesses(businessesData);
//       setFilteredBusinesses(businessesData);
//     } catch (err) {
//       console.error('Error fetching businesses:', err);
//       setError('Failed to load businesses. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const applyFilters = () => {
//     let filtered = [...businesses];

//     // Apply search filter
//     if (filters.search) {
//       const searchLower = filters.search.toLowerCase();
//       filtered = filtered.filter(business =>
//         business.full_name.toLowerCase().includes(searchLower) ||
//         business.email.toLowerCase().includes(searchLower) ||
//         (business.profile?.bio && business.profile.bio.toLowerCase().includes(searchLower))
//       );
//     }

//     setFilteredBusinesses(filtered);
//   };

//   const clearFilters = () => {
//     setFilters({ search: '' });
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <div className="text-red-600 mb-4">{error}</div>
//         <button
//           onClick={fetchBusinesses}
//           className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Search and Filters */}
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1 relative">
//             <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
//             <input
//               type="text"
//               placeholder="Search businesses..."
//               value={filters.search}
//               onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//             />
//           </div>

//           {/* Filter Toggle */}
//           <button
//             onClick={() => setShowFilters(!showFilters)}
//             className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
//           >
//             <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
//             Filters
//           </button>

//           {/* Clear Filters */}
//           {(filters.search) && (
//             <button
//               onClick={clearFilters}
//               className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
//             >
//               <XMarkIcon className="h-5 w-5 mr-1" />
//               Clear
//             </button>
//           )}
//         </div>

//         {/* Advanced Filters */}
//         {showFilters && (
//           <div className="mt-4 pt-4 border-t border-gray-200">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {/* Add more filters here if needed */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Location
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter location"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Results Count */}
//       <div className="flex justify-between items-center">
//         <p className="text-gray-600">
//           Showing {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
//         </p>
//       </div>

//       {/* Business Grid */}
//       {filteredBusinesses.length === 0 ? (
//         <div className="text-center py-12">
//           <div className="text-gray-500 mb-4">No businesses found matching your criteria.</div>
//           <button
//             onClick={clearFilters}
//             className="px-4 py-2 text-primary-600 hover:text-primary-800"
//           >
//             Clear filters
//           </button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredBusinesses.map((business) => (
//             <BusinessCard key={business.id} business={business} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default BusinessList;

import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import { userService } from '../../services/api';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const BusinessList = () => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, businesses]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getBusinesses();
      // Handle both paginated and non-paginated responses
      const businessesData = response.data.results || response.data;
      setBusinesses(businessesData);
      setFilteredBusinesses(businessesData);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(business =>
        business.full_name.toLowerCase().includes(searchLower) ||
        business.email.toLowerCase().includes(searchLower) ||
        (business.profile?.bio && business.profile.bio.toLowerCase().includes(searchLower))
      );
    }

    setFilteredBusinesses(filtered);
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchBusinesses}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>

          {/* Clear Filters */}
          {(filters.search) && (
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5 mr-1" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Add more filters here if needed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Business Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">No businesses found matching your criteria.</div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-primary-600 hover:text-primary-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessList;