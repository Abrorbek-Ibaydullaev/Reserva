import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const About = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="About Reserva"
        description="Learn about Reserva — the team, mission, and vision behind Uzbekistan's leading online booking platform for service businesses."
        path="/about"
      />
      <StaticInfoPage
        title={t('static.about_title')}
        description={t('static.about_description')}
      />
    </>
  );
};

export default About;
