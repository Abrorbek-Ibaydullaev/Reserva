import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="app-page">
      <div className="app-card mx-auto flex max-w-3xl flex-col items-center justify-center px-8 py-16 text-center">
        <span className="rounded-full bg-muted-token px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-danger">
          404 Error
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-token text-token">Page not found</h1>
        <p className="mt-4 max-w-xl text-lg text-soft text-soft">
          The page you requested does not exist or is not available for your account.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="btn-primary"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
