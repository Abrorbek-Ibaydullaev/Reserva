import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Pricing = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Pricing"
        description="Explore Reserva's simple and transparent pricing plans for service businesses in Uzbekistan. Start free — no hidden fees."
        path="/pricing"
      />
      <StaticInfoPage
        title={t('static.pricing_title')}
        description={t('static.pricing_description')}
      />
    </>
  );
};

export default Pricing;
