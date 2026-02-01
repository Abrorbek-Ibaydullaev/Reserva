import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // For services page, scroll to show hero content below navbar
    // For other pages, scroll to top normally
    const scrollToPosition = () => {
      if (pathname === '/services') {
        // For services page, scroll to show hero content (below navbar)
        const navbarHeight = 64; // h-16 = 64px
        window.scrollTo(0, navbarHeight + 10);
        document.documentElement.scrollTop = navbarHeight + 10;
        document.body.scrollTop = navbarHeight + 10;
      } else {
        // For other pages, scroll to top normally
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(scrollToPosition, 50);

  }, [pathname]);

  return null;
};

export default ScrollToTop;