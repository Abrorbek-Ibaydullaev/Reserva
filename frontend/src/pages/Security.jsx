import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Security = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.security_title')}
      description={t('static.security_description')}
    />
  );
};

export default Security;
