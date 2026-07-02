import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const approved = user?.profile?.is_approved;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="text-lg font-extrabold text-navy">
          Reserva <span className="text-teal">Biz</span>
        </div>
        <button onClick={logout} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </h1>
        <p className="mt-2 text-slate-600">
          {user?.profile?.business_name
            ? <>Business: <span className="font-semibold">{user.profile.business_name}</span></>
            : 'Your business dashboard.'}
        </p>

        {approved === false && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Your business account is pending approval. You can sign in with email/password now;
            Google sign-in becomes available once an admin approves your account.
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-400">
          Business management tools coming here.
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
