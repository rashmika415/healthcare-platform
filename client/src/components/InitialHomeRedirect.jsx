import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEV_REDIRECT_KEY = 'dev_initial_home_redirect_done_v1';

/**
 * Dev-only behavior requested:
 * When starting the app (npm start), always land on Home ("/") once.
 * This prevents the dev server from reopening a previously visited deep link
 * like "/doctor/dashboard".
 */
export default function InitialHomeRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    // Only run on a real page load/reload, not SPA navigation.
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    const navType = navEntry?.type; // 'navigate' | 'reload' | 'back_forward' | 'prerender'
    if (navType && !['navigate', 'reload', 'back_forward'].includes(navType)) return;

    // Ensure this runs once per page load, even if the tab persists.
    if (sessionStorage.getItem(DEV_REDIRECT_KEY) === '1') return;
    sessionStorage.setItem(DEV_REDIRECT_KEY, '1');
    const cleanup = () => {
      try { sessionStorage.removeItem(DEV_REDIRECT_KEY); } catch {}
    };
    window.addEventListener('beforeunload', cleanup);

    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }

    return () => window.removeEventListener('beforeunload', cleanup);
  }, [location.pathname, navigate]);

  return null;
}

