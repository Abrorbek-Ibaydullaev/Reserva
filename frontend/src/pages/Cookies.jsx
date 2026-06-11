import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Cookies = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.cookies_title')}
      description={t('static.cookies_description')}
    />
  );
};

export default Cookies;
