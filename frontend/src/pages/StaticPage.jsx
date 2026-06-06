import React from 'react';
import { Link } from 'react-router-dom';

const copyByTitle = {
  Features: 'Discover professionals, manage bookings, and keep appointments organized from one place.',
  Pricing: 'Reserva is free to browse. Business pricing depends on the tools enabled for each workspace.',
  API: 'API documentation is being prepared for business integrations and partner workflows.',
  Documentation: 'Guides for customers and businesses will be published here as the product grows.',
  Blog: 'Product updates, business tips, and marketplace stories will appear here.',
  Careers: 'We are not listing open roles at the moment.',
  Press: 'For media and brand inquiries, contact the Reserva team.',
  'Privacy Policy': 'We only collect the information needed to run accounts, bookings, notifications, and support.',
  'Terms of Service': 'Use Reserva respectfully, keep account information accurate, and follow booking policies set by each business.',
  Security: 'Reserva protects account access with authenticated API requests and scoped user roles.',
  'Cookie Policy': 'Reserva uses local browser storage for session, preferences, and recent search convenience.',
  'Help Center': 'Need help with a booking or business account? Contact support and include the email on your account.',
  Status: 'No active incidents are currently displayed.',
  Community: 'Community resources are coming soon.',
};

const StaticPage = ({ title = 'Reserva' }) => {
  const description = copyByTitle[title] || 'This page is available but does not have detailed content yet.';

  return (
    <div className="app-page">
      <div className="app-card-pad mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand text-brand">Reserva</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-token text-token">{title}</h1>
        <p className="mt-4 text-base leading-7 text-soft text-soft">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/services"
            className="btn-primary"
          >
            Browse businesses
          </Link>
          <Link
            to="/contact"
            className="btn-secondary"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
