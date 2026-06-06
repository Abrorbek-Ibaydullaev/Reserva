import React from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const Contact = () => (
  <div className="app-page">
    <div className="app-card-pad mx-auto max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand text-brand">Contact</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-token text-token">How can we help?</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-soft text-soft">
        For booking questions, account support, or business onboarding, reach the Reserva team using the details below.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="surface-subtle rounded-xl border border-token p-5">
          <EnvelopeIcon className="h-6 w-6 text-brand" />
          <p className="mt-4 text-sm font-semibold text-token">Email</p>
          <p className="mt-1 break-all text-sm text-soft">support@reserva.com</p>
        </div>
        <div className="surface-subtle rounded-xl border border-token p-5">
          <PhoneIcon className="h-6 w-6 text-brand" />
          <p className="mt-4 text-sm font-semibold text-token">Phone</p>
          <p className="mt-1 text-sm text-soft">+1 (555) 123-4567</p>
        </div>
        <div className="surface-subtle rounded-xl border border-token p-5">
          <MapPinIcon className="h-6 w-6 text-brand" />
          <p className="mt-4 text-sm font-semibold text-token">Office</p>
          <p className="mt-1 text-sm text-soft">San Francisco, CA</p>
        </div>
      </div>
    </div>
  </div>
);

export default Contact;
