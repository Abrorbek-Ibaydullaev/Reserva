import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '', email: '', phone_number: '', business_name: '', password: '', password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setError(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(typeof result.message === 'string' ? result.message : 'Registration failed. Please check your details.');
    }
  };

  const field =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20';

  return (
    <AuthLayout
      icon={<BuildingStorefrontIcon className="h-7 w-7 text-teal" />}
      title="Register your business"
      subtitle="Create your Reserva Biz account to start taking bookings."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input className={field} value={form.full_name} onChange={update('full_name')} placeholder="Jasur Karimov" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Business name</label>
          <input className={field} value={form.business_name} onChange={update('business_name')} placeholder="Barber 77" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" className={field} value={form.email} onChange={update('email')} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
          <input type="tel" className={field} value={form.phone_number} onChange={update('phone_number')} placeholder="+998 90 123 45 67" required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" className={field} value={form.password} onChange={update('password')} placeholder="••••••••" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
            <input type="password" className={field} value={form.password2} onChange={update('password2')} placeholder="••••••••" required />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white transition hover:bg-[#096f7b] disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create business account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
