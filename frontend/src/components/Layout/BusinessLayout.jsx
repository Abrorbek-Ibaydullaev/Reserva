import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../ThemeToggle';
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

const QRModal = ({ user, onClose }) => {
  const bookingUrl = `${window.location.origin}/business/${user?.id}`;
  const businessName =
    user?.profile?.business_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    'Reserva Business';

  const handleDownload = () => {
    const canvas = document.getElementById('business-qr-canvas');
    if (!canvas) return;

    const size = 600;
    const padding = 40;
    const labelHeight = 90;
    const out = document.createElement('canvas');
    out.width = size + padding * 2;
    out.height = size + padding * 2 + labelHeight;
    const ctx = out.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, padding, padding, size, size);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(businessName, out.width / 2, size + padding + 44);
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
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code - ${businessName}</title>
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
    <div className="modal-backdrop">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close" />
      <div className="modal-panel relative max-w-sm">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="icon-badge h-9 w-9">
              <QrCodeIcon className="h-5 w-5" />
            </span>
            <h2 className="section-title">Booking QR Code</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body flex flex-col items-center">
          <div className="rounded-[var(--radius-lg)] border border-token bg-surface-token p-4 shadow-sm">
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
            <p className="font-bold text-token">{businessName}</p>
            <p className="caption-text mt-1">Scan to book an appointment</p>
            <p className="mt-3 break-all rounded-[var(--radius-sm)] bg-muted-token px-3 py-2 font-mono text-[11px] text-muted">
              {bookingUrl}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-token p-5">
          <button type="button" onClick={handleDownload} className="btn-primary">
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download
          </button>
          <button type="button" onClick={handlePrint} className="btn-secondary">
            <PrinterIcon className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

const BusinessLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isActive = (item) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href);

  const currentPage = navItems.find(isActive);
  const userInitial = user?.first_name?.[0]?.toUpperCase() || 'B';

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-token px-5">
        <span className="metric-icon h-10 w-10">
          <CalendarDaysIcon className="h-5 w-5" />
        </span>
        <span className="text-xl font-bold tracking-normal text-token">Reserva</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setShowQR(true);
            setSidebarOpen(false);
          }}
          className="sidebar-link mt-2 w-full border border-dashed border-token"
        >
          <QrCodeIcon className="h-5 w-5 flex-shrink-0" />
          My QR Code
        </button>
      </nav>

      <div className="space-y-2 border-t border-token p-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="avatar-token h-9 w-9 text-sm">{userInitial}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-token">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="caption-text">Business Owner</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="sidebar-link w-full">
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-30 flex w-64 flex-shrink-0 flex-col shadow-xl transition-transform duration-200 lg:relative lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="topbar flex h-16 flex-shrink-0 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="h-5 w-5" />
            </button>
            <p className="font-bold text-token">{currentPage?.name || 'Dashboard'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setShowQR(true)} className="btn-secondary hidden sm:flex">
              <QrCodeIcon className="h-4 w-4" />
              QR Code
            </button>
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden items-center gap-2 md:flex">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="avatar-token h-9 w-9 text-sm">{userInitial}</span>
              )}
              <div>
                <p className="text-sm font-bold text-token">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="caption-text">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {showQR ? <QRModal user={user} onClose={() => setShowQR(false)} /> : null}
    </div>
  );
};

export default BusinessLayout;
