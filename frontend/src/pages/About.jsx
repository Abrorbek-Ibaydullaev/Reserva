import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const About = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.about_title')}
      description={t('static.about_description')}
    />
  );
};

export default About;
