import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Terms = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.terms_title')}
      description={t('static.terms_description')}
    />
  );
};

export default Terms;
