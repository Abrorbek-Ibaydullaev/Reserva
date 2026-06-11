import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Features = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.features_title')}
      description={t('static.features_description')}
    />
  );
};

export default Features;
