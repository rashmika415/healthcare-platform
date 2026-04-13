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
    if (sessionStorage.getItem(DEV_REDIRECT_KEY) === '1') return;
    sessionStorage.setItem(DEV_REDIRECT_KEY, '1');

    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

