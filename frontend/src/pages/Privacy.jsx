import React from 'react';
import StaticInfoPage from './StaticInfoPage';

const Privacy = () => (
  <StaticInfoPage
    title="Privacy Policy"
    description="This placeholder summarizes how Reserva thinks about privacy while the full policy is prepared."
    details={[
      'Reserva may collect account details, booking information, usage data, and support messages so the service can operate reliably.',
      'Cookies and similar technologies may be used for sign-in, preferences, analytics, and security. Some third-party services may process limited data when they help us provide hosting, email, payments, analytics, or maps.',
      'A complete privacy policy will explain user rights, retention periods, and contact options in more detail.',
    ]}
  />
);

export default Privacy;
