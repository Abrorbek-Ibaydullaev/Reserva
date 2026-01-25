import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const withAuth = (Component, allowedUserTypes = []) => {
    return function WithAuthComponent(props) {
        const { isAuthenticated, user, loading } = useAuth();

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(user?.user_type)) {
            return <Navigate to="/" replace />;
        }

        return <Component {...props} />;
    };
};