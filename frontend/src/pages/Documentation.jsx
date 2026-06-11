import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Documentation = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.documentation_title')}
      description={t('static.documentation_description')}
    />
  );
};

export default Documentation;
