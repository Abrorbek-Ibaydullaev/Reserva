import { useEffect, useRef, useState } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { userService } from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const load = async () => {
    try {
      const r = await userService.getNotifications();
      setNotifications(r.data.results || r.data || []);
    } catch {
      // silent — notifications are non-critical
    }
  };

  const markAll = async () => {
    try {
      await userService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await userService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const typeIcon = (type) => {
    const map = {
      appointment_confirmation: '✅',
      appointment_reminder: '🔔',
      appointment_cancellation: '❌',
      new_message: '💬',
      review_request: '⭐',
      promotion: '🎁',
      system: 'ℹ️',
    };
    return map[type] || '🔔';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">{unread}</span>}
            </p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.is_read ? '' : 'bg-blue-50/50'}`}
                >
                  <span className="mt-0.5 flex-shrink-0 text-lg leading-none">{typeIcon(n.notification_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{n.message}</p>
                  </div>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
