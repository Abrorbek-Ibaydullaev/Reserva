import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Careers = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.careers_title')}
      description={t('static.careers_description')}
    />
  );
};

export default Careers;
