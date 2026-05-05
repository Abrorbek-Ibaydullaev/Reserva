# 5 Frontend Implementation

The frontend of the Reserva booking platform is a single-page application (SPA) built
with React 18 and bundled with Vite. The choice of a dedicated SPA rather than
server-rendered pages was deliberate: the application has three fundamentally different
user experiences — a public discovery interface for customers, an operational dashboard
for business owners, and a schedule-management portal for employees — that each require
a substantial amount of interactive, stateful UI that would be cumbersome to rebuild on
every server round-trip. An SPA architecture renders the initial HTML shell once and then
updates only the portions of the page that change, giving the application a native-app
feel that reduces perceived latency for users navigating between views.

The core technology choices are summarised below. React 18 provides the component model
and the rendering engine. Vite replaces the older Create React App toolchain; its
native ES-module dev server starts in under a second on modern hardware and its
Rollup-based production bundler produces significantly smaller output than webpack.
Tailwind CSS handles all styling through utility classes applied directly in JSX.
React Router v6 manages client-side navigation. Axios handles all HTTP communication
with the Django REST backend. `date-fns` provides lightweight date manipulation for
the booking calendar. Recharts renders the analytics charts on the business dashboard.
React Hook Form handles form state and validation. React Toastify delivers transient
notifications. HeadlessUI provides accessible, unstyled interactive primitives.

---

## 5.1 Application Architecture

### 5.1.1 Component and Folder Structure

The source tree under `frontend/src/` is organised into four top-level directories:

```
src/
├── context/          # AuthContext.jsx, ThemeContext.jsx
├── components/
│   ├── Layout/       # Navbar, Footer, BusinessLayout, EmployeeLayout, NotificationBell
│   ├── Business/     # BusinessCard, BusinessList
│   ├── Services/     # ServiceCard, ServiceList
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx  /  Register.jsx
│   ├── Services.jsx  /  BusinessDetail.jsx  /  BookAppointment.jsx
│   ├── BusinessDashboard.jsx  /  EmployeeDashboard.jsx
│   ├── MyAppointments.jsx  /  CustomerProfile.jsx
│   └── business/   (Services, Appointments, Employees, Schedule)
└── services/
    └── api.js        # Axios instance + all service modules
```

### 5.1.2 Provider Tree

```jsx
<ThemeProvider>       {/* dark/light, persisted in localStorage */}
  <Router>
    <ScrollToTop />
    <AuthProvider>    {/* JWT state, login, register, logout */}
      <Routes>…</Routes>
      <ToastContainer />
    </AuthProvider>
  </Router>
</ThemeProvider>
```

`ThemeProvider` sits outside `Router` because the dark-mode class must be applied to
`<html>` before any rendering occurs. `AuthProvider` sits inside `Router` because its
`login()` and `logout()` handlers call `useNavigate()`.

---

## 5.2 Authentication Pages

### 5.2.1 Login Page

![Fig. 5.1 — Login page](./screenshots/login.png)

**Fig. 5.1:** *Login page — two-column desktop layout*

The login page uses a two-column layout. The left panel (42 % of the viewport) is a
blue gradient card with the Reserva brand name and three feature bullet points. The
right panel is centred and capped at `max-w-md`. The password field has a show/hide
toggle. Form state and client-side validation are managed by React Hook Form:

```jsx
const { register, handleSubmit, formState: { errors } } = useForm();

<div className="relative">
  <EnvelopeIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  <input
    type="email"
    placeholder="you@example.com"
    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3
               focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    {...register('email', {
      required: 'Email is required',
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
    })}
  />
</div>

<div className="relative">
  <LockClosedIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  <input
    type={showPassword ? 'text' : 'password'}
    {...register('password', { required: 'Password is required', minLength: { value: 6 } })}
  />
  <button type="button" onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
  </button>
</div>
```

On success the user is redirected to their role-appropriate home page:

```jsx
const onSubmit = async (data) => {
  const result = await login(data.email, data.password);
  if (result.success) {
    const fallback =
      result.user?.user_type === 'business_owner' ? '/dashboard'
      : result.user?.user_type === 'employee'     ? '/employee/dashboard'
      : '/';
    navigate(from === '/' ? fallback : from, { replace: true });
  } else {
    setError('Invalid email or password. Please try again.');
  }
};
```

### 5.2.2 Registration Page

> **[INSERT SCREENSHOT — save as** `screenshots/register.png` **]**
> Registration page: "I'm a Customer" / "I'm a Business Owner" toggle cards and the
> form fields below. Capture with the "Business Owner" card selected.

**Fig. 5.2:** *Registration page — account-type selector*

The registration page adds a user-type selector rendered as two large toggle cards.
Selecting "Business Owner" sets `user_type` in the submitted payload. After a
successful registration `AuthContext` auto-logs the user in:

```jsx
const [userType, setUserType] = useState('customer');

{/* Account type cards */}
{['customer', 'business_owner'].map((type) => (
  <button
    key={type}
    type="button"
    onClick={() => setUserType(type)}
    className={`flex-1 rounded-2xl border-2 p-4 text-left transition
      ${userType === type
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300'}`}
  >
    <span className="text-sm font-bold text-slate-900">
      {type === 'customer' ? "I'm a Customer" : "I'm a Business Owner"}
    </span>
  </button>
))}

const onSubmit = async (data) => {
  const result = await authRegister({ ...data, user_type: userType });
  if (result.success) {
    navigate(userType === 'business_owner' ? '/dashboard' : '/services',
             { replace: true });
  }
};
```

---

## 5.3 Routing and Access Control

All routes are declared in `App.jsx`. Login and Register are rendered outside any
layout wrapper so no navbar appears on those pages. All other public routes use
`<Layout>` (top navbar + footer). Dashboards use their own sidebar layouts.

```jsx
{/* No navbar — bare routes */}
<Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
<Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

{/* Sidebar layouts for staff */}
<Route path="/dashboard/*"
  element={<ProtectedRoute allowedUserTypes={['business_owner']}>
    <BusinessLayout>…</BusinessLayout>
  </ProtectedRoute>} />

<Route path="/employee/*"
  element={<ProtectedRoute allowedUserTypes={['employee']}>
    <EmployeeLayout>…</EmployeeLayout>
  </ProtectedRoute>} />
```

`ProtectedRoute` checks authentication and `user_type` before mounting a page:

```jsx
const ProtectedRoute = ({ children, allowedUserTypes, redirectTo = '/login' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedUserTypes && !allowedUserTypes.includes(user?.user_type))
    return <Navigate to={redirectTo} replace />;
  return children;
};
```

---

## 5.4 API Service Layer

All HTTP calls go through a single Axios instance in `src/services/api.js`. A request
interceptor attaches the JWT access token; a response interceptor silently refreshes
it on a 401 and replays the original request:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const req = error.config;
    if (error.response?.status === 401 && !req._retry) {
      req._retry = true;
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`,
        { refresh: localStorage.getItem('refresh_token') });
      localStorage.setItem('access_token', data.access);
      req.headers.Authorization = `Bearer ${data.access}`;
      return api(req);           // replay original request
    }
    return Promise.reject(error);
  }
);
```

Page components never construct URL strings — they call named service functions:

```javascript
const stats  = await appointmentService.getBusinessDashboardStats();
const slots  = await appointmentService.getAvailableSlots({ service_id, date });
const result = await appointmentService.createAppointment(payload);
```

---

## 5.5 User Interface Pages

### 5.5.1 Home Page

> **[INSERT SCREENSHOT — save as** `screenshots/home-hero.png` **]**
> Full home page hero at desktop width (1280 px+): video/gradient background,
> rotating Uzbek headline, search bar with city dropdown, and Search button.

**Fig. 5.3:** *Home page — hero section*

The hero section occupies 75 % of the viewport height. A looping `<video>` plays in
the background; a CSS gradient takes its place if the video fails to load. A rotating
headline array cycles every four seconds with a fade transition:

```jsx
<section className="relative h-[75vh] min-h-[500px] max-h-[860px] flex flex-col overflow-hidden">
  {!videoErr && (
    <video autoPlay muted loop playsInline
           onError={() => setVideoErr(true)}
           className="absolute inset-0 h-full w-full object-cover">
      <source src="/hero.mp4" type="video/mp4" />
    </video>
  )}

  {/* Rotating headline */}
  {HEADLINES.map(([line1, line2], i) => (
    <h1 key={i} className={`transition-opacity duration-700
        ${i === headlineIdx ? 'opacity-100' : 'opacity-0 absolute'}`}>
      {line1}<br />{line2}
    </h1>
  ))}
</section>
```

> **[INSERT SCREENSHOT — save as** `screenshots/home-categories.png` **]**
> Category icon strip on the dark teal background showing 8+ circular tiles.

**Fig. 5.4:** *Home page — category strip*

Categories are fetched from `GET /api/services/categories/` and rendered as circular
icon tiles. Each icon is matched by keyword from a map of Heroicons and custom SVGs:

```jsx
{sortedCategories.slice(0, 8).map((cat) => (
  <button key={cat.id} onClick={() => handleCatClick(cat.name)}
    className="group flex flex-shrink-0 flex-col items-center gap-3">
    <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full
                    bg-[#1a2e2b] text-white transition-all
                    group-hover:bg-[#243d3a] group-hover:scale-105">
      <span className="h-11 w-11 [&>svg]:h-full [&>svg]:w-full">
        {getCatSvg(cat.name)}
      </span>
    </div>
    <span className="text-xs font-bold text-white">{cat.name}</span>
  </button>
))}
```

> **[INSERT SCREENSHOT — save as** `screenshots/home-businesses.png` **]**
> Featured Businesses carousel showing 3–4 cards with cover images and "View" buttons.

**Fig. 5.5:** *Home page — Featured Businesses carousel*

Businesses are fetched from `GET /api/users/businesses/` and rendered in a
horizontally-scrollable carousel. Chevron buttons scroll it programmatically:

```jsx
const scrollCarousel = (ref, dir) => {
  ref.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
};

<div ref={carouselRef} className="flex gap-4 overflow-x-auto
     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {businesses.map((biz) => (
    <Link key={biz.id} to={`/business/${biz.id}`}
      className="flex-shrink-0 w-64 rounded-2xl overflow-hidden shadow-sm
                 hover:shadow-md transition-shadow">
      <img src={biz.cover_image || FALLBACK} className="h-40 w-full object-cover" />
      <div className="p-3">
        <p className="font-bold text-slate-900">{biz.business_name}</p>
        <p className="text-xs text-slate-500">{biz.city}</p>
      </div>
    </Link>
  ))}
</div>
```

### 5.5.2 Services Discovery Page

> **[INSERT SCREENSHOT — save as** `screenshots/services.png` **]**
> Services page at desktop width: filter sidebar on the left, service card grid
> on the right showing image, name, price, and star rating.

**Fig. 5.6:** *Services discovery page*

The filter state is synchronised with the URL query string using `useSearchParams`,
making filtered views bookmarkable. Each `ServiceCard` shows thumbnail, name,
business, duration, price, and average rating:

```jsx
const [searchParams, setSearchParams] = useSearchParams();

const applyFilter = (key, value) => {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    value ? next.set(key, value) : next.delete(key);
    return next;
  });
};

// ServiceCard
<div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm
                hover:shadow-md transition-shadow">
  <img src={fixMediaUrl(service.image)} className="h-44 w-full object-cover" />
  <div className="p-4">
    <p className="font-bold text-slate-900">{service.name}</p>
    <p className="text-xs text-slate-500">{service.business_name}</p>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-blue-600">${service.price}</span>
      <span className="flex items-center gap-1 text-xs text-amber-500">
        ★ {service.average_rating?.toFixed(1) ?? '—'}
      </span>
    </div>
  </div>
</div>
```

### 5.5.3 Business Detail Page

> **[INSERT SCREENSHOT — save as** `screenshots/business-detail.png` **]**
> Business detail page: cover photo banner with name/rating overlay, tab bar
> beneath it, Services tab active with 2–3 services and "Book" buttons.

**Fig. 5.7:** *Business detail page*

The page aggregates all publicly-visible information about a business into one
scrollable view. A tabbed navigation switches between Services, Gallery, Reviews,
and About panels:

```jsx
const TABS = ['Services', 'Gallery', 'Reviews', 'About'];
const [activeTab, setActiveTab] = useState('Services');

<div className="flex border-b border-slate-200">
  {TABS.map((tab) => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-sm font-semibold transition-colors
        ${activeTab === tab
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-slate-500 hover:text-slate-900'}`}>
      {tab}
    </button>
  ))}
</div>

{activeTab === 'Services' && services.map((svc) => (
  <div key={svc.id} className="flex items-center justify-between py-4
                                border-b border-slate-100">
    <div>
      <p className="font-semibold text-slate-900">{svc.name}</p>
      <p className="text-xs text-slate-500">{svc.duration} min · ${svc.price}</p>
    </div>
    <Link to={`/book/${svc.id}`}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
      Book
    </Link>
  </div>
))}
```

### 5.5.4 Appointment Booking Flow

The booking flow is a four-step wizard. A `sessionStorage` draft key (`booking_draft`)
preserves progress across page refreshes.

**Step 1 — Service & Employee**

> **[INSERT SCREENSHOT — save as** `screenshots/booking-step1.png` **]**
> Step 1: service details card, employee selection cards, 4-step progress bar.

**Fig. 5.8:** *Booking wizard — Step 1: employee selection*

```jsx
{employees.map((emp) => (
  <button key={emp.id}
    onClick={() => setSelectedEmployee(emp.id)}
    className={`rounded-2xl border-2 p-4 text-left transition
      ${selectedEmployee === emp.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300'}`}>
    <p className="font-semibold text-slate-900">{emp.full_name}</p>
    <p className="text-xs text-slate-500">{emp.title}</p>
  </button>
))}
```

**Step 2 — Date**

> **[INSERT SCREENSHOT — save as** `screenshots/booking-step2.png` **]**
> Monthly calendar grid: past dates greyed, selected date in blue, prev/next arrows.

**Fig. 5.9:** *Booking wizard — Step 2: date picker*

The calendar is built with `date-fns` helpers. Past dates and dates outside business
hours are disabled:

```jsx
const cells = eachDayOfInterval({
  start: startOfWeek(startOfMonth(calendarMonth)),
  end:   endOfWeek(endOfMonth(calendarMonth)),
});

{cells.map((day) => {
  const isPast     = day < startOfToday();
  const isSelected = isSameDay(day, parseISO(selectedDate));
  return (
    <button key={day} disabled={isPast || !isSameMonth(day, calendarMonth)}
      onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
      className={`h-10 w-10 rounded-full text-sm font-medium transition
        ${isSelected  ? 'bg-blue-600 text-white'  : ''}
        ${isPast      ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
      {format(day, 'd')}
    </button>
  );
})}
```

**Step 3 — Time Slot**

> **[INSERT SCREENSHOT — save as** `screenshots/booking-step3.png` **]**
> Morning / Afternoon / Evening headers with a grid of time-pill buttons;
> one pill selected in blue.

**Fig. 5.10:** *Booking wizard — Step 3: time slot selection*

Slots are fetched from `GET /api/schedules/available-slots/` and grouped into time
buckets. Past slots for today are filtered out client-side:

```jsx
const groupedSlots = useMemo(() => {
  const buckets = { Morning: [], Afternoon: [], Evening: [] };
  filteredAvailableSlots.forEach((slot) => {
    buckets[getDayBucket(slot.start_time)].push(slot);
  });
  return buckets;
}, [filteredAvailableSlots]);

{Object.entries(groupedSlots).map(([bucket, slots]) =>
  slots.length > 0 && (
    <div key={bucket}>
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">{bucket}</p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button key={slot.start_time}
            onClick={() => setSelectedTime(slot.start_time)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition
              ${selectedTime === slot.start_time
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {formatSlotTime(slot.start_time)}
          </button>
        ))}
      </div>
    </div>
  )
)}
```

**Step 4 — Confirmation**

> **[INSERT SCREENSHOT — save as** `screenshots/booking-step4.png` **]**
> Confirmation summary card: service name, employee, date/time, price,
> and the "Confirm Booking" button.

**Fig. 5.11:** *Booking wizard — Step 4: confirmation*

```jsx
const handleConfirm = async () => {
  setSubmitting(true);
  const payload = {
    service:   service.id,
    employee:  selectedEmployee !== 'none' ? selectedEmployee : null,
    date:      selectedDate,
    start_time: selectedTime,
  };
  const result = await appointmentService.createAppointment(payload);
  if (result.data) {
    toast.success('Appointment booked!');
    clearDraft();
    navigate('/appointments');
  }
};
```

---

## 5.6 Business Owner Dashboard

### 5.6.1 Dashboard Overview

> **[INSERT SCREENSHOT — save as** `screenshots/dashboard-overview.png` **]**
> Dashboard overview: four KPI stat cards + at least one Recharts chart.
> Sidebar visible on the left.

**Fig. 5.12:** *Business dashboard — overview*

Four `StatCard` components display total appointments, revenue, active employees,
and today's bookings. Each shows a trend arrow comparing the current period against
the previous one:

```jsx
const StatCard = ({ title, value, sub, icon: Icon, color, trend }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="flex-1">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-semibold
          ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowTrendingUpIcon className="h-4 w-4" />
                    : <ArrowTrendingDownIcon className="h-4 w-4" />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);
```

Below the cards three Recharts charts visualise the data: an `AreaChart` for
appointment volume over 30 days, a `BarChart` for revenue by category, and a
`PieChart` for appointment status distribution.

> **[INSERT SCREENSHOT — save as** `screenshots/dashboard-table.png` **]**
> "Recent Appointments" table: 4–6 rows with customer names, service names, dates,
> and coloured status badges.

**Fig. 5.13:** *Business dashboard — recent appointments table*

```jsx
const Badge = ({ status }) => {
  const styles = {
    pending:   'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show:   'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold
                      ${styles[status] ?? styles.no_show}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
```

### 5.6.2 Service Management

> **[INSERT SCREENSHOT — save as** `screenshots/dashboard-services.png` **]**
> Service management page: table of services + open create/edit form panel.

**Fig. 5.14:** *Business dashboard — service management*

```jsx
const handleSave = async (formData) => {
  const payload = new FormData();
  Object.entries(formData).forEach(([k, v]) => { if (v != null) payload.append(k, v); });
  if (editingId) {
    await serviceService.updateService(editingId, payload);
    toast.success('Service updated.');
  } else {
    await serviceService.createService(payload);
    toast.success('Service created.');
  }
  reload();
};
```

### 5.6.3 Employee Management

> **[INSERT SCREENSHOT — save as** `screenshots/dashboard-employees.png` **]**
> Employees page: 2–3 employee cards with names, emails, and service tag badges.

**Fig. 5.15:** *Business dashboard — employee management*

```jsx
const handleAddEmployee = async () => {
  await scheduleService.createEmployee({
    email:    newEmployeeEmail,
    services: selectedServiceIds,
  });
  toast.success('Employee added.');
  setNewEmployeeEmail('');
  reload();
};
```

### 5.6.4 Schedule Management

> **[INSERT SCREENSHOT — save as** `screenshots/dashboard-schedule.png` **]**
> Schedule page: 7-day weekly hours grid (toggles + time pickers) on the left,
> exceptions/time-off list on the right.

**Fig. 5.16:** *Business dashboard — schedule management*

Business hours are saved immediately on blur — no separate "Save" button needed:

```jsx
const handleHoursBlur = async (id, field, value) => {
  await scheduleService.updateBusinessHours(id, { [field]: value });
};

{weeklyHours.map((row) => (
  <div key={row.id} className="grid grid-cols-4 items-center gap-4 py-3
                                border-b border-slate-100">
    <span className="text-sm font-medium text-slate-700">{DAYS[row.day_of_week]}</span>
    <Toggle checked={row.is_open}
            onChange={(v) => handleHoursBlur(row.id, 'is_open', v)} />
    <TimeInput value={row.opening_time}
               onBlur={(v) => handleHoursBlur(row.id, 'opening_time', v)} />
    <TimeInput value={row.closing_time}
               onBlur={(v) => handleHoursBlur(row.id, 'closing_time', v)} />
  </div>
))}
```

---

## 5.7 Employee Portal

> **[INSERT SCREENSHOT — save as** `screenshots/employee-dashboard.png` **]**
> Employee dashboard: sidebar on the left, today's appointment list on the right
> with 2–3 cards showing customer name, service, and time.

**Fig. 5.17:** *Employee dashboard*

The employee dashboard shows only that day's upcoming appointments filtered by the
logged-in employee:

```jsx
useEffect(() => {
  appointmentService.getTodayAppointments().then(({ data }) => {
    setAppointments(
      (data.results ?? data)
        .filter((a) => a.status !== 'cancelled')
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    );
  });
}, []);
```

> **[INSERT SCREENSHOT — save as** `screenshots/employee-schedule.png` **]**
> Employee weekly calendar grid with coloured appointment blocks in the correct cells.

**Fig. 5.18:** *Employee schedule*

```jsx
const getSlotStyle = (status) => ({
  pending:   'bg-amber-100 border-amber-300 text-amber-800',
  confirmed: 'bg-blue-100  border-blue-300  text-blue-800',
  completed: 'bg-emerald-100 border-emerald-300 text-emerald-800',
}[status] ?? 'bg-slate-100 border-slate-300 text-slate-700');
```

---

## 5.8 Customer Flows

### 5.8.1 My Appointments

> **[INSERT SCREENSHOT — save as** `screenshots/appointments.png` **]**
> "My Appointments" page (customer view): Upcoming tab with 2–3 cards,
> each showing service name, date, time, blue "Confirmed" badge, and Cancel button.

**Fig. 5.19:** *My Appointments page*

The page is shared by all three user types but adapts its data query and available
actions by role. Status badges use a consistent colour map:

```jsx
const STATUS_STYLE = {
  pending:     'bg-amber-100 text-amber-800',
  confirmed:   'bg-blue-100 text-blue-800',
  completed:   'bg-emerald-100 text-emerald-800',
  cancelled:   'bg-red-100 text-red-800',
  rescheduled: 'bg-violet-100 text-violet-800',
};

const TABS = ['Upcoming', 'Past', 'Cancelled'];

const filtered = useMemo(() => {
  if (tab === 'Upcoming')  return appointments.filter((a) => apptStart(a) >= new Date() && a.status !== 'cancelled');
  if (tab === 'Past')      return appointments.filter((a) => apptStart(a) <  new Date() && a.status !== 'cancelled');
  return appointments.filter((a) => a.status === 'cancelled');
}, [appointments, tab]);
```

Cancellation opens a confirmation dialog before calling the API:

```jsx
const handleCancel = async (id) => {
  await appointmentService.cancelAppointment(id, 'Client requested cancellation');
  setAppointments((prev) => prev.map((a) =>
    a.id === id ? { ...a, status: 'cancelled' } : a
  ));
  toast.success('Appointment cancelled.');
};
```

### 5.8.2 Customer Profile

> **[INSERT SCREENSHOT — save as** `screenshots/customer-profile.png` **]**
> Customer profile page: personal details form at the top, Telegram connection
> card below (show connected or un-connected state).

**Fig. 5.20:** *Customer profile*

The profile page submits only the fields that have a value — empty phone numbers
are excluded to avoid triggering the regex validator on the backend:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const mePayload = new FormData();
  mePayload.append('first_name', formData.first_name);
  mePayload.append('last_name',  formData.last_name);
  mePayload.append('email',      formData.email);
  if (formData.phone_number) mePayload.append('phone_number', formData.phone_number);
  if (avatarFile)            mePayload.append('profile_picture', avatarFile);
  await userService.updateMe(mePayload);
  toast.success('Profile updated.');
};
```

---

## 5.9 In-App Notifications

### 5.9.1 Notification Bell

> **[INSERT SCREENSHOT — save as** `screenshots/notification-bell.png` **]**
> Navbar notification bell with the red unread badge open, showing the dropdown
> panel with 2–3 notification entries and a "Mark all read" link.

**Fig. 5.21:** *In-app notification bell dropdown*

The `NotificationBell` component polls `GET /api/users/notifications/` on mount.
Each notification type maps to a descriptive emoji prefix:

```javascript
const typeIcon = (type) => ({
  appointment_confirmation: '✅',
  appointment_reminder:     '🔔',
  appointment_cancellation: '❌',
  new_message:              '💬',
  review_request:           '⭐',
  promotion:                '🎁',
  system:                   'ℹ️',
}[type] ?? '🔔');

const markAll = async () => {
  await userService.markAllNotificationsAsRead();
  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
};
```

---

## 5.10 Telegram Bot Integration

### 5.10.1 Connection Card UI

> **[INSERT SCREENSHOT — save as** `screenshots/telegram-disconnected.png` **]**
> Telegram card — un-connected state: blue logo, "Get booking alerts" subtitle,
> blue "Connect Telegram" button.

**Fig. 5.22:** *Telegram connection card — un-connected*

> **[INSERT SCREENSHOT — save as** `screenshots/telegram-connected.png` **]**
> Telegram card — connected state: green border, green checkmark, grey "Disconnect".

**Fig. 5.23:** *Telegram connection card — connected*

The card colour switches based on the `connected` flag:

```jsx
<div className={`rounded-2xl border px-5 py-4 shadow-sm
  ${telegram.connected
      ? 'border-emerald-200 bg-emerald-50'
      : 'border-slate-200 bg-white'}`}>

  <svg fill={telegram.connected ? '#10b981' : '#229ed9'}>
    {/* Telegram paper-plane path */}
  </svg>

  <p>{telegram.connected
      ? "Connected — you'll receive booking alerts"
      : 'Get booking alerts on Telegram'}</p>

  {telegram.connected
    ? <button onClick={handleDisconnectTelegram}>Disconnect</button>
    : <a href={telegram.link} target="_blank">Connect Telegram</a>}
</div>
```

### 5.10.2 Connection Flow

When the profile page mounts it calls `GET /api/users/telegram/` which returns a
deep-link and a `connected` boolean. The deep-link carries an HMAC token tied to
the user's ID:

```python
# backend: service.py
def make_link_token(user_id):
    sig = hmac.new(settings.SECRET_KEY.encode(),
                   str(user_id).encode(), hashlib.sha256).hexdigest()
    return f"{user_id}-{sig[:16]}"

# → https://t.me/<BOT>?start=42-a3f9b1c2d4e5f6a7
```

```javascript
// frontend: on mount
const tg = await userService.getTelegramLink();
if (tg?.data) setTelegram({ link: tg.data.link, connected: tg.data.connected });
```

Clicking the link opens Telegram with the token pre-filled. The bot receives
`/start <token>`, verifies the HMAC, and writes the `chat_id` to the database.

> **[INSERT SCREENSHOT — save as** `screenshots/telegram-bot-connected.png` **]**
> Telegram chat showing the ✅ Connected! confirmation message from the Reserva bot.

**Fig. 5.24:** *Telegram bot — account linked confirmation message*

### 5.10.3 Automated Notifications

Django `post_save` signals on the `Appointment` model fire notifications
automatically — no polling or background task needed:

| Trigger | Customer | Business owner |
|---|---|---|
| New booking | 📅 Booking received + date/time | 🔔 New booking + customer name |
| → confirmed | ✅ Confirmed | — |
| → cancelled | ❌ Cancelled | ❌ Cancelled + customer name |
| → completed | ⭐ Review request + inline buttons | — |

> **[INSERT SCREENSHOT — save as** `screenshots/telegram-completed.png` **]**
> Telegram chat showing the ⭐ "How was your visit?" message with "Leave a Review"
> and "Rebook" inline buttons at the bottom of the bubble.

**Fig. 5.25:** *Telegram bot — completed appointment with action buttons*

```python
send_message(
    customer_chat,
    f"⭐ <b>How was your visit?</b>\n\n"
    f"You just completed <b>{service_name}</b> at {business_name}.",
    buttons=[
        ('✍️ Leave a Review', review_url),
        ('📅 Rebook',         rebook_url),
    ],
)
```

---

## 5.11 Responsive Design

All pages use Tailwind's mobile-first breakpoint prefixes. Key adaptations:

- Sidebars collapse to a bottom tab bar / hamburger drawer below `lg:`
- The two-column login/register layout collapses to a single column on mobile
- The services grid switches from 3 → 2 → 1 column
- The booking calendar occupies full width on phones

> **[INSERT SCREENSHOT — save as** `screenshots/mobile.png` **]**
> Home page (or services page) at 375 px width: single-column stacked layout,
> hamburger icon in the navbar, full-width search bar.

**Fig. 5.26:** *Mobile responsive layout*

---

## 5.12 Build and Deployment

```bash
npm run build   # produces dist/ with index.html + hashed bundles

# .env.production
VITE_API_BASE_URL=https://api.reserva.uz/api
```

The same build artefact targets any API server by changing only the environment
variable. During development the Vite dev server proxies API requests to avoid CORS
issues between `localhost:5173` and `localhost:8000`.

















### 5.10.1 Connection Flow

  The connection process is a three-step deep-link flow that requires no password or
  manual token entry from the user.

  **Step 1 — Request a deep-link.** When a profile page mounts, it calls
  `GET /api/users/telegram/`. The backend generates a short-lived HMAC token tied to the
  user's database ID using Django's `SECRET_KEY` as the signing secret:

  ```python
  def make_link_token(user_id):
      secret = settings.SECRET_KEY.encode()
      sig = hmac.new(secret, str(user_id).encode(), hashlib.sha256).hexdigest()
      return f"{user_id}-{sig[:16]}"
  ```

  The endpoint returns two fields: `link` (the Telegram deep-link URL) and `connected`
  (a boolean indicating whether `telegram_chat_id` is already set on the profile). The
  frontend stores both in a local state object:

  ```javascript
  const [telegram, setTelegram] = useState({ link: null, connected: false });

  // on mount
  const tg = await userService.getTelegramLink();
  if (tg?.data) setTelegram({ link: tg.data.link, connected: tg.data.connected });
  ```

  **Step 2 — Open Telegram.** The deep-link has the form
  `https://t.me/<BOT_USERNAME>?start=<userId>-<hmacSig>`. When the user clicks
  "Connect Telegram" in the profile card, their phone or desktop Telegram app opens
  directly in a chat with the Reserva bot, with the token pre-filled as the `/start`
  payload.

  **Step 3 — Bot verifies and stores the chat ID.** The bot's long-polling loop receives
  the `/start <token>` message, calls `verify_link_token()` to decode the HMAC, looks up
  the matching `UserProfile`, and writes the Telegram `chat_id` to the database:

  ```python
  def handle_update(update):
      text = message.get('text', '').strip()
      if text.startswith('/start'):
          token = text.split(' ', 1)[1]
          user_id = verify_link_token(token)
          if user_id:
              profile = UserProfile.objects.get(user_id=user_id)
              profile.telegram_chat_id = chat_id
              profile.save(update_fields=['telegram_chat_id'])
              send_message(chat_id,
                  f"✅ <b>Connected!</b>\n\n"
                  f"Hey {first_name}, your Telegram is now linked to Reserva. "
                  f"You'll get instant notifications for bookings, confirmations, and reminders here."
              )
  ```

  The bot then replies to the user with a confirmation message inside Telegram. No
  browser redirect or polling is required — the next time the user opens their profile
  page and the component mounts, `GET /api/users/telegram/` will return
  `connected: true` because the `telegram_chat_id` is now stored.

  > **[INSERT SCREENSHOT: The Telegram connection card on the profile page showing the
  > blue Telegram logo icon, the "Get booking alerts on Telegram" subtitle, and the
  > blue "Connect Telegram" button. This is the un-connected state.]**

  > **[INSERT SCREENSHOT: The same card after the user has connected, showing the
  > green checkmark icon, "Connected — you'll receive booking alerts" subtitle, and
  > the grey "Disconnect" button. The card border should be green (emerald).]**

  > **[INSERT SCREENSHOT: The Telegram bot chat showing the ✅ Connected! confirmation
  > message sent by the Reserva bot immediately after the user taps /start.]**

  ### 5.10.2 Notification Card UI

  The connection card is implemented identically across all three profile pages. Its
  visual state switches between two modes based on the `telegram.connected` flag:

  ```jsx
  <div className={`rounded-2xl border px-5 py-4 shadow-sm
    ${telegram.connected
        ? 'border-emerald-200 bg-emerald-50'   // connected — green tint
        : 'border-slate-200 bg-white'           // not connected — neutral
    }`}>

    {/* Telegram logo + status text */}
    <svg viewBox="0 0 24 24" fill={telegram.connected ? '#10b981' : '#229ed9'}>
      {/* Telegram paper-plane path */}
    </svg>
    <p>{telegram.connected
        ? 'Connected — you\'ll receive booking alerts'
        : 'Get booking alerts on Telegram'}
    </p>

    {/* Action button */}
    {telegram.connected ? (
      <button onClick={handleDisconnectTelegram}>Disconnect</button>
    ) : telegram.link ? (
      <a href={telegram.link} target="_blank">Connect Telegram</a>
    ) : (
      <p>Bot not configured yet</p>   {/* TELEGRAM_BOT_USERNAME not set */}
    )}
  </div>
  ```

  The Telegram logo colour switches from the brand blue (`#229ed9`) to emerald green
  (`#10b981`) when connected, providing immediate visual confirmation of the connection
  status without relying solely on the text label.

  Disconnection is handled by `DELETE /api/users/telegram/`, which clears the
  `telegram_chat_id` on the server. The frontend then sets `connected: false` locally
  and shows a toast notification.

  ### 5.10.3 Automated Notifications

  Once a user's `telegram_chat_id` is stored, notifications are sent automatically
  by Django signals in the appointments app — no periodic task or manual trigger is
  needed. The `post_save` signal on the `Appointment` model fires on every save and
  checks which status transition just occurred:

  | Event | Customer receives | Business owner receives |
  |---|---|---|
  | New booking created | "📅 Booking received!" with date/time | "🔔 New booking!" with customer name |
  | Status → confirmed | "✅ Appointment confirmed!" | — |
  | Status → cancelled | "❌ Appointment cancelled" | "❌ Appointment cancelled" with customer name |
  | Status → completed | "⭐ How was your visit?" with Review and Rebook buttons | — |

  The completed-appointment message is the most interactive: it includes two inline
  Telegram buttons — "✍️ Leave a Review" and "📅 Rebook" — that deep-link directly
  back to the business's review page and the service's booking page on the Reserva
  website:

  ```python
  send_message(
      customer_chat,
      f"⭐ <b>How was your visit?</b>\n\n"
      f"You just completed <b>{service_name}</b> at {business_name}.\n\n"
      f"💬 Leave a review — it only takes a second...",
      buttons=[
          ('✍️ Leave a Review', review_url),
          ('📅 Rebook',         rebook_url),
      ],
  )
  ```

  > **[INSERT SCREENSHOT: The Telegram chat showing a completed-appointment message
  > from the Reserva bot with the "⭐ How was your visit?" text and the two inline
  > buttons ("✍️ Leave a Review" and "📅 Rebook") visible at the bottom of the
  > message bubble.]**

  ### 5.10.4 Bot Process

  The bot itself runs as a separate Django management command (`python manage.py
  run_telegram_bot`) that uses Telegram's long-polling API — it keeps an open HTTP
  connection to `api.telegram.org/getUpdates` with a 30-second timeout, processing
  each incoming message as it arrives. This approach requires no webhook infrastructure
  or public-facing URL, making it straightforward to run alongside the Django
  development server. The same process also doubles as a weekly report scheduler:
  every Sunday at 23:59 it triggers the `send_weekly_reports` command, which
  sends a summary of the week's appointments and revenue to each business owner's
  Telegram.

  ---

  

