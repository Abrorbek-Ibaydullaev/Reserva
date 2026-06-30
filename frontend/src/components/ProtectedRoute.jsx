import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedUserTypes = [], redirectTo = '/' }) => {
    const { t } = useTranslation();
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        if (dismissed) {
            // User closed the prompt — go back rather than staying on a broken page
            navigate(-1);
            return null;
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="mx-4 w-full max-w-sm rounded-[24px] bg-white dark:bg-slate-800 p-6 shadow-xl text-center sm:mx-0 sm:p-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f6fb] dark:bg-slate-700 text-[#2f95bb] mb-5">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login_required')}</h2>
                    <p className="mt-2 text-gray-500 dark:text-slate-400 text-sm">{t('auth.login_required_message')}</p>
                    <div className="mt-7 space-y-3">
                        <button
                            type="button"
                            onClick={() => navigate('/login', { state: { from: location } })}
                            className="w-full rounded-2xl bg-[#2f95bb] px-6 py-3 text-base font-semibold text-white hover:bg-[#2788aa] transition"
                        >
                            {t('auth.log_in')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="w-full rounded-2xl border border-gray-300 dark:border-slate-600 px-6 py-3 text-base font-semibold text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                        >
                            {t('auth.create_account')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="w-full py-2 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition"
                        >
                            {t('auth.go_back')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user?.user_type)) {
        navigate(redirectTo, { replace: true, state: { from: location } });
        return null;
    }

    return children;
};

export default ProtectedRoute;
