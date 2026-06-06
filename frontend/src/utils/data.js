export const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

export const responseList = (response) => asArray(response?.data?.data ?? response?.data ?? response);

export const asNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const safeText = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const formatStatus = (status, fallback = 'Unknown') =>
  safeText(status, fallback).replace(/_/g, ' ');

export const getTimeParts = (timeValue) => {
  if (typeof timeValue !== 'string') return null;
  const [hours, minutes] = timeValue.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return { hours, minutes };
};

export const getAppointmentStart = (appointment) => {
  const dateValue = safeText(appointment?.date);
  const parts = getTimeParts(appointment?.start_time);
  if (!dateValue || !parts) return null;

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(parts.hours, parts.minutes, 0, 0);
  return date;
};

export const compareAppointmentAsc = (a, b) => {
  const left = getAppointmentStart(a);
  const right = getAppointmentStart(b);
  return (left?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right?.getTime() ?? Number.MAX_SAFE_INTEGER);
};

export const compareAppointmentDesc = (a, b) => -compareAppointmentAsc(a, b);

export const formatClockTime = (timeValue, fallback = 'Time TBD') => {
  const parts = getTimeParts(timeValue);
  if (!parts) return fallback;

  const date = new Date();
  date.setHours(parts.hours, parts.minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatCalendarDate = (dateValue, options, fallback = 'Date TBD') => {
  const text = safeText(dateValue);
  if (!text) return fallback;

  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', options);
};
