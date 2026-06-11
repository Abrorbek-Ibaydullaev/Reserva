import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Community = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.community_title')}
      description={t('static.community_description')}
    />
  );
};

export default Community;
