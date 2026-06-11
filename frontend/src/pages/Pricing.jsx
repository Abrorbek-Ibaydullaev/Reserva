import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Pricing = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.pricing_title')}
      description={t('static.pricing_description')}
    />
  );
};

export default Pricing;
