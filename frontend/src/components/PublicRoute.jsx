import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-page flex items-center justify-center">
                <div className="app-spinner" />
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect authenticated users away from login/register pages
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;
