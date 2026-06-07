import React from 'react';
import StaticInfoPage from './StaticInfoPage';

const Terms = () => (
  <StaticInfoPage
    title="Terms of Service"
    description="These placeholder terms outline the main expectations for using Reserva until the full legal terms are published."
    details={[
      'Users are responsible for providing accurate account and booking information, respecting appointment policies, and using the platform lawfully.',
      'Businesses are responsible for keeping availability, services, prices, and cancellation rules current. Booking policies may vary by provider and should be reviewed before confirming an appointment.',
      'The complete terms will include more detail on account access, acceptable use, cancellations, and dispute handling.',
    ]}
  />
);

export default Terms;
