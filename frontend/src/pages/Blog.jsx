import React from 'react';
import { useTranslation } from 'react-i18next';
import StaticInfoPage from './StaticInfoPage';
import SEO from '../components/SEO';

const Blog = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Blog"
        description="Tips, news, and insights for service business owners and customers in Uzbekistan from the Reserva team."
        path="/blog"
      />
      <StaticInfoPage
        title={t('static.blog_title')}
        description={t('static.blog_description')}
      />
    </>
  );
};

export default Blog;
