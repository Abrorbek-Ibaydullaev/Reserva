import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  { name: 'Barber', emoji: '✂️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Nail salon', emoji: '💅', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Massage', emoji: '💆', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: 'Makeup', emoji: '💄', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Spa', emoji: '🧖', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Fitness', emoji: '🏋️', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Tattoo', emoji: '🖊️', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { name: 'Dental', emoji: '🦷', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg\'ona'];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Search & Discover',
    desc: 'Find local professionals by category, city, or service name.',
    color: 'bg-blue-600',
  },
  {
    step: '2',
    title: 'Pick a Time',
    desc: 'See real-time availability and choose the slot that works for you.',
    color: 'bg-violet-600',
  },
  {
    step: '3',
    title: 'Show Up & Enjoy',
    desc: 'Get a confirmation, receive a reminder, and just arrive.',
    color: 'bg-emerald-600',
  },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (city) params.set('city', city);
    navigate(`/services?${params.toString()}`);
  };

  const handleCategory = (cat) => {
    navigate(`/services?category=${encodeURIComponent(cat)}`);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 pb-20 pt-16">
        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <BoltIcon className="h-4 w-4 text-yellow-300" />
            O'zbekistondagi №1 bron qilish platformasi
          </div>

          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
            O'zingizga yaqin{' '}
            <span className="text-yellow-300">professional</span>
            <br />
            toping va bron qiling
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-blue-100">
            Sartarosh, go'zallik saloni, massaj va ko'plab xizmatlar —
            bir joyda, bir daqiqada.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="flex flex-1 items-center gap-2 border-b border-slate-100 px-4 py-3 sm:border-b-0 sm:border-r">
                <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Xizmat yoki salon nomi…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <MapPinIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent text-slate-600 focus:outline-none"
                >
                  <option value="">Barcha shaharlar</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="m-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Qidirish
              </button>
            </div>
          </form>

          {/* Logged-in CTA */}
          {isAuthenticated && user?.user_type === 'customer' && (
            <div className="mt-6">
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25 transition"
              >
                <CalendarDaysIcon className="h-4 w-4" />
                My appointments
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORIES ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
          Xizmat turini tanlang
        </h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategory(cat.name)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${cat.color}`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
          >
            Barcha salonlar <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            Qanday ishlaydi?
          </h2>
          <p className="mb-10 text-center text-slate-500">3 oddiy qadam</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="rounded-2xl bg-white p-6 shadow-sm text-center">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-white ${step.color}`}>
                  {step.step}
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ──────────────────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-6 text-center">
              <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Tasdiqlangan mutaxassislar</h3>
              <p className="text-sm text-slate-500">Barcha salonlar va ustalar tekshirilgan</p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-amber-50 p-6 text-center">
              <StarIcon className="h-10 w-10 text-amber-500" />
              <h3 className="font-bold text-slate-900">Haqiqiy sharhlar</h3>
              <p className="text-sm text-slate-500">Faqat haqiqiy mijozlar sharh qoldira oladi</p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-blue-50 p-6 text-center">
              <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
              <h3 className="font-bold text-slate-900">Xavfsiz bron</h3>
              <p className="text-sm text-slate-500">Ma'lumotlaringiz to'liq himoyalangan</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS CTA ───────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-white">
              Biznesingizni Reserva'ga qo'shing
            </h2>
            <p className="mb-8 text-slate-300">
              Onlayn bron tizimini ulang va mijozlaringizni ko'paytiring. Bepul boshlang.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-blue-500 px-8 py-3 font-semibold text-white hover:bg-blue-400 transition"
              >
                Ro'yxatdan o'tish
              </Link>
              <Link
                to="/services"
                className="rounded-xl border border-white/30 px-8 py-3 font-semibold text-white hover:bg-white/10 transition"
              >
                Salonlarni ko'rish
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
