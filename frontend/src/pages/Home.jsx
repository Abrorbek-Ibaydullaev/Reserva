import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

// ── swap with your own mp4 URL or a local /public/hero.mp4 ──────────────────
const HERO_VIDEO =
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';

const HEADLINES = [
  ['O\'zbekistondagi eng yaxshi', 'mutaxassislarni toping'],
  ['Sartarosh, spa, salon —', 'bir joyda, bir daqiqada'],
  ['Qulay vaqtni tanlang,', 'bron qiling, keling'],
];

const CATEGORY_ICONS = {
  Barber: '✂️', Hair: '💇', Nail: '💅', Massage: '💆',
  Spa: '🧖', Makeup: '💄', Tattoo: '🖊️', Fitness: '🏋️',
  Dental: '🦷', Beauty: '✨', Skin: '🧴', Brow: '👁️',
};
const categoryIcon = (name = '') => {
  const k = Object.keys(CATEGORY_ICONS).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return k ? CATEGORY_ICONS[k] : '🏪';
};

// ── Carousel ─────────────────────────────────────────────────────────────────
const Carousel = ({ children }) => {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 260) + 16), behavior: 'smooth' });
  };
  return (
    <div className="relative group/car">
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-5 top-1/2 z-10 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-100 hover:bg-slate-50 transition opacity-0 group-hover/car:opacity-100"
      >
        <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute -right-5 top-1/2 z-10 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-100 hover:bg-slate-50 transition opacity-0 group-hover/car:opacity-100"
      >
        <ChevronRightIcon className="h-5 w-5 text-slate-600" />
      </button>
    </div>
  );
};

// ── Business card ─────────────────────────────────────────────────────────────
const BizCard = ({ biz }) => {
  const name =
    biz.profile?.business_name ||
    `${biz.first_name || ''} ${biz.last_name || ''}`.trim() ||
    'Business';
  const city = biz.profile?.city || '';
  const img = biz.profile_picture || biz.gallery_images?.[0]?.image || null;
  const services = biz.services_active || biz.services || [];
  const reviewCount = biz.review_count || 0;

  return (
    <Link
      to={`/business/${biz.id}`}
      data-card
      className="group/card flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
    >
      {/* Photo */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100">
        {img ? (
          <img
            src={img}
            alt={name}
            className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl">🏪</div>
        )}
        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span className="text-yellow-400">★</span>
          <span>5.0</span>
          {reviewCount > 0 && <span className="text-white/70">· {reviewCount}</span>}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm text-slate-900 truncate">{name}</p>
        {city && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPinIcon className="h-3 w-3 flex-shrink-0" />{city}
          </p>
        )}
        {services.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {services.slice(0, 2).map((s) => (
              <span key={s.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 truncate max-w-[90px]">
                {s.name}
              </span>
            ))}
            {services.length > 2 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">+{services.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [headIdx, setHeadIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [stickyIn, setStickyIn] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [videoErr, setVideoErr] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const sentinelRef = useRef(null);

  // Rotate headlines
  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => { setHeadIdx((i) => (i + 1) % HEADLINES.length); setFade(true); }, 350);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  // Sticky nav: triggers when hero sentinel leaves viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setSticky(true);
        requestAnimationFrame(() => setStickyIn(true));
      } else {
        setStickyIn(false);
        setTimeout(() => setSticky(false), 280);
      }
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Load businesses
  useEffect(() => {
    userService.getBusinesses()
      .then((r) => setBusinesses(r.data.results || r.data || []))
      .catch(() => {});
  }, []);

  // Group businesses by their offered service categories
  const grouped = useMemo(() => {
    const map = {};
    businesses.forEach((b) => {
      const cats = [...new Set(
        (b.services_active || b.services || [])
          .map((s) => s.category_name)
          .filter(Boolean)
      )];
      cats.forEach((cat) => {
        if (!map[cat]) map[cat] = [];
        map[cat].push(b);
      });
    });
    // Keep categories with ≥ 1 business, sort by count desc
    return Object.entries(map)
      .filter(([, arr]) => arr.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [businesses]);

  const doSearch = (e) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (search.trim()) p.set('q', search.trim());
    if (where.trim()) p.set('city', where.trim());
    navigate(`/services?${p.toString()}`);
  };

  const lines = HEADLINES[headIdx];

  return (
    <div className="min-h-screen bg-white">

      {/* ── FIXED NAV (over hero, hidden when sticky bar shows) ─────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          sticky ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-extrabold text-white tracking-tight drop-shadow">
            Reserva
          </Link>
          {/* Auth */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/30 transition"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  {user?.first_name || 'Profile'}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-sm">
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Profile</Link>
                    <Link to="/appointments" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Appointments</Link>
                    <button onClick={() => { logout(); setShowUserMenu(false); }} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-slate-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition backdrop-blur-sm">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition shadow">
                  List your business
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── STICKY SEARCH BAR (Booksy-style, slides in on scroll) ────────── */}
      {sticky && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] shadow-xl transition-all duration-280 ${
            stickyIn ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
            {/* Logo */}
            <Link to="/" className="mr-2 text-xl font-extrabold text-white tracking-tight flex-shrink-0">
              Reserva
            </Link>

            {/* Search inputs */}
            <form onSubmit={doSearch} className="flex flex-1 items-center gap-2 min-w-0">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 min-w-0">
                <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services or businesses"
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex w-40 flex-shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2">
                <MapPinIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="Where?"
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex w-36 flex-shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2">
                <ClockIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <input
                  type="date"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Search
              </button>
            </form>

            {/* Auth */}
            <div className="flex flex-shrink-0 items-center gap-2 ml-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-white hover:text-slate-300 transition"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="hidden md:inline">{user?.first_name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-sm z-50">
                      <Link to="/profile" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Profile</Link>
                      <Link to="/appointments" onClick={() => setShowUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Appointments</Link>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-slate-50">Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-slate-300 hover:text-white transition">Login</Link>
                  <Link to="/register" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition">
                    List your business
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">

        {/* Video background */}
        {!videoErr && (
          <video
            autoPlay muted loop playsInline
            onError={() => setVideoErr(true)}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}
        {/* Gradient fallback + overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800" />
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          {/* Rotating headline */}
          <h1
            className="mb-5 max-w-2xl text-5xl font-extrabold leading-tight text-white md:text-6xl"
            style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}
          >
            {lines[0]}<br />
            <span className="text-blue-400">{lines[1]}</span>
          </h1>

          <p className="mb-8 max-w-md text-lg text-slate-300">
            Discover and book beauty &amp; wellness professionals near you
          </p>

          {/* Search bar — single field like Booksy hero */}
          <form onSubmit={doSearch} className="w-full max-w-lg">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-2xl">
              <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search services or businesses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Category chips — bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              ['Hair salons', '💇'], ['Barbers', '✂️'], ['Skin care', '🧴'],
              ['Nail salons', '💅'], ['Massage', '💆'], ['Brows & Lashes', '👁️'],
              ['Spa', '🧖'], ['Tattoo', '🖊️'],
            ].map(([label, icon]) => (
              <button
                key={label}
                onClick={() => navigate(`/services?q=${encodeURIComponent(label)}`)}
                className="flex-shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/15 transition whitespace-nowrap"
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sentinel — crossing this triggers sticky bar */}
        <div ref={sentinelRef} className="absolute bottom-0 h-px w-full" />
      </section>

      {/* ── BUSINESS CAROUSELS (grouped by category) ─────────────────────── */}
      <div className="bg-[#f7f8fa] py-10">
        {businesses.length === 0 ? (
          // Skeleton
          <div className="mx-auto max-w-6xl px-6 space-y-12">
            {[1, 2].map((n) => (
              <div key={n}>
                <div className="mb-4 h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
                <div className="flex gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-56 h-52 rounded-2xl bg-slate-200 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-slate-500">No businesses available yet.</p>
          </div>
        ) : (
          grouped.map(([category, bizList]) => (
            <div key={category} className="mx-auto mb-12 max-w-6xl px-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {categoryIcon(category)} {category} near you
                </h2>
                <button
                  onClick={() => navigate(`/services?q=${encodeURIComponent(category)}`)}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  See all <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
              <Carousel>
                {bizList.map((b) => <BizCard key={b.id} biz={b} />)}
              </Carousel>
            </div>
          ))
        )}
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">How it works</h2>
          <p className="mb-10 text-slate-400">Book in 3 simple steps</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { n: '1', color: 'bg-blue-600', title: 'Search', desc: 'Find professionals by category, name, or location.' },
              { n: '2', color: 'bg-violet-600', title: 'Pick a time', desc: 'See live availability and choose your slot.' },
              { n: '3', color: 'bg-emerald-600', title: 'Show up', desc: 'Get confirmed, receive a reminder, and enjoy.' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-extrabold text-white ${s.color}`}>{s.n}</div>
                <h3 className="mb-1.5 font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-[#1a1a2e] px-6 py-16 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-white">Add your business to Reserva</h2>
          <p className="mb-8 text-slate-400">Connect online booking and grow your client base. Start free.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-500 transition">
              Register
            </Link>
            <Link to="/services" className="rounded-xl border border-white/20 px-8 py-3 font-semibold text-white hover:bg-white/10 transition">
              Browse businesses
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
