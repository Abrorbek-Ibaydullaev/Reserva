import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import BusinessDetail from './pages/BusinessDetail';
import BookAppointment from './pages/BookAppointment';
import CustomerProfile from './pages/CustomerProfile';
import BusinessProfile from './pages/BusinessProfile';
import EmployeeProfile from './pages/EmployeeProfile';
import MyAppointments from './pages/MyAppointments';
import EmployeeDashboard from './pages/EmployeeDashboard';
// import ServiceDetail from './pages/ServiceDetail';
import BusinessDashboard from './pages/BusinessDashboard';
import BusinessServices from './pages/business/Services';
import BusinessAppointments from './pages/business/Appointments';
import BusinessEmployees from './pages/business/Employees';
import BusinessSchedule from './pages/business/Schedule';
import NotFound from './pages/NotFound';
// import BookAppointment from './pages/BookAppointment';
// import About from './pages/About';
// import Contact from './pages/Contact';

const ServicesRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user?.user_type === 'business_owner') {
    return <NotFound />;
  }

  if (user?.user_type === 'employee') {
    return <NotFound />;
  }

  return <Services />;
};

const ProfileRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user?.user_type === 'business_owner') {
    return <BusinessProfile />;
  }

  if (user?.user_type === 'employee') {
    return <EmployeeProfile />;
  }

  return <CustomerProfile />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />

            {/* Login/Register - Protected by PublicRoute */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* <Route path="/services" element={<Services />} /> */}
            <Route path="/services" element={<ServicesRoute />} />
            <Route path="/business/:businessId" element={<BusinessDetail />} />
            {/* <Route path="/services/:id" element={<ServiceDetail />} /> */}
            {/* <Route path="/about" element={<About />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}

            {/* Customer Routes - Protected for logged-in customers */}
            <Route
              path="/appointments"
              element={
                <ProtectedRoute allowedUserTypes={['customer', 'business_owner', 'employee']}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:serviceId"
              element={
                <ProtectedRoute allowedUserTypes={['customer']} redirectTo="/appointments">
                  <BookAppointment />
                </ProtectedRoute>
              }
            />

            {/* Business Routes - Protected for business owners only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/services"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/appointments"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/employees"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/schedule"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/appointments"
              element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </Router>
    </ThemeProvider>
  );
}

export default App;
