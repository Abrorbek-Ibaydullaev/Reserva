import { useEffect, useRef, useState } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { userService } from '../../services/api';
import { responseList } from '../../utils/data';

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
      setNotifications(responseList(r));
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
      appointment_confirmation: 'OK',
      appointment_reminder: '!',
      appointment_cancellation: 'X',
      new_message: 'M',
      review_request: '*',
      promotion: '%',
      system: 'i',
    };
    return map[type] || '!';
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="icon-button relative"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown-panel right-0 w-[min(20rem,calc(100vw-2rem))] min-w-0">
          <div className="flex items-center justify-between border-b border-token px-4 py-3">
            <p className="text-sm font-bold text-token">
              Notifications {unread > 0 && <span className="badge badge-danger ml-1">{unread}</span>}
            </p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-link flex items-center gap-1 text-xs"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n, index) => (
                <button
                  key={n.id ?? `${n.title || 'notification'}-${index}`}
                  onClick={() => n.id && markOne(n.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted-token ${n.is_read ? '' : 'bg-muted-token'}`}
                >
                  <span className="avatar-token mt-0.5 h-6 w-6 flex-shrink-0 text-[10px]">{typeIcon(n.notification_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${n.is_read ? 'text-soft' : 'font-bold text-token'}`}>
                      {n.title || 'Notification'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">{n.message || 'No details provided.'}</p>
                  </div>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
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
