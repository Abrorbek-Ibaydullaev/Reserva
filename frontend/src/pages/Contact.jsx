import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.contact_title')}
      description={t('static.contact_description')}
    />
  );
};

export default Contact;
