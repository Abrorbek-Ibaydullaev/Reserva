import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with the Reserva team. We're here to help businesses and customers across Uzbekistan with any questions about our booking platform."
        path="/contact"
      />
      <StaticInfoPage
        title={t('static.contact_title')}
        description={t('static.contact_description')}
      />
    </>
  );
};

export default Contact;
