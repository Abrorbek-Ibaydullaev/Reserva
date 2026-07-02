import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * "Sign in with Google" for existing, approved business owners only.
 * On failure (e.g. no approved business account) it calls onError with the
 * backend message so the Login page can display it.
 */
const GoogleAuthButton = ({ onError }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const handleCredential = useCallback(
    async (response) => {
      const credential = response?.credential;
      if (!credential) return;
      const result = await loginWithGoogle(credential);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else if (onError) {
        onError(typeof result.message === 'string' ? result.message : 'Google sign-in failed');
      }
    },
    [loginWithGoogle, navigate, onError]
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
        text: 'signin_with', // "Sign in with Google"
        shape: 'rectangular',
        logo_alignment: 'center',
        width: containerRef.current.offsetWidth || 320,
      });
      return true;
    };

    if (tryRender()) return () => { cancelled = true; };
    const interval = setInterval(() => { if (tryRender()) clearInterval(interval); }, 200);
    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => { cancelled = true; clearInterval(interval); clearTimeout(timeout); };
  }, [handleCredential]);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={containerRef} className="flex w-full justify-center" />;
};

export default GoogleAuthButton;
