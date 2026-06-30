import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Security = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Security"
        description="Reserva takes your data security seriously. Learn how we protect your personal information and keep your bookings safe."
        path="/security"
      />
      <StaticInfoPage
        title={t('static.security_title')}
        description={t('static.security_description')}
      />
    </>
  );
};

export default Security;
