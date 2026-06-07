import React from 'react';
import StaticInfoPage from './StaticInfoPage';

const Cookies = () => (
  <StaticInfoPage
    title="Cookie Policy"
    description="Reserva uses cookies and similar storage to keep the product useful, secure, and easier to navigate."
    details={[
      'Essential cookies may support sign-in sessions, saved preferences, and fraud prevention.',
      'Analytics cookies may help us understand which workflows need improvement, while preference cookies may remember choices like theme or recent searches.',
      'The full cookie policy will describe categories, retention, and user controls in more detail.',
    ]}
  />
);

export default Cookies;
