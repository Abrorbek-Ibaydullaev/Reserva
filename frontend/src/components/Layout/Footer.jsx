import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const footerLinks = {
  Product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'API', href: '/api' },
    { name: 'Documentation', href: '/docs' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
  ],
  Legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Security', href: '/security' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  Support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Status', href: '/status' },
    { name: 'Community', href: '/community' },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-token bg-surface-token">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <span className="metric-icon h-10 w-10">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold text-token">Reserva</span>
            </Link>
            <p className="body-text mt-4 max-w-md">
              Discover trusted local professionals, book open times, and manage appointments from one calm workspace.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="eyebrow">{category}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-sm font-medium text-muted hover:text-token">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-3 border-t border-token pt-6 text-sm text-muted md:grid-cols-3">
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="h-4 w-4 text-brand" />
            <span>support@reserva.com</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-brand" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-brand" />
            <span>San Francisco, CA</span>
          </div>
        </div>

        <p className="caption-text mt-8">
          &copy; {new Date().getFullYear()} Reserva. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
