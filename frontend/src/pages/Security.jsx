import React from 'react';
import StaticInfoPage from './StaticInfoPage';

const Security = () => (
  <StaticInfoPage
    title="Security"
    description="Reserva is designed to protect accounts and booking data with practical security controls."
    details={[
      'The platform is intended to use HTTPS for data in transit and secure password handling for account credentials.',
      'Operational safeguards may include access controls, data encryption where appropriate, logging, and routine dependency updates.',
      'A responsible disclosure process will be published here so security researchers can report concerns safely.',
    ]}
  />
);

export default Security;
