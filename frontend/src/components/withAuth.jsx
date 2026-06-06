import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const withAuth = (Component, allowedUserTypes = []) => {
    return function WithAuthComponent(props) {
        const { isAuthenticated, user, loading } = useAuth();

            if (loading) {
                return (
                <div className="app-page flex items-center justify-center">
                    <div className="app-spinner" />
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
