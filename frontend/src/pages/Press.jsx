import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Press = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.press_title')}
      description={t('static.press_description')}
    />
  );
};

export default Press;
