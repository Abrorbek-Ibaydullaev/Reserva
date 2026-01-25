import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
// import Services from './pages/Services';
// import ServiceDetail from './pages/ServiceDetail';
import BusinessDashboard from './pages/BusinessDashboard';
// import CustomerProfile from './pages/CustomerProfile';
// import BookAppointment from './pages/BookAppointment';
// import MyAppointments from './pages/MyAppointments';
// import About from './pages/About';
// import Contact from './pages/Contact';

// Business Pages
// import BusinessServices from './pages/business/Services';
// import BusinessAppointments from './pages/business/Appointments';
// import BusinessEmployees from './pages/business/Employees';
// import BusinessSchedule from './pages/business/Schedule';

function App() {
  return (
    <Router>
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
            {/* <Route path="/services/:id" element={<ServiceDetail />} /> */}
            {/* <Route path="/about" element={<About />} /> */}
            {/* <Route path="/contact" element={<Contact />} /> */}

            {/* Customer Routes - Protected for logged-in customers */}
            {/* <Route 
              path="/appointments" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <MyAppointments />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/book/:serviceId" 
              element={
                <ProtectedRoute>
                  <BookAppointment />
                </ProtectedRoute>
              } 
            /> */}

            {/* Business Routes - Protected for business owners only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            {/* <Route 
              path="/dashboard/services" 
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessServices />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/dashboard/appointments" 
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessAppointments />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/dashboard/employees" 
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessEmployees />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/dashboard/schedule" 
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessSchedule />
                </ProtectedRoute>
              } 
            /> */}

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
  );
}

export default App;