import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Privacy = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.privacy_title')}
      description={t('static.privacy_description')}
    />
  );
};

export default Privacy;
