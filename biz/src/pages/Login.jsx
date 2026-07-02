import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasRecaptcha = !!RECAPTCHA_SITE_KEY;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (hasRecaptcha && !recaptchaToken) {
      setError('Please complete the reCAPTCHA.');
      return;
    }
    setLoading(true);
    const result = await login(email, password, recaptchaToken);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(
        result.status === 401
          ? 'Incorrect email or password.'
          : typeof result.message === 'string' ? result.message : 'Login failed.'
      );
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  const field =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20';

  return (
    <AuthLayout
      icon={<ArrowRightOnRectangleIcon className="h-7 w-7 text-teal" />}
      title="Sign in to Reserva Biz"
      subtitle="Manage your business bookings."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input type="password" className={field} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required />
        </div>

        {hasRecaptcha && (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
          />
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || (hasRecaptcha && !recaptchaToken)}
          className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white transition hover:bg-[#096f7b] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Divider + Google (approved business owners only) */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleAuthButton onError={setError} />

      <p className="mt-6 text-center text-sm text-slate-500">
        New to Reserva Biz?{' '}
        <Link to="/register" className="font-semibold text-teal hover:underline">Register your business</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
