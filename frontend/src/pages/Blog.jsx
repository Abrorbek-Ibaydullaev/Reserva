import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';

const Blog = () => {
  const { t } = useTranslation();
  return (
    <StaticInfoPage
      title={t('static.blog_title')}
      description={t('static.blog_description')}
    />
  );
};

export default Blog;
