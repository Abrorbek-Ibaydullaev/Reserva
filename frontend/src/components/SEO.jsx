import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const BASE_URL = 'https://reserva.services';
const SITE_NAME = 'Reserva';
const DEFAULT_IMAGE = `${BASE_URL}/logo_v2.png`;
const DEFAULT_TITLE = `${SITE_NAME} — Online Booking for Service Businesses in Uzbekistan`;
const DEFAULT_DESCRIPTION =
  "Reserva is Uzbekistan's online booking platform for salons, barbershops, spas, fitness studios, and more. Find a service, pick a time, and book instantly.";

/**
 * SEO head component — renders <title>, meta description, canonical, OG and
 * Twitter tags via react-helmet-async.  Also keeps <html lang> in sync with
 * the active i18n language.
 *
 * Props:
 *   title        {string}  Page-specific title (appended with " | Reserva").
 *                          Pass the full default title string to skip the suffix.
 *   description  {string}  Meta description for this page.
 *   image        {string}  Absolute URL for OG / Twitter image.
 *   path         {string}  Path component of the page URL, e.g. "/services".
 *                          Used to build the canonical tag.
 *   noindex      {boolean} Set true for private / dashboard pages.
 */
const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path = '',
  noindex = false,
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';

  // Keep <html lang> in sync with the active i18n language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;

  const canonical = `${BASE_URL}${path || ''}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
