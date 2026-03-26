import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] bg-gray-50 px-4 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <span className="rounded-full bg-red-50 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          404 Error
        </span>
        <h1 className="mt-6 text-4xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600">
          The page you requested does not exist or is not available for your account.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="rounded-xl bg-[#4a90b0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3f7c97]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
