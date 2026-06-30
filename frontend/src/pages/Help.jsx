import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Help = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Help Center"
        description="Find answers to common questions about booking appointments, managing your business, and using Reserva in Uzbekistan."
        path="/help"
      />
      <StaticInfoPage
        title={t('static.help_title')}
        description={t('static.help_description')}
      />
    </>
  );
};

export default Help;
