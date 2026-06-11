import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Status = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.status_title')}
      description={t('static.status_description')}
    />
  );
};

export default Status;
