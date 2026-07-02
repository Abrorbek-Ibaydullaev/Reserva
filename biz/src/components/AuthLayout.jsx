import React from 'react';

/** Centered card shell shared by the Login and Register pages. */
const AuthLayout = ({ icon, title, subtitle, children }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10">
          {icon}
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-navy">
          Reserva <span className="text-teal">Biz</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
