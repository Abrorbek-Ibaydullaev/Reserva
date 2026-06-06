import React from 'react';
import { Link } from 'react-router-dom';

const About = () => (
  <div className="app-page">
    <div className="app-container max-w-4xl py-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand text-brand">About Reserva</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-token text-token">
        Appointment booking for local service businesses.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-soft text-soft">
        Reserva helps customers find nearby professionals and book available times without phone calls or back-and-forth messages.
        Business owners and staff get a focused dashboard for services, appointments, schedules, and customer notifications.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Customers', 'Search, compare, and book from one clean flow.'],
          ['Businesses', 'Publish services and manage daily bookings.'],
          ['Staff', 'Track assigned appointments and availability.'],
        ].map(([title, body]) => (
          <div key={title} className="app-card p-5">
            <h2 className="font-semibold text-token text-token">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-soft text-soft">{body}</p>
          </div>
        ))}
      </div>
      <Link
        to="/services"
        className="btn-primary mt-8"
      >
        Explore businesses
      </Link>
    </div>
  </div>
);

export default About;
