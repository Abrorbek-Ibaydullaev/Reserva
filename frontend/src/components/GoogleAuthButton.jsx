import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Google Identity Services (GSI) sign-in / sign-up button.
 *
 * Renders the official Google button and, on success, sends the returned JWT
 * credential to the backend (POST /api/auth/google/) via loginWithGoogle.
 *
 * @param {'signin_with'|'signup_with'|'continue_with'} text
 *   Controls the button label. 'signin_with' → "Sign in with Google";
 *   'signup_with' → "Sign up with Google". Defaults to 'signin_with'.
 * @param {(message: string) => void} onError  Optional error handler.
 */
const GoogleAuthButton = ({ text = 'signin_with', onError }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  const handleCredential = useCallback(
    async (response) => {
      const credential = response?.credential;
      if (!credential) return;

      const result = await loginWithGoogle(credential);
      if (result.success) {
        const u = result.user;
        const fallback =
          u?.user_type === 'business_owner'
            ? '/dashboard'
            : u?.user_type === 'employee'
            ? '/employee/dashboard'
            : '/';
        const from = location.state?.from?.pathname || '/';
        navigate(from === '/' ? fallback : from, { replace: true });
      } else if (onError) {
        onError(typeof result.message === 'string' ? result.message : 'Google sign-in failed');
      }
    },
    [loginWithGoogle, navigate, location, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;

    const tryRender = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text, // 'signin_with' | 'signup_with'
        shape: 'rectangular',
        logo_alignment: 'center',
        width: containerRef.current.offsetWidth || 320,
      });
      return true;
    };

    // The GSI script loads async — poll briefly until window.google is ready.
    if (tryRender()) return () => { cancelled = true; };
    const interval = setInterval(() => { if (tryRender()) clearInterval(interval); }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [handleCredential, text]);

  // Not configured (no client id) — render nothing so the page still works.
  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} className="flex w-full justify-center" />;
};

export default GoogleAuthButton;
