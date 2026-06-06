import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, serviceService, fixMediaUrl } from '../services/api';
import Footer from '../components/Layout/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { asArray, asNumber, responseList } from '../utils/data';
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
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const HERO_VIDEO = '/hero.mp4';

const HEADLINES = [
  ["O'zbekistondagi eng yaxshi", 'mutaxassislarni toping'],
  ['Sartarosh, spa, salon -', 'bir joyda, bir daqiqada'],
  ['Qulay vaqtni tanlang,', 'bron qiling, keling'],
];

const CAT_SVG_MAP = [
  { keys: ['hair', 'barber'], svg: <ScissorsIcon /> },
  { keys: ['skin', 'beauty', 'makeup'], svg: <SparklesIcon /> },
  { keys: ['massage'], svg: <HandRaisedIcon /> },
  { keys: ['brow', 'lash'], svg: <EyeIcon /> },
  { keys: ['spa', 'wellness', 'yoga', 'holistic', 'therapy'], svg: <HeartIcon /> },
  { keys: ['tattoo'], svg: <PaintBrushIcon /> },
  { keys: ['fitness', 'gym', 'training', 'diet'], svg: <HeartIcon /> },
  { keys: ['health', 'dental'], svg: <HeartIcon /> },
  { keys: ['photo'], svg: <CameraIcon /> },
  { keys: ['music', 'lesson'], svg: <MusicalNoteIcon /> },
  { keys: ['clean', 'electr', 'plumb'], svg: <WrenchIcon /> },
  { keys: ['account', 'legal', 'consult', 'financ'], svg: <BriefcaseIcon /> },
  { keys: ['educ', 'school'], svg: <AcademicCapIcon /> },
  { keys: ['car', 'detail', 'auto'], svg: <BoltIcon /> },
];

const DEFAULT_SVG = <BuildingStorefrontIcon />;

const getCatSvg = (name = '') => {
  const normalized = name.toLowerCase();
  const match = CAT_SVG_MAP.find(({ keys }) => keys.some((key) => normalized.includes(key)));
  return match ? match.svg : DEFAULT_SVG;
};

const HARDCODED_EXTRAS = [
  'Barbers',
  'Skin care',
  'Brows & Lashes',
  'Spa',
  'Tattoo',
  'Physiotherapy',
  'Holistic',
  'Diet & training',
];

const UZ_CITIES = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  "Farg'ona",
  'Nukus',
  'Qarshi',
  'Termiz',
  'Jizzax',
  'Urganch',
  'Navoiy',
  'Guliston',
  'Muborak',
  'Chirchiq',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CityPickerModal = ({ onSelect, onClose, knownCities = [] }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allCities = useMemo(() => {
    const merged = new Set([...knownCities, ...UZ_CITIES]);
    return [...merged].sort();
  }, [knownCities]);

  const filtered = q.trim()
    ? allCities.filter((city) => city.toLowerCase().includes(q.toLowerCase()))
    : allCities;

  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => inputRef.current?.focus(),
      () => {}
    );
  };

  return (
    <div className="modal-backdrop">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="modal-panel relative max-w-md">
        <div className="modal-header">
          <div>
            <h3 className="section-title">Where are you located?</h3>
            <p className="caption-text mt-1">Choose a city to see relevant availability.</p>
          </div>
          <button type="button" onClick={onClose} className="icon-button">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body">
          <button type="button" onClick={useLocation} className="btn-secondary mb-4 w-full justify-start">
            <MapPinIcon className="h-5 w-5" />
            Use my location
          </button>

          <div className="relative mb-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search city"
              className="auth-input"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-token"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="max-h-60 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="empty-state text-center text-sm">No cities found.</p>
            ) : (
              filtered.map((city) => (
                <button key={city} type="button" onClick={() => onSelect(city)} className="dropdown-item">
                  <span className="icon-badge h-9 w-9">
                    <MapPinIcon className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-token">{city}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarModal = ({ selectedDate, onSelect, onClose }) => {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const prevMonth = () =>
    setView(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }));
  const nextMonth = () =>
    setView(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }));

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const date = new Date(selectedDate);
    return date.getFullYear() === view.year && date.getMonth() === view.month && date.getDate() === day;
  };
  const isToday = (day) =>
    day && today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;
  const isPast = (day) => {
    if (!day) return false;
    const date = new Date(view.year, view.month, day);
    date.setHours(0, 0, 0, 0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return date < start;
  };

  const handleDay = (day) => {
    if (!day || isPast(day)) return;
    onSelect(`${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  const canPrev = view.year > today.getFullYear() || view.month > today.getMonth();

  return (
    <div className="modal-backdrop">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="modal-panel relative max-w-sm">
        <div className="modal-header">
          <h3 className="section-title">Preferred time</h3>
          <button type="button" onClick={onClose} className="icon-button">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={prevMonth} disabled={!canPrev} className="icon-button">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <p className="font-bold text-token">
              {MONTHS[view.month]} {view.year}
            </p>
            <button type="button" onClick={nextMonth} className="icon-button">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 pb-2">
            {DAY_HEADERS.map((header) => (
              <div key={header} className="py-1 text-center text-xs font-bold text-muted">
                {header}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              const selected = isSelected(day);
              const past = isPast(day);
              return (
                <button
                  key={`${day || 'empty'}-${index}`}
                  type="button"
                  onClick={() => handleDay(day)}
                  disabled={!day || past}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    !day ? 'invisible' : ''
                  } ${selected ? 'bg-primary text-white' : 'text-token hover:bg-muted-token'} ${
                    isToday(day) && !selected ? 'ring-2 ring-primary/30' : ''
                  } ${past ? 'text-muted opacity-50' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => selectedDate && onClose()} disabled={!selectedDate} className="btn-primary mt-5 w-full">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

const Carousel = ({ children }) => {
  const ref = useRef(null);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 240) + 16), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => scroll(-1)} className="icon-button absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <div ref={ref} className="scrollbar-none flex gap-4 overflow-x-auto pb-1">
        {children}
      </div>
      <button type="button" onClick={() => scroll(1)} className="icon-button absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:inline-flex">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const BizCard = ({ biz }) => {
  const name = biz?.profile?.business_name || `${biz?.first_name || ''} ${biz?.last_name || ''}`.trim() || 'Business';
  const city = biz?.profile?.city || '';
  const img = fixMediaUrl(biz?.profile_picture) || fixMediaUrl(asArray(biz?.gallery_images)[0]?.image) || null;
  const services = [...asArray(biz?.services_active), ...asArray(biz?.services)];
  const rating = biz?.avg_rating != null ? asNumber(biz.avg_rating).toFixed(1) : null;
  const reviewCount = asNumber(biz?.review_count);

  return (
    <Link to={biz?.id ? `/business/${biz.id}` : '/services'} data-card className="card-hover w-60 flex-shrink-0 overflow-hidden">
      <div className="app-media relative h-44 rounded-none">
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted-token">
            <BuildingStorefrontIcon className="h-12 w-12 text-muted" />
          </div>
        )}
        {rating ? (
          <span className="badge badge-warning absolute right-3 top-3">
            {rating}
            <span className="opacity-70">({reviewCount})</span>
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-bold text-token">{name}</p>
        {city ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPinIcon className="h-3.5 w-3.5" />
            {city}
          </p>
        ) : null}
        {services.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {services.slice(0, 2).map((service) => (
              <span key={service.id} className="badge badge-brand max-w-[95px] truncate">
                {service.name}
              </span>
            ))}
            {services.length > 2 ? <span className="badge badge-muted">+{services.length - 2}</span> : null}
          </div>
        ) : (
          <p className="caption-text mt-3">No services listed yet</p>
        )}
      </div>
    </Link>
  );
};

const Home = () => {
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (user?.user_type === 'business_owner') navigate('/dashboard', { replace: true });
    if (user?.user_type === 'employee') navigate('/employee/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const [search, setSearch] = useState('');
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [showCal, setShowCal] = useState(false);
  const [tw, setTw] = useState({ l1: '', l2: '', phase: 'typing1', idx: 0 });
  const [cursorOn, setCursorOn] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [stickyIn, setStickyIn] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [businessesError, setBusinessesError] = useState('');
  const [videoErr, setVideoErr] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [cityModal, setCityModal] = useState(null);
  const [savedCity, setSavedCity] = useState(() => {
    try {
      return sessionStorage.getItem('reserva_user_city') || '';
    } catch {
      return '';
    }
  });
  const [showWhereDrop, setShowWhereDrop] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [recentCities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('reserva_recent_cities') || '[]');
    } catch {
      return [];
    }
  });
  const [recentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('reserva_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const sentinelRef = useRef(null);
  const mountedRef = useRef(true);
  const whereRef = useRef(null);
  const searchRef = useRef(null);
  const catScrollRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setBusinessesLoading(true);
    setBusinessesError('');

    try {
      const response = await userService.getBusinesses();
      if (!mountedRef.current) return;
      setBusinesses(responseList(response));
    } catch {
      if (!mountedRef.current) return;
      setBusinesses([]);
      setBusinessesError('Unable to load businesses right now.');
    } finally {
      if (mountedRef.current) setBusinessesLoading(false);
    }
  }, []);

  useEffect(() => {
    const { l1, l2, phase, idx } = tw;
    const target = HEADLINES[idx];
    let timeout;

    if (phase === 'typing1') {
      if (l1.length < target[0].length) {
        timeout = setTimeout(() => setTw((state) => ({ ...state, l1: target[0].slice(0, state.l1.length + 1) })), 95);
      } else {
        timeout = setTimeout(() => setTw((state) => ({ ...state, phase: 'typing2' })), 180);
      }
    } else if (phase === 'typing2') {
      if (l2.length < target[1].length) {
        timeout = setTimeout(() => setTw((state) => ({ ...state, l2: target[1].slice(0, state.l2.length + 1) })), 95);
      } else {
        timeout = setTimeout(() => setTw((state) => ({ ...state, phase: 'erasing' })), 2600);
      }
    } else if (phase === 'erasing') {
      if (l2.length > 0) {
        timeout = setTimeout(() => setTw((state) => ({ ...state, l2: state.l2.slice(0, -1) })), 48);
      } else if (l1.length > 0) {
        timeout = setTimeout(() => setTw((state) => ({ ...state, l1: state.l1.slice(0, -1) })), 48);
      } else {
        timeout = setTimeout(() => setTw({ l1: '', l2: '', phase: 'typing1', idx: (idx + 1) % HEADLINES.length }), 400);
      }
    }

    return () => clearTimeout(timeout);
  }, [tw]);

  useEffect(() => {
    const id = setInterval(() => setCursorOn((value) => !value), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return undefined;
    let hideTimer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setSticky(true);
          requestAnimationFrame(() => setStickyIn(true));
        } else {
          setStickyIn(false);
          hideTimer = setTimeout(() => setSticky(false), 280);
        }
      },
      { threshold: 0 }
    );
    observer.observe(element);
    return () => {
      clearTimeout(hideTimer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchBusinesses();
    setCategoriesLoading(true);
    setCategoriesError('');

    serviceService
      .getCategories()
      .then((response) => {
        if (cancelled) return;
        const fromApi = responseList(response);
        const apiNames = new Set(fromApi.map((category) => String(category.name || '').toLowerCase()));
        const extras = HARDCODED_EXTRAS.filter((name) => !apiNames.has(name.toLowerCase())).map((name, i) => ({
          id: `extra-${i}`,
          name,
        }));
        setCategories([...fromApi, ...extras]);
        setCategoriesError('');
      })
      .catch(() => {
        if (cancelled) return;
        setCategories(HARDCODED_EXTRAS.map((name, i) => ({ id: `extra-${i}`, name })));
        setCategoriesError('Showing starter categories while the catalog reconnects.');
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchBusinesses]);

  const grouped = useMemo(() => {
    const map = {};
    businesses.forEach((business) => {
      const cats = [
        ...new Set(
          [...asArray(business.services_active), ...asArray(business.services)]
            .map((service) => service.category_name)
            .filter(Boolean)
        ),
      ];
      if (cats.length === 0) {
        if (!map['Featured businesses']) map['Featured businesses'] = [];
        map['Featured businesses'].push(business);
        return;
      }
      cats.forEach((cat) => {
        if (!map[cat]) map[cat] = [];
        map[cat].push(business);
      });
    });
    return Object.entries(map)
      .filter(([, arr]) => arr.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
  }, [businesses]);

  const sortedCategories = useMemo(() => {
    if (!categories.length) return categories;
    const counts = {};
    businesses.forEach((business) => {
      [...asArray(business.services_active), ...asArray(business.services)].forEach((service) => {
        const cat = (service.category_name || '').toLowerCase();
        if (cat) counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return [...categories].sort((a, b) => {
      const countA = counts[a.name.toLowerCase()] || 0;
      const countB = counts[b.name.toLowerCase()] || 0;
      return countB - countA;
    });
  }, [categories, businesses]);

  const allCities = useMemo(() => {
    const cities = new Set();
    businesses.forEach((business) => {
      if (business.profile?.city) cities.add(business.profile.city);
    });
    return [...cities].sort();
  }, [businesses]);

  const citySuggestions = useMemo(() => {
    if (!where.trim()) return [];
    const query = where.toLowerCase();
    return allCities.filter((city) => city.toLowerCase().includes(query)).slice(0, 7);
  }, [where, allCities]);

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    const results = [];
    const seen = new Set();
    businesses.forEach((business) => {
      const bizName = business.profile?.business_name || `${business.first_name || ''} ${business.last_name || ''}`.trim();
      if (bizName && bizName.toLowerCase().includes(query) && !seen.has(bizName)) {
        seen.add(bizName);
        results.push({ type: 'business', label: bizName, sub: business.profile?.city || '', id: business.id });
      }
      [...asArray(business.services_active), ...asArray(business.services)].forEach((service) => {
        if (service.name && service.name.toLowerCase().includes(query) && !seen.has(service.name)) {
          seen.add(service.name);
          results.push({ type: 'service', label: service.name, sub: bizName, id: service.id });
        }
      });
    });
    return results.slice(0, 8);
  }, [search, businesses]);

  useEffect(() => {
    const handler = (event) => {
      if (whereRef.current && !whereRef.current.contains(event.target)) setShowWhereDrop(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSearch = (term) => {
    setSearch(term);
    setShowSearchDrop(false);
    const updated = [term, ...recentSearches.filter((item) => item !== term)].slice(0, 5);
    try {
      localStorage.setItem('reserva_recent_searches', JSON.stringify(updated));
    } catch {}
    const params = new URLSearchParams();
    params.set('q', term);
    if (where.trim()) params.set('city', where.trim());
    navigate(`/services?${params.toString()}`);
  };

  const selectCity = (city) => {
    setWhere(city);
    setShowWhereDrop(false);
    const updated = [city, ...recentCities.filter((item) => item !== city)].slice(0, 5);
    try {
      localStorage.setItem('reserva_recent_cities', JSON.stringify(updated));
    } catch {}
  };

  const enableLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setShowWhereDrop(false),
      () => setShowWhereDrop(false)
    );
  };

  const handleCatClick = (catName) => {
    if (savedCity) {
      navigate(`/services?category=${encodeURIComponent(catName)}&city=${encodeURIComponent(savedCity)}`);
    } else {
      setCityModal(catName);
    }
  };

  const handleCitySelect = (city) => {
    setSavedCity(city);
    try {
      sessionStorage.setItem('reserva_user_city', city);
    } catch {}
    setCityModal(null);
    navigate(`/services?category=${encodeURIComponent(cityModal)}&city=${encodeURIComponent(city)}`);
  };

  const doSearch = (event) => {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (where.trim()) params.set('city', where.trim());
    else if (savedCity) params.set('city', savedCity);
    navigate(`/services?${params.toString()}`);
  };

  useEffect(() => {
    const el = catScrollRef.current;
    if (!el || sortedCategories.length === 0) return undefined;

    const measureCopy = () => el.querySelector('[data-cat-copy="0"]')?.offsetWidth || 0;
    const jumpToMiddle = () => {
      const copyWidth = measureCopy();
      if (copyWidth > 0) el.scrollLeft = copyWidth;
    };

    jumpToMiddle();

    const onScroll = () => {
      const copyWidth = measureCopy();
      if (!copyWidth) return;
      if (el.scrollLeft >= copyWidth * 2) el.scrollLeft -= copyWidth;
      if (el.scrollLeft <= 0) el.scrollLeft += copyWidth;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [sortedCategories]);

  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return undefined;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const onMouseDown = (event) => {
      isDown = true;
      startX = event.pageX;
      startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const onMouseMove = (event) => {
      if (!isDown) return;
      el.scrollLeft = startScroll + startX - event.pageX;
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

  const whenLabel = when ? new Date(`${when}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'When?';

  const UserMenu = () => (
    <div className="relative">
      <button type="button" onClick={() => setUserMenu((value) => !value)} className="btn-secondary min-h-0 px-3 py-2">
        <UserCircleIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{user?.first_name || 'Profile'}</span>
      </button>
      {userMenu ? (
        <div className="dropdown-panel right-0 min-w-44 p-2">
          <Link to="/profile" onClick={() => setUserMenu(false)} className="dropdown-item">
            Profile
          </Link>
          <Link to="/appointments" onClick={() => setUserMenu(false)} className="dropdown-item">
            Appointments
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              setUserMenu(false);
            }}
            className="dropdown-item text-danger"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );

  const SearchSuggestions = () => (
    <div className="dropdown-panel left-0 p-3">
      {search.trim() && searchSuggestions.length > 0 ? (
        <div className="space-y-1">
          {searchSuggestions.map((item, index) => (
            <button key={`${item.label}-${index}`} type="button" onClick={() => selectSearch(item.label)} className="dropdown-item">
              <span className="icon-badge h-9 w-9">
                {item.type === 'business' ? <BuildingStorefrontIcon className="h-4 w-4" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-token">{item.label}</span>
                {item.sub ? <span className="block truncate text-xs text-muted">{item.sub}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {search.trim() && searchSuggestions.length === 0 ? <p className="px-3 py-2 text-sm text-muted">No results for "{search}"</p> : null}

      {!search.trim() && recentSearches.length > 0 ? (
        <div>
          <p className="eyebrow px-3 pb-2">Recent searches</p>
          {recentSearches.map((term) => (
            <button key={term} type="button" onClick={() => selectSearch(term)} className="dropdown-item">
              <span className="icon-badge h-9 w-9">
                <MagnifyingGlassIcon className="h-4 w-4" />
              </span>
              <span className="truncate text-sm font-bold text-token">{term}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!search.trim() && recentSearches.length === 0 ? <p className="px-3 py-2 text-sm text-muted">Type to search services or businesses.</p> : null}
    </div>
  );

  const WhereSuggestions = () => (
    <div className="dropdown-panel right-0 w-80 min-w-0 p-3">
      <button type="button" onClick={enableLocation} className="dropdown-item text-brand">
        <MapPinIcon className="h-5 w-5" />
        Enable location access
      </button>

      {where.trim() && citySuggestions.length > 0 ? (
        <div className="mt-2 space-y-1">
          {citySuggestions.map((city) => (
            <button key={city} type="button" onClick={() => selectCity(city)} className="dropdown-item">
              <span className="icon-badge h-9 w-9">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <span className="font-bold text-token">{city}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!where.trim() && recentCities.length > 0 ? (
        <div className="mt-3">
          <p className="eyebrow px-3 pb-2">Recent cities</p>
          {recentCities.map((city) => (
            <button key={city} type="button" onClick={() => selectCity(city)} className="dropdown-item">
              <span className="icon-badge h-9 w-9">
                <MapPinIcon className="h-4 w-4" />
              </span>
              <span className="font-bold text-token">{city}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!where.trim() && recentCities.length === 0 ? <p className="px-3 py-2 text-sm text-muted">Start typing a city name.</p> : null}
    </div>
  );

  const SearchPanel = ({ compact = false, dropdowns = false }) => (
    <form
      onSubmit={doSearch}
      className={compact ? 'flex min-w-0 flex-1 items-center gap-2' : 'search-panel grid w-full max-w-4xl gap-3 p-3 md:grid-cols-[1fr_13rem_9rem_auto] md:items-center'}
    >
      <div ref={dropdowns ? searchRef : null} className={compact ? 'relative min-w-0 flex-1' : 'relative min-w-0'}>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            if (dropdowns) setShowSearchDrop(true);
          }}
          onFocus={() => dropdowns && setShowSearchDrop(true)}
          placeholder="Search services or businesses"
          className="auth-input"
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              if (dropdowns) setShowSearchDrop(true);
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-token"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : null}
        {dropdowns && showSearchDrop ? <SearchSuggestions /> : null}
      </div>

      <div ref={dropdowns ? whereRef : null} className={compact ? 'relative hidden w-44 flex-shrink-0 md:block' : 'relative mt-3 md:mt-0'}>
        <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={where}
          onChange={(event) => {
            setWhere(event.target.value);
            if (dropdowns) setShowWhereDrop(true);
          }}
          onFocus={() => dropdowns && setShowWhereDrop(true)}
          placeholder="City"
          className="auth-input"
        />
        {dropdowns && showWhereDrop ? <WhereSuggestions /> : null}
      </div>

      <button type="button" onClick={() => setShowCal(true)} className={compact ? 'btn-secondary hidden md:inline-flex' : 'btn-secondary mt-3 md:mt-0'}>
        <ClockIcon className="h-4 w-4" />
        {whenLabel}
      </button>
      <button type="submit" className={compact ? 'btn-primary flex-shrink-0' : 'btn-primary mt-3 md:mt-0'}>
        Search
      </button>
    </form>
  );

  return (
    <div className="app-shell">
      {sticky ? (
        <div className={`home-sticky transition-all duration-300 ${stickyIn ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <Link to="/" className="hidden items-center gap-2 font-bold text-token sm:flex">
              <CalendarDaysIcon className="h-5 w-5 text-brand" />
              Reserva
            </Link>
            <SearchPanel compact dropdowns />
            <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">
                    Login
                  </Link>
                  <Link to="/register" className="btn-secondary">
                    List your business
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="home-hero">
        {!videoErr ? (
          <video autoPlay muted loop playsInline onError={() => setVideoErr(true)} className="home-hero-video">
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        ) : null}
        <div className="home-hero-scrim" />

        <div className="home-hero-content mx-auto w-full max-w-7xl">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hero-glass backdrop-blur">
                <CalendarDaysIcon className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold">Reserva</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <>
                  <Link to="/login" className="btn-secondary hidden sm:inline-flex">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    List your business
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
            <div>
              <p className="eyebrow text-white/80">Book local services faster</p>
              <h1 className="mt-4 min-h-[7.5rem] max-w-3xl text-4xl font-black leading-[1.05] tracking-normal text-white md:text-6xl">
                <span>
                  {tw.l1}
                  {tw.phase === 'typing1' || (tw.phase === 'erasing' && tw.l2 === '') ? (
                    <span className="ml-1 font-light" style={{ opacity: cursorOn ? 1 : 0 }}>
                      |
                    </span>
                  ) : null}
                </span>
                <br />
                <span className="text-white/75">
                  {tw.l2}
                  {tw.phase === 'typing2' || (tw.phase === 'erasing' && tw.l2.length > 0) ? (
                    <span className="ml-1 font-light" style={{ opacity: cursorOn ? 1 : 0 }}>
                      |
                    </span>
                  ) : null}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">
                Discover nearby beauty, wellness, and professional services, then book an available time in one clear flow.
              </p>
              <div className="mt-8">
                <SearchPanel />
              </div>
            </div>

            <div className="dark-card hidden p-5 lg:block">
              <p className="eyebrow text-white/70">Live marketplace</p>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Businesses loaded</span>
                  <span className="text-2xl font-bold text-white">{businesses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Categories</span>
                  <span className="text-2xl font-bold text-white">{sortedCategories.length}</span>
                </div>
                <div className="rounded-[var(--radius-md)] hero-glass-soft p-4">
                  <p className="text-sm font-semibold text-white">Booking-ready search</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Filter by service, business, city, and date without leaving the page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div ref={sentinelRef} className="h-px w-full" />
        </div>
      </section>

      <section className="page-shell">
        <div className="app-container">
          <div className="page-header">
            <div>
              <p className="eyebrow">Browse by category</p>
              <h2 className="section-title mt-2">Find the right specialist quickly</h2>
            </div>
            {categoriesError ? <span className="badge badge-warning">{categoriesError}</span> : null}
          </div>

          <div className="app-card-pad">
            {categoriesLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="w-28 flex-shrink-0">
                    <div className="skeleton-block h-20 w-full" />
                    <div className="skeleton-block mx-auto mt-3 h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : sortedCategories.length > 0 ? (
              <div ref={catScrollRef} className="scrollbar-none flex items-stretch overflow-x-auto" style={{ cursor: 'grab' }}>
                {[0, 1, 2].map((copy) => (
                  <div key={copy} data-cat-copy={copy} className="flex flex-shrink-0 items-stretch gap-3 pr-3">
                    {sortedCategories.map((cat) => (
                      <button
                        key={`${copy}-${cat.id}`}
                        type="button"
                        onClick={() => handleCatClick(cat.name)}
                        className="card-hover flex w-32 flex-shrink-0 flex-col items-center justify-center gap-3 p-4 text-center"
                      >
                        <span className="icon-badge h-12 w-12 [&>svg]:h-6 [&>svg]:w-6">{getCatSvg(cat.name)}</span>
                        <span className="text-sm font-bold text-token">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state text-center">No categories are available yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="app-container">
          {businessesLoading ? (
            <div className="space-y-8">
              {[1, 2].map((section) => (
                <div key={section} className="app-card-pad">
                  <div className="skeleton-block h-5 w-48" />
                  <div className="mt-5 flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="skeleton-block h-56 w-56 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : grouped.length > 0 ? (
            <div className="space-y-8">
              {grouped.map(([cat, list]) => (
                <div key={cat} className="app-card-pad">
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">Near you</p>
                      <h2 className="section-title mt-2">{cat}</h2>
                    </div>
                    <button type="button" onClick={() => handleCatClick(cat)} className="text-link flex items-center gap-1 text-sm">
                      See all <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <Carousel>
                    {list.map((business) => (
                      <BizCard key={business.id} biz={business} />
                    ))}
                  </Carousel>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state mx-auto max-w-3xl text-center">
              <BuildingStorefrontIcon className="mx-auto h-10 w-10 text-muted" />
              <h2 className="section-title mt-4">
                {businessesError ? 'Businesses could not be loaded' : 'No businesses listed yet'}
              </h2>
              <p className="body-text mx-auto mt-2 max-w-xl">
                {businessesError
                  ? 'Please try again, or browse services while we reconnect to the business directory.'
                  : 'When businesses are published, they will appear here by category.'}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {businessesError ? (
                  <button type="button" onClick={fetchBusinesses} className="btn-primary">
                    Try again
                  </button>
                ) : null}
                <Link to="/services" className="btn-secondary">
                  Browse services
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isAuthenticated ? (
        <section className="page-shell pt-0">
          <div className="app-container">
            <div className="app-card-pad flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="eyebrow">For businesses</p>
                <h2 className="section-title mt-2">Add online booking to your service workflow</h2>
                <p className="body-text mt-2">Create services, publish availability, and let customers book open times.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
                <Link to="/services" className="btn-secondary">
                  Browse businesses
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Footer />

      {showCal ? (
        <CalendarModal
          selectedDate={when}
          onSelect={(iso) => {
            setWhen(iso);
          }}
          onClose={() => setShowCal(false)}
        />
      ) : null}

      {cityModal ? <CityPickerModal knownCities={allCities} onSelect={handleCitySelect} onClose={() => setCityModal(null)} /> : null}
    </div>
  );
};

export default Home;
