import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  LanguageIcon,
  ClockIcon,
  ScissorsIcon,
  SparklesIcon,
  HandRaisedIcon,
  AcademicCapIcon,
  CameraIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  { Icon: CalendarDaysIcon, title: '24/7 Online Booking', text: 'Customers book any time, from any device — no phone calls, no missed appointments.' },
  { Icon: BuildingStorefrontIcon, title: 'Your Business Profile', text: 'A professional, shareable page with your services, prices, hours and gallery.' },
  { Icon: PaperAirplaneIcon, title: 'Telegram Reminders', text: 'Automatic confirmations and reminders that keep your calendar full and cut no-shows.' },
  { Icon: ChartBarIcon, title: 'Analytics & Security', text: 'See your bookings and growth at a glance, protected with JWT + OTP security.' },
];

const WHY = [
  { Icon: ClockIcon, title: '24/7 self-booking', text: 'Take bookings even while you sleep.' },
  { Icon: PaperAirplaneIcon, title: 'Telegram reminders', text: 'Fewer no-shows, automatically.' },
  { Icon: LanguageIcon, title: 'Uzbek · Russian · English', text: 'Built for how your clients speak.' },
  { Icon: ShieldCheckIcon, title: 'Secure by design', text: 'JWT + OTP + RBAC protection.' },
];

const INDUSTRIES = [
  { Icon: ScissorsIcon, label: 'Barbershops' },
  { Icon: SparklesIcon, label: 'Hair Stylists' },
  { Icon: HandRaisedIcon, label: 'Nail Technicians' },
  { Icon: SparklesIcon, label: 'Beauty Salons' },
  { Icon: AcademicCapIcon, label: 'Tutors' },
  { Icon: CameraIcon, label: 'Photographers' },
];

const STEPS = [
  { n: 1, title: 'Create your profile', text: 'Sign up and add your business — no payment needed to start.' },
  { n: 2, title: 'Add services & hours', text: 'List what you offer, your prices and your working hours.' },
  { n: 3, title: 'Share your booking link', text: 'Put it in your bio, stories and chats so clients can book.' },
  { n: 4, title: 'Get bookings & reminders', text: 'Appointments land in your dashboard; reminders go out automatically.' },
];

const FAQS = [
  { q: 'How much does it cost to start?', a: 'You can create your profile and take your first bookings for free. Paid plans add analytics and advanced features as you grow.' },
  { q: 'Do I need my own website?', a: 'No. Reserva gives your business a professional, bookable page you can share anywhere.' },
  { q: 'Which languages are supported?', a: 'The customer booking experience is fully trilingual — Uzbek, Russian and English.' },
  { q: 'How do reminders work?', a: 'Reserva sends automatic confirmations and reminders through a Telegram bot, which helps reduce no-shows.' },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="font-semibold text-slate-900">{q}</span>
        <ChevronDownIcon className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-5 text-sm leading-7 text-slate-600">{a}</p>}
    </div>
  );
};

const Landing = () => (
  <div className="bg-white text-slate-900">
    {/* ── NAV ─────────────────────────────────────────────── */}
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-navy">
          Reserva <span className="text-teal">Biz</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900">Log in</Link>
          <Link to="/register" className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#096f7b]">Get started free</Link>
        </nav>
      </div>
    </header>

    {/* ── HERO ────────────────────────────────────────────── */}
    <section className="bg-gradient-to-br from-[#0D1B3E] via-[#12234f] to-[#0A7E8C] text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-100">
            For service businesses in Uzbekistan
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            The booking system that <span className="text-gold">grows your business</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
            Reserva Biz gives your salon, barbershop or studio a professional booking page,
            Telegram reminders, and everything you need to fill your calendar — 24/7.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="rounded-xl bg-teal px-8 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#0b8fa0]">
              Get started free
            </Link>
            <Link to="/login" className="rounded-xl border border-white/25 px-8 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10">
              Log in
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-300">No setup fees · Telegram reminders · Uzbek / Russian / English</p>
        </div>

        {/* Calendar mockup */}
        <div className="hidden lg:block">
          <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Today</span>
              <CalendarDaysIcon className="h-5 w-5 text-teal" />
            </div>
            {['09:00 · Haircut — Tim', '10:30 · Beard trim — Aziz', '12:00 · Coloring — Nilufar', '14:00 · Manicure — Dilnoza'].map((row) => (
              <div key={row} className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-teal" /> {row}
              </div>
            ))}
            <div className="mt-3 rounded-xl bg-teal/10 px-4 py-3 text-center text-sm font-semibold text-teal">
              + 8 more bookings this week
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── WHY / VALUE CARDS ──────────────────────────────── */}
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight">Why Reserva Biz</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10">
              <Icon className="h-6 w-6 text-teal" />
            </div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── FEATURES DEEP-DIVE ─────────────────────────────── */}
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Everything you need to go digital</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">Discover the tools that turn WhatsApp chaos into a full, organized calendar.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-navy text-teal">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── INDUSTRIES ─────────────────────────────────────── */}
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight">Reserva Biz for your business</h2>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {INDUSTRIES.map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:border-teal/40 hover:shadow-md">
            <Icon className="h-8 w-8 text-teal" />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* ── HOW TO START ───────────────────────────────────── */}
    <section className="bg-navy py-16 text-white">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">How to start</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, text }) => (
            <div key={n} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal font-extrabold text-white">{n}</div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/register" className="inline-flex rounded-xl bg-teal px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#0b8fa0]">
            Create your business account
          </Link>
        </div>
      </div>
    </section>

    {/* ── FAQ ────────────────────────────────────────────── */}
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight">Frequently asked questions</h2>
      {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
    </section>

    {/* ── FOOTER ─────────────────────────────────────────── */}
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="text-lg font-extrabold text-navy">Reserva <span className="text-teal">Biz</span></div>
        <div className="flex items-center gap-5 text-sm text-slate-500">
          <Link to="/login" className="hover:text-slate-900">Log in</Link>
          <Link to="/register" className="hover:text-slate-900">Register</Link>
          <a href="https://reserva.services" className="hover:text-slate-900">reserva.services</a>
          <a href="mailto:support@reserva.services" className="hover:text-slate-900">support@reserva.services</a>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Reserva. All rights reserved.</p>
    </footer>
  </div>
);

export default Landing;
