import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, serviceService, fixMediaUrl } from '../services/api';
import Footer from '../components/Layout/Footer';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  UserCircleIcon,
  XMarkIcon,
  ScissorsIcon,
  SparklesIcon,
  EyeIcon,
  BoltIcon,
  CameraIcon,
  MusicalNoteIcon,
  WrenchIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  HeartIcon,
  HandRaisedIcon,
  PaintBrushIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

// Place your video at /public/hero.mp4 — gradient shows as fallback
const HERO_VIDEO = '/hero.mp4';

const HEADLINES = [
  ['O\'zbekistondagi eng yaxshi', 'mutaxassislarni toping'],
  ['Sartarosh, spa, salon —', 'bir joyda, bir daqiqada'],
  ['Qulay vaqtni tanlang,', 'bron qiling, keling'],
];

// ── Category icons ────────────────────────────────────────────────────────────
// Heroicons components are used where a good match exists; clean custom SVGs
// fill the gaps. All custom SVGs use strokeWidth="1.5" and strokeLinejoin="round"
// to match the Heroicons outline style.

const IC = (svg) => svg; // identity — keeps entries readable

const ICON_BARBER = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="4" rx="2"/>
    <path d="M6 10V7a1 1 0 011-1h10a1 1 0 011 1v3"/>
    <path d="M7 6V5M10 6V5M14 6V5M17 6V5"/>
    <path d="M4 14l-2 3M20 14l2 3"/>
  </svg>
);

const ICON_NAIL = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 21V9.5A1.5 1.5 0 0111.5 8h1A1.5 1.5 0 0114 9.5V21a1 1 0 01-1 1h-2a1 1 0 01-1-1z"/>
    <path d="M10 9V6h4v3"/>
    <path d="M11 6V3h2v3"/>
    <path d="M12 12v5"/>
  </svg>
);

const ICON_SPA = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-8"/>
    <path d="M12 14c0 0-5.5-1.5-6.5-6.5C8 7.5 10.5 9 12 14z"/>
    <path d="M12 14c0 0 5.5-1.5 6.5-6.5C16 7.5 13.5 9 12 14z"/>
    <path d="M12 14c0 0-2-5.5 0-10 2 4.5 0 10 0 10z"/>
    <path d="M9 21c1-.7 1.8-1 3-1s2 .3 3 1"/>
  </svg>
);

const ICON_DENTAL = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 4C7 4 3.5 6.5 3.5 11c0 3 1 4.5 2 6 1 1.5 1.5 4 3 4s2.5-3.5 3.5-3.5S14 21 15.5 21s2-2.5 3-4c1-1.5 2-3 2-6C20.5 6.5 17 4 15 4c-1.5 0-2.5.8-3 .8S10.5 4 9 4z"/>
    <path d="M9 4c0 0 1.5 2 3 2s3-2 3-2"/>
  </svg>
);

const ICON_DUMBBELL = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6v12M17.5 6v12"/>
    <path d="M4 8.5v7M20 8.5v7"/>
    <path d="M6.5 12h11"/>
  </svg>
);

const ICON_PAW = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8.5" cy="5.5" r="1.8"/>
    <circle cx="15.5" cy="5.5" r="1.8"/>
    <circle cx="4.8" cy="11" r="1.8"/>
    <circle cx="19.2" cy="11" r="1.8"/>
    <path d="M12 22c-4 0-7-2-5.5-5.5C7.5 14 9.5 13 12 13s4.5 1 5.5 3.5C19 20 16 22 12 22z"/>
  </svg>
);

const ICON_CLEAN = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l7-7"/>
    <path d="M10 14l9-9-4-4-9 9 4 4z"/>
    <path d="M14 5l4 4"/>
    <path d="M3 21c1.5 0 3-1 3-2.5S5 16 6.5 16 9 17.5 9 19"/>
  </svg>
);

const ICON_CAR = IC(
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-4l3-7h12l3 7v4h-2"/>
    <circle cx="7.5" cy="17" r="2.5"/>
    <circle cx="16.5" cy="17" r="2.5"/>
    <path d="M5 13h14"/>
    <path d="M9 6l-1 7M15 6l1 7"/>
  </svg>
);

const CAT_SVG_MAP = [
  { keys: ['hair'],                              svg: <ScissorsIcon /> },
  { keys: ['barber'],                            svg: ICON_BARBER },
  { keys: ['skin', 'beauty', 'makeup'],          svg: <SparklesIcon /> },
  { keys: ['nail'],                              svg: ICON_NAIL },
  { keys: ['massage'],                           svg: <HandRaisedIcon /> },
  { keys: ['brow', 'lash'],                      svg: <EyeIcon /> },
  { keys: ['spa', 'wellness', 'yoga', 'holistic', 'therapy'], svg: ICON_SPA },
  { keys: ['tattoo'],                            svg: <PaintBrushIcon /> },
  { keys: ['dental'],                            svg: ICON_DENTAL },
  { keys: ['fitness', 'gym', 'training', 'diet'], svg: ICON_DUMBBELL },
  { keys: ['pet', 'groo'],                       svg: ICON_PAW },
  { keys: ['health'],                            svg: <HeartIcon /> },
  { keys: ['photo'],                             svg: <CameraIcon /> },
  { keys: ['music', 'lesson'],                   svg: <MusicalNoteIcon /> },
  { keys: ['clean'],                             svg: ICON_CLEAN },
  { keys: ['electr'],                            svg: <BoltIcon /> },
  { keys: ['plumb'],                             svg: <WrenchIcon /> },
  { keys: ['account', 'legal', 'consult', 'financ'], svg: <BriefcaseIcon /> },
  { keys: ['educ', 'school'],                    svg: <AcademicCapIcon /> },
  { keys: ['car', 'detail', 'auto'],             svg: ICON_CAR },
];

const DEFAULT_SVG = <BuildingStorefrontIcon />;

const getCatSvg = (name = '') => {
  const n = name.toLowerCase();
  const match = CAT_SVG_MAP.find(({ keys }) => keys.some((k) => n.includes(k)));
  return match ? match.svg : DEFAULT_SVG;
};

// Extra categories to always show even if not in the backend list
const HARDCODED_EXTRAS = [
  'Barbers', 'Skin care', 'Brows & Lashes', 'Spa',
  'Tattoo', 'Physiotherapy', 'Holistic', 'Diet & training',
];


const UZ_CITIES = [
  'Toshkent','Samarqand','Buxoro','Namangan','Andijon',
  "Farg'ona","Nukus","Qarshi","Termiz","Jizzax",
  "Urganch","Navoiy","Guliston","Muborak","Chirchiq",
];

// ── City Picker Modal ─────────────────────────────────────────────────────────
const CityPickerModal = ({ onSelect, onClose, knownCities = [] }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const allCities = useMemo(() => {
    const merged = new Set([...knownCities, ...UZ_CITIES]);
    return [...merged].sort();
  }, [knownCities]);

  const filtered = q.trim()
    ? allCities.filter((c) => c.toLowerCase().includes(q.toLowerCase()))
    : allCities;

  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // Would reverse-geocode in production; for now pick from list
        inputRef.current?.focus();
      },
      () => {}
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Where are you located?</h3>
            <p className="mt-0.5 text-sm text-slate-400">We'll show services available in your city</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100 transition">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Use my location */}
          <button
            onClick={useLocation}
            className="mb-4 flex w-full items-center gap-3 rounded-xl border border-[#2eadd0]/30 bg-[#f0fafb] px-4 py-3 text-sm font-semibold text-[#2eadd0] hover:bg-[#e4f6f9] transition"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
            Use my location
          </button>

          {/* Search input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 mb-3">
            <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search city…"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">No cities found</p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city}
                  onClick={() => onSelect(city)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <MapPinIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="font-medium text-slate-900">{city}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Calendar popup ────────────────────────────────────────────────────────────
const CalendarModal = ({ selectedDate, onSelect, onClose }) => {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const prevMonth = () =>
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const nextMonth = () =>
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d) => {
    if (!d || !selectedDate) return false;
    const sd = new Date(selectedDate);
    return sd.getFullYear() === view.year && sd.getMonth() === view.month && sd.getDate() === d;
  };
  const isToday = (d) =>
    d && today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === d;
  const isPast = (d) => {
    if (!d) return false;
    const dt = new Date(view.year, view.month, d);
    dt.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return dt < t;
  };

  const handleDay = (d) => {
    if (!d || isPast(d)) return;
    const iso = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onSelect(iso);
  };

  const canPrev = view.year > today.getFullYear() || view.month > today.getMonth();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Preferred time</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <button onClick={prevMonth} disabled={!canPrev} className="rounded-full p-1.5 hover:bg-slate-100 disabled:opacity-30">
            <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
          </button>
          <p className="font-semibold text-slate-900">{MONTHS[view.month]} {view.year}</p>
          <button onClick={nextMonth} className="rounded-full p-1.5 hover:bg-slate-100">
            <ChevronRightIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-6 pb-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="py-1 text-center text-xs font-semibold text-slate-400">{h}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-1 px-6 pb-4">
          {cells.map((d, i) => (
            <button
              key={i}
              onClick={() => handleDay(d)}
              disabled={!d || isPast(d)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition
                ${!d ? 'invisible' : ''}
                ${isPast(d) ? 'cursor-default text-slate-300' : 'hover:bg-slate-100'}
                ${isToday(d) && !isSel(d) ? 'border-2 border-slate-800 text-slate-900 font-bold' : ''}
                ${isSel(d) ? 'bg-[#2eadd0] text-white hover:bg-[#29a0c0]' : ''}
              `}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Schedule button */}
        <div className="px-6 pb-6">
          <button
            onClick={() => { if (selectedDate) onClose(); }}
            className="w-full rounded-xl bg-[#2eadd0] py-3 font-semibold text-white hover:bg-[#29a0c0] transition disabled:opacity-50"
            disabled={!selectedDate}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Carousel ──────────────────────────────────────────────────────────────────
const Carousel = ({ children }) => {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 220) + 16), behavior: 'smooth' });
  };
  return (
    <div className="relative group/car">
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-5 top-[40%] z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 hover:bg-slate-50 transition opacity-0 group-hover/car:opacity-100"
      >
        <ChevronLeftIcon className="h-5 w-5 text-slate-700" />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute -right-5 top-[40%] z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 hover:bg-slate-50 transition opacity-0 group-hover/car:opacity-100"
      >
        <ChevronRightIcon className="h-5 w-5 text-slate-700" />
      </button>
    </div>
  );
};

// ── Business card ─────────────────────────────────────────────────────────────
const BizCard = ({ biz }) => {
  const name = biz.profile?.business_name || `${biz.first_name || ''} ${biz.last_name || ''}`.trim() || 'Business';
  const city = biz.profile?.city || '';
  const img = fixMediaUrl(biz.profile_picture) || fixMediaUrl(biz.gallery_images?.[0]?.image) || null;
  const services = biz.services_active || biz.services || [];
  const rating = biz.avg_rating != null ? Number(biz.avg_rating).toFixed(1) : null;
  const reviewCount = biz.review_count || 0;

  return (
    <Link
      to={`/business/${biz.id}`}
      data-card
      className="group/card flex-shrink-0 w-44 sm:w-56 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl bg-gradient-to-br from-slate-200 to-slate-100">🏪</div>
        )}
        {/* Rating badge — only shown when there are reviews */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <span className="text-yellow-400">★</span> {rating}
            <span className="ml-0.5 text-white/60 font-normal">· {reviewCount}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-slate-900 truncate">{name}</p>
        {city && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><MapPinIcon className="h-3 w-3" />{city}</p>}
        {services.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {services.slice(0, 2).map((s) => (
              <span key={s.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 truncate max-w-[90px]">{s.name}</span>
            ))}
            {services.length > 2 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">+{services.length - 2}</span>}
          </div>
        )}
      </div>
    </Link>
  );
};

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect staff/owners to their own portal — home page is customer-facing only
  useEffect(() => {
    if (authLoading) return;
    if (user?.user_type === 'business_owner') navigate('/dashboard', { replace: true });
    if (user?.user_type === 'employee') navigate('/employee/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const [search, setSearch] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [showCal, setShowCal] = useState(false);
  // Typewriter state
  const [tw, setTw] = useState({ l1: '', l2: '', phase: 'typing1', idx: 0 });
  const [cursorOn, setCursorOn] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [stickyIn, setStickyIn] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [videoErr, setVideoErr] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const catScrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [cityModal, setCityModal] = useState(null); // pending category name
  const [savedCity, setSavedCity] = useState(() => sessionStorage.getItem('reserva_user_city') || '');
  const [showWhereDrop, setShowWhereDrop] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [recentCities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('reserva_recent_cities') || '[]'); }
    catch { return []; }
  });
  const [recentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('reserva_recent_searches') || '[]'); }
    catch { return []; }
  });

  const sentinelRef = useRef(null);
  const whereRef = useRef(null);
  const searchRef = useRef(null);

  // Typewriter engine
  useEffect(() => {
    const { l1, l2, phase, idx } = tw;
    const target = HEADLINES[idx];
    let t;
    if (phase === 'typing1') {
      if (l1.length < target[0].length) {
        t = setTimeout(() => setTw((s) => ({ ...s, l1: target[0].slice(0, s.l1.length + 1) })), 95);
      } else {
        t = setTimeout(() => setTw((s) => ({ ...s, phase: 'typing2' })), 180);
      }
    } else if (phase === 'typing2') {
      if (l2.length < target[1].length) {
        t = setTimeout(() => setTw((s) => ({ ...s, l2: target[1].slice(0, s.l2.length + 1) })), 95);
      } else {
        t = setTimeout(() => setTw((s) => ({ ...s, phase: 'erasing' })), 2600);
      }
    } else if (phase === 'erasing') {
      if (l2.length > 0) {
        t = setTimeout(() => setTw((s) => ({ ...s, l2: s.l2.slice(0, -1) })), 48);
      } else if (l1.length > 0) {
        t = setTimeout(() => setTw((s) => ({ ...s, l1: s.l1.slice(0, -1) })), 48);
      } else {
        t = setTimeout(() => setTw({ l1: '', l2: '', phase: 'typing1', idx: (idx + 1) % HEADLINES.length }), 400);
      }
    }
    return () => clearTimeout(t);
  }, [tw]);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Sticky bar via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { setSticky(true); requestAnimationFrame(() => setStickyIn(true)); }
      else { setStickyIn(false); setTimeout(() => setSticky(false), 280); }
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    userService.getBusinesses()
      .then((r) => setBusinesses(r.data.results || r.data || []))
      .catch(() => {});
    serviceService.getCategories()
      .then((r) => {
        const fromApi = r.data.results || r.data || [];
        const apiNames = new Set(fromApi.map((c) => c.name.toLowerCase()));
        // append hardcoded extras that aren't already in the backend list
        const extras = HARDCODED_EXTRAS
          .filter((name) => !apiNames.has(name.toLowerCase()))
          .map((name, i) => ({ id: `extra-${i}`, name }));
        setCategories([...fromApi, ...extras]);
      })
      .catch(() => {
        // fallback: show only hardcoded extras
        setCategories(HARDCODED_EXTRAS.map((name, i) => ({ id: `extra-${i}`, name })));
      });
  }, []);

  // Group businesses by category
  const grouped = useMemo(() => {
    const map = {};
    businesses.forEach((b) => {
      const cats = [...new Set((b.services_active || b.services || []).map((s) => s.category_name).filter(Boolean))];
      cats.forEach((cat) => { if (!map[cat]) map[cat] = []; map[cat].push(b); });
    });
    return Object.entries(map).filter(([, arr]) => arr.length > 0).sort((a, b) => b[1].length - a[1].length);
  }, [businesses]);

  // Sort categories by number of services in that category (most → least)
  const sortedCategories = useMemo(() => {
    if (!categories.length) return categories;

    // Count services per category name across all businesses
    const counts = {};
    businesses.forEach((b) => {
      (b.services_active || b.services || []).forEach((s) => {
        const cat = (s.category_name || '').toLowerCase();
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    return [...categories].sort((a, b) => {
      const countA = counts[a.name.toLowerCase()] || 0;
      const countB = counts[b.name.toLowerCase()] || 0;
      return countB - countA; // highest demand first
    });
  }, [categories, businesses]);

  // Unique cities from loaded businesses
  const allCities = useMemo(() => {
    const s = new Set();
    businesses.forEach((b) => { if (b.profile?.city) s.add(b.profile.city); });
    return [...s].sort();
  }, [businesses]);

  // Cities matching current "where" input
  const citySuggestions = useMemo(() => {
    if (!where.trim()) return [];
    const q = where.toLowerCase();
    return allCities.filter((c) => c.toLowerCase().includes(q)).slice(0, 7);
  }, [where, allCities]);

  // Live search suggestions — businesses + service names matching query
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results = [];
    const seen = new Set();
    businesses.forEach((b) => {
      const bizName = b.profile?.business_name || `${b.first_name || ''} ${b.last_name || ''}`.trim();
      if (bizName && bizName.toLowerCase().includes(q) && !seen.has(bizName)) {
        seen.add(bizName);
        results.push({ type: 'business', label: bizName, sub: b.profile?.city || '', id: b.id });
      }
      (b.services_active || b.services || []).forEach((s) => {
        if (s.name && s.name.toLowerCase().includes(q) && !seen.has(s.name)) {
          seen.add(s.name);
          results.push({ type: 'service', label: s.name, sub: bizName, id: s.id });
        }
      });
    });
    return results.slice(0, 8);
  }, [search, businesses]);

  // Close Where dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (whereRef.current && !whereRef.current.contains(e.target)) setShowWhereDrop(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSearch = (term) => {
    setSearch(term);
    setShowSearchDrop(false);
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    localStorage.setItem('reserva_recent_searches', JSON.stringify(updated));
    const p = new URLSearchParams();
    p.set('q', term);
    if (where.trim()) p.set('city', where.trim());
    navigate(`/services?${p.toString()}`);
  };

  const selectCity = (city) => {
    setWhere(city);
    setShowWhereDrop(false);
    const updated = [city, ...recentCities.filter((c) => c !== city)].slice(0, 5);
    localStorage.setItem('reserva_recent_cities', JSON.stringify(updated));
  };

  const enableLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // In production: reverse-geocode coords to city name
        setShowWhereDrop(false);
      },
      () => setShowWhereDrop(false)
    );
  };

  // Category circle click — ask for city if not known this session
  const handleCatClick = (catName) => {
    if (savedCity) {
      navigate(`/services?category=${encodeURIComponent(catName)}&city=${encodeURIComponent(savedCity)}`);
    } else {
      setCityModal(catName);
    }
  };

  // City selected in modal
  const handleCitySelect = (city) => {
    setSavedCity(city);
    sessionStorage.setItem('reserva_user_city', city);
    setCityModal(null);
    navigate(`/services?category=${encodeURIComponent(cityModal)}&city=${encodeURIComponent(city)}`);
  };

  const doSearch = (e) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (search.trim()) p.set('q', search.trim());
    if (where.trim()) p.set('city', where.trim());
    else if (savedCity) p.set('city', savedCity);
    navigate(`/services?${p.toString()}`);
  };

  // ── Infinite-scroll categories ───────────────────────────────────────────────
  // The track renders the list THREE times. On mount (and whenever categories
  // change) we silently jump to the start of the middle copy so the user can
  // scroll left or right without ever hitting an end.
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el || sortedCategories.length === 0) return;

    // Each item is ~104 px wide (72px circle + 2×px-3 padding = ~96px + 8px gap)
    // We measure the first copy's actual width instead of hard-coding.
    const measureCopy = () => {
      const copy = el.querySelector('[data-cat-copy="0"]');
      return copy ? copy.offsetWidth : 0;
    };

    const jumpToMiddle = () => {
      const copyW = measureCopy();
      if (copyW > 0) el.scrollLeft = copyW;
    };

    jumpToMiddle();

    const onScroll = () => {
      const copyW = measureCopy();
      if (!copyW) return;
      // Past the end of the second copy → jump back to middle copy
      if (el.scrollLeft >= copyW * 2) {
        el.scrollLeft -= copyW;
      }
      // Before the start of the middle copy → jump forward to middle copy
      if (el.scrollLeft <= 0) {
        el.scrollLeft += copyW;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [sortedCategories]);

  // Mouse-drag-to-scroll for desktop
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      const delta = startX - e.pageX;
      el.scrollLeft = startScroll + delta;
    };
    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const whenLabel = when
    ? new Date(when + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'When?';


  const UserMenu = ({ dark }) => (
    <div className="relative">
      <button
        onClick={() => setUserMenu((v) => !v)}
        className={`flex items-center gap-1.5 text-sm font-medium transition ${
          dark ? 'text-white hover:text-slate-300' : 'text-white hover:text-blue-200'
        }`}
      >
        <UserCircleIcon className="h-6 w-6" />
        <span className="hidden sm:inline">{user?.first_name || 'Profile'}</span>
      </button>
      {userMenu && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white shadow-xl border border-slate-100 py-1 text-sm z-[200]">
          <Link to="/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Profile</Link>
          <Link to="/appointments" onClick={() => setUserMenu(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Appointments</Link>
          <button onClick={() => { logout(); setUserMenu(false); }} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-slate-50">Logout</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fa]">

      {/* ── STICKY BAR ─────────────────────────────────────────────────── */}
      {sticky && (
        <div className={`fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e] shadow-xl transition-all duration-[280ms] ${stickyIn ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <Link to="/" className="mr-1 flex-shrink-0 text-lg font-extrabold text-white hidden sm:block">Reserva</Link>

            <form onSubmit={doSearch} className="flex flex-1 items-center gap-2 min-w-0">
              {/* Search — with dropdown */}
              <div ref={searchRef} className="relative flex-1 min-w-0">
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${showSearchDrop ? 'border-[#2eadd0] bg-[#1e1e30]' : 'border-white/10 bg-[#2a2a3e]'}`}>
                  <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowSearchDrop(true); }}
                    onFocus={() => setShowSearchDrop(true)}
                    placeholder="Search…"
                    className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); setShowSearchDrop(true); }} className="flex-shrink-0 text-slate-400 hover:text-white transition">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search dropdown */}
                {showSearchDrop && (
                  <div className="absolute left-0 top-full mt-3 w-full min-w-0 rounded-2xl bg-white shadow-2xl z-[200] sm:min-w-[340px]">
                    <div className="absolute -top-2 left-8 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />

                    <div className="p-4">
                      {/* Live suggestions while typing */}
                      {search.trim() && searchSuggestions.length > 0 && (
                        <div className="space-y-0.5">
                          {searchSuggestions.map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectSearch(item.label)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                {item.type === 'business'
                                  ? <span className="text-base">🏪</span>
                                  : <MagnifyingGlassIcon className="h-4 w-4 text-slate-500" />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">{item.label}</p>
                                {item.sub && <p className="truncate text-xs text-slate-400">{item.sub}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No results */}
                      {search.trim() && searchSuggestions.length === 0 && (
                        <p className="px-3 py-2 text-sm text-slate-400">No results for "{search}"</p>
                      )}

                      {/* Recent searches when input is empty */}
                      {!search.trim() && recentSearches.length > 0 && (
                        <div>
                          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent searches</p>
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => selectSearch(term)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <MagnifyingGlassIcon className="h-4 w-4 text-slate-500" />
                              </div>
                              <span className="font-medium text-slate-900">{term}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Empty state */}
                      {!search.trim() && recentSearches.length === 0 && (
                        <p className="px-3 py-2 text-sm text-slate-400">Type to search services or businesses…</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Where — hidden on mobile */}
              <div ref={whereRef} className="relative w-44 flex-shrink-0 hidden md:block">
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${showWhereDrop ? 'border-[#2eadd0] bg-[#1e1e30]' : 'border-white/10 bg-[#2a2a3e]'}`}>
                  <MapPinIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <input
                    value={where}
                    onChange={(e) => { setWhere(e.target.value); setShowWhereDrop(true); }}
                    onFocus={() => setShowWhereDrop(true)}
                    placeholder="Where?"
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  {where && (
                    <button type="button" onClick={() => { setWhere(''); setShowWhereDrop(true); }} className="flex-shrink-0 text-slate-400 hover:text-white transition">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showWhereDrop && (
                  <div className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 rounded-2xl bg-white shadow-2xl z-[200]">
                    {/* Triangle arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />

                    <div className="p-4">
                      {/* Enable location */}
                      <button
                        type="button"
                        onClick={enableLocation}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#2eadd0] hover:bg-slate-50 transition"
                      >
                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                        </svg>
                        Enable location access
                      </button>

                      {/* Suggestions when typing */}
                      {where.trim() && citySuggestions.length > 0 && (
                        <div className="mt-2">
                          {citySuggestions.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => selectCity(city)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 transition text-left"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <MapPinIcon className="h-5 w-5 text-slate-500" />
                              </div>
                              <span className="font-medium text-slate-900">{city}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Recent searches when not typing */}
                      {!where.trim() && recentCities.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent searches</p>
                          {recentCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => selectCity(city)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 transition text-left"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <MapPinIcon className="h-5 w-5 text-slate-500" />
                              </div>
                              <span className="font-medium text-slate-900">{city}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Nothing to show */}
                      {!where.trim() && recentCities.length === 0 && (
                        <p className="mt-2 px-3 py-2 text-sm text-slate-400">Start typing a city name…</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* When — hidden on mobile */}
              <button
                type="button"
                onClick={() => setShowCal(true)}
                className="hidden md:flex w-32 flex-shrink-0 items-center gap-2 rounded-xl bg-[#2a2a3e] border border-white/10 px-3 py-2 text-sm text-left"
              >
                <ClockIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className={when ? 'text-white' : 'text-slate-500'}>{whenLabel}</span>
              </button>

              {/* Submit: icon-only on mobile, text on sm+ */}
              <button
                type="submit"
                className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#2eadd0] px-3 py-2 text-sm font-semibold text-white hover:bg-[#29a0c0] transition sm:px-5"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Right: hidden on mobile to avoid overflow */}
            <div className="flex-shrink-0 hidden sm:flex items-center gap-3 ml-1">
              {isAuthenticated
                ? <UserMenu dark />
                : <>
                    <Link to="/login" className="text-sm text-slate-400 hover:text-white transition">Login</Link>
                    <Link to="/register" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition">List your business</Link>
                  </>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — ~65vh, NOT full screen ──────────────────────────────── */}
      <section className="relative h-[65vh] min-h-[300px] max-h-[350px] flex flex-col overflow-hidden">

        {/* Video */}
        {!videoErr && (
          <video autoPlay muted loop playsInline onError={() => setVideoErr(true)} className="absolute inset-0 h-full w-full object-cover">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70" />

        {/* Navbar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
          <Link to="/" className="text-2xl font-extrabold text-white tracking-tight">Reserva</Link>
          <div className="flex items-center gap-3">
            {isAuthenticated
              ? <UserMenu />
              : <>
                  <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white transition">Login</Link>
                  <Link to="/register" className="rounded-full border border-white/30 bg-black/20 px-4 py-1.5 text-sm font-semibold text-white hover:bg-black/30 transition backdrop-blur-sm">
                    List your business
                  </Link>
                </>
            }
          </div>
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 min-h-[5rem] text-2xl font-extrabold leading-tight text-white sm:min-h-[6rem] sm:text-4xl md:text-5xl">
            {/* line 1 */}
            <span>
              {tw.l1}
              {(tw.phase === 'typing1' || (tw.phase === 'erasing' && tw.l2 === '')) && (
                <span className="ml-0.5 font-thin text-white/80" style={{ opacity: cursorOn ? 1 : 0 }}>|</span>
              )}
            </span>
            <br />
            {/* line 2 — blue accent */}
            <span className="text-blue-300">
              {tw.l2}
              {(tw.phase === 'typing2' || (tw.phase === 'erasing' && tw.l2.length > 0)) && (
                <span className="ml-0.5 font-thin text-blue-200/80" style={{ opacity: cursorOn ? 1 : 0 }}>|</span>
              )}
            </span>
          </h1>
          <p className="mb-7 px-2 text-sm text-white/70 sm:text-base">Yaqin atrofingizdagi go'zallik va sog'lomlashtirish bo'yicha mutaxassislarni kashf eting va buyurtma bering</p>

          {/* Search bar — single field like Booksy */}
          <form onSubmit={doSearch} className="w-full max-w-xl px-2 sm:px-0">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-2xl sm:px-5 sm:py-3">
              <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search services or businesses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm"
              />
              {/* On very small screens: icon-only button; on sm+: full text button */}
              <button
                type="submit"
                className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition sm:px-6"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* bottom fade into dark section */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f1a18] to-transparent pointer-events-none" />

        {/* Sentinel */}
        <div ref={sentinelRef} className="absolute bottom-0 h-px w-full pointer-events-none" />
      </section>

      {/* ── CATEGORY CIRCLES — infinite scroll (user-driven, no auto-play) ── */}
      <section className="bg-[#0f1a18] py-6">
        {sortedCategories.length === 0 ? (
          /* skeleton — shown while API loads */
          <div className="flex gap-6 overflow-hidden px-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-shrink-0 flex-col items-center gap-3">
                <div className="h-[72px] w-[72px] rounded-full bg-[#1a2e2b] animate-pulse" />
                <div className="h-3 w-16 rounded bg-[#1a2e2b] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          /*
           * Infinite-scroll technique (no auto-play):
           *   - Render the list THREE times side-by-side.
           *   - On mount, silently jump scrollLeft to the width of copy 0 so
           *     the user starts in the middle copy.
           *   - A scroll listener teleports back/forward by one copy width
           *     when the user approaches either edge — imperceptible to the eye.
           *   - Desktop: mouse-drag via mousedown/mousemove listeners.
           *   - Mobile: native touch scrolling (overflow-x: auto).
           */
          <div className="relative">
            {/* Left edge fade */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 z-10 bg-gradient-to-r from-[#0f1a18] to-transparent" />
            {/* Right edge fade */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-gradient-to-l from-[#0f1a18] to-transparent" />

            <div
              ref={catScrollRef}
              className="flex items-start overflow-x-auto pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ cursor: 'grab' }}
            >
              {[0, 1, 2].map((copy) => (
                <div
                  key={copy}
                  data-cat-copy={copy}
                  className="flex flex-shrink-0 items-start"
                >
                  {sortedCategories.map((cat) => (
                    <button
                      key={`${copy}-${cat.id}`}
                      onClick={() => handleCatClick(cat.name)}
                      className="group flex flex-shrink-0 flex-col items-center gap-2 px-3 py-1"
                    >
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#1a2e2b] text-white transition-all duration-200 group-hover:bg-[#243d3a] group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-900/30">
                        {cat.svg_icon_url
                          ? <img src={cat.svg_icon_url} alt={cat.name} className="w-8 h-8 object-contain" />
                          : <span className="h-9 w-9 [&>svg]:h-full [&>svg]:w-full">{getCatSvg(cat.name)}</span>
                        }
                      </div>
                      <span className="w-[80px] text-center text-[11px] font-bold leading-tight text-white">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── BUSINESS CAROUSELS ───────────────────────────────────────────── */}
      <div className="bg-white py-10">
        {businesses.length === 0 ? (
          <div className="mx-auto max-w-6xl space-y-12 px-8">
            {[1, 2].map((n) => (
              <div key={n}>
                <div className="mb-4 h-5 w-44 rounded-lg bg-slate-200 animate-pulse" />
                <div className="flex gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-52 w-56 flex-shrink-0 rounded-2xl bg-slate-100 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          grouped.map(([cat, list]) => (
            <div key={cat} className="mx-auto mb-10 max-w-6xl overflow-hidden px-4 sm:px-8">
              <div className="mb-5 flex items-end justify-between">
                <h2 className="text-xl font-bold text-slate-900">{cat} near you</h2>
                <button
                  onClick={() => handleCatClick(cat)}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  See all <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
              <Carousel>
                {list.map((b) => <BizCard key={b.id} biz={b} />)}
              </Carousel>
            </div>
          ))
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-[#1a1a2e] px-6 py-14 text-center">
          <h2 className="mb-3 text-2xl font-extrabold text-white">Add your business to Reserva</h2>
          <p className="mb-8 text-slate-400">Connect online booking and grow your client base. Free to start.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="rounded-xl bg-[#2eadd0] px-8 py-3 font-semibold text-white hover:bg-[#29a0c0] transition">Register</Link>
            <Link to="/services" className="rounded-xl border border-white/20 px-8 py-3 font-semibold text-white hover:bg-white/10 transition">Browse businesses</Link>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── CALENDAR MODAL ───────────────────────────────────────────────── */}
      {showCal && (
        <CalendarModal
          selectedDate={when}
          onSelect={(iso) => { setWhen(iso); }}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* ── CITY PICKER MODAL ────────────────────────────────────────────── */}
      {cityModal && (
        <CityPickerModal
          knownCities={allCities}
          onSelect={handleCitySelect}
          onClose={() => setCityModal(null)}
        />
      )}
    </div>
  );
};

export default Home;
