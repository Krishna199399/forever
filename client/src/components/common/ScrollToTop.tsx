import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the top of the page on route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Instant scroll avoids animation lag during page transitions
    });
  }, [pathname]);

  return null;
}
