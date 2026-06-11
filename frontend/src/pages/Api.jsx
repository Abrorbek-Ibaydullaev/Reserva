import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Api = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.api_title')}
      description={t('static.api_description')}
    />
  );
};

export default Api;
