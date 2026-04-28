import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  Bars3Icon,
  XMarkIcon,
  QrCodeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, exact: true },
  { name: 'Services', href: '/dashboard/services', icon: BriefcaseIcon },
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Employees', href: '/dashboard/employees', icon: UserGroupIcon },
  { name: 'Schedule', href: '/dashboard/schedule', icon: ClockIcon },
  { name: 'Settings', href: '/dashboard/profile', icon: Cog6ToothIcon },
];

// ── QR Code Modal ─────────────────────────────────────────────────────────────
const QRModal = ({ user, onClose }) => {
  const bookingUrl = `${window.location.origin}/business/${user?.id}`;
  const businessName =
    user?.profile?.business_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    'Reserva Business';

  const handleDownload = () => {
    const canvas = document.getElementById('business-qr-canvas');
    if (!canvas) return;

    // Create a larger branded canvas for download
    const size = 600;
    const padding = 40;
    const labelHeight = 90;
    const out = document.createElement('canvas');
    out.width = size + padding * 2;
    out.height = size + padding * 2 + labelHeight;
    const ctx = out.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // QR code
    ctx.drawImage(canvas, padding, padding, size, size);

    // Business name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(businessName, out.width / 2, size + padding + 44);

    // Tagline
    ctx.fillStyle = '#64748b';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Scan to book an appointment', out.width / 2, size + padding + 76);

    const link = document.createElement('a');
    link.download = `${businessName.replace(/\s+/g, '-')}-QR.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const canvas = document.getElementById('business-qr-canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR Code – ${businessName}</title>
      <style>
        body { margin: 0; display: flex; flex-direction: column; align-items: center;
               justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
        img { width: 320px; height: 320px; }
        h2 { margin: 16px 0 4px; font-size: 22px; color: #0f172a; }
        p  { margin: 0; color: #64748b; font-size: 15px; }
        @media print { button { display: none; } }
      </style></head>
      <body>
        <img src="${dataUrl}" />
        <h2>${businessName}</h2>
        <p>Scan to book an appointment</p>
        <br/>
        <button onclick="window.print()" style="margin-top:16px;padding:10px 24px;background:#2563eb;
          color:white;border:none;border-radius:8px;font-size:15px;cursor:pointer;">
          Print
        </button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Your Booking QR Code</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* QR + label */}
        <div className="flex flex-col items-center px-6 py-8">
          <div className="rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm">
            <QRCodeCanvas
              id="business-qr-canvas"
              value={bookingUrl}
              size={220}
              level="H"
              marginSize={0}
              imageSettings={{
                src: '/favicon.ico',
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-base font-bold text-slate-900">{businessName}</p>
            <p className="mt-1 text-xs text-slate-500">Scan to book an appointment</p>
            <p className="mt-2 break-all rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400 font-mono">
              {bookingUrl}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </button>
        </div>

        <p className="pb-5 text-center text-xs text-slate-400">
          Print and place it at your counter, door, or mirror.
        </p>
      </div>
    </div>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
const BusinessLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href);

  const currentPage = navItems.find(isActive);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <CalendarDaysIcon className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">Reserva</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}

        {/* QR Code button */}
        <button
          onClick={() => { setShowQR(true); setSidebarOpen(false); }}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors mt-2"
        >
          <QrCodeIcon className="h-5 w-5 flex-shrink-0" />
          My QR Code
        </button>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-100 p-4 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-4 py-2.5">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-semibold text-blue-700">
                {user?.first_name?.[0]?.toUpperCase() || 'B'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500">Business Owner</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-shrink-0 flex-col bg-white shadow-lg transition-transform duration-200 lg:relative lg:translate-x-0 lg:shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <p className="text-base font-semibold text-slate-700">
              {currentPage?.name || 'Dashboard'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* QR button in header for quick access */}
            <button
              onClick={() => setShowQR(true)}
              className="hidden items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors sm:flex"
            >
              <QrCodeIcon className="h-4 w-4" />
              QR Code
            </button>
            <NotificationBell />
            <div className="hidden items-center gap-2 md:flex">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-semibold text-blue-700">
                    {user?.first_name?.[0]?.toUpperCase() || 'B'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {showQR && <QRModal user={user} onClose={() => setShowQR(false)} />}
    </div>
  );
};

export default BusinessLayout;
