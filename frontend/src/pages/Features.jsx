import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Features = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Features"
        description="Discover Reserva's powerful features: online scheduling, customer management, automated reminders, employee management, analytics, and more for Uzbekistan businesses."
        path="/features"
      />
      <StaticInfoPage
        title={t('static.features_title')}
        description={t('static.features_description')}
      />
    </>
  );
};

export default Features;
