export const formatDate = (dateString, locale) =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));

export const formatCurrency = (amount, locale) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatNumber = (value, locale) =>
  new Intl.NumberFormat(locale).format(value);
