import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Help = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.help_title')}
      description={t('static.help_description')}
    />
  );
};

export default Help;
