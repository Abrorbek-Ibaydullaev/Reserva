import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import BusinessLayout from './components/Layout/BusinessLayout';
import EmployeeLayout from './components/Layout/EmployeeLayout';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
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
import BusinessDashboard from './pages/BusinessDashboard';
import BusinessServices from './pages/business/Services';
import BusinessAppointments from './pages/business/Appointments';
import BusinessEmployees from './pages/business/Employees';
import BusinessSchedule from './pages/business/Schedule';
import EmployeeSchedule from './pages/employee/Schedule';
import NotFound from './pages/NotFound';


function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* ── Business dashboard – uses its own sidebar layout ── */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedUserTypes={['business_owner']}>
                  <BusinessLayout>
                    <Routes>
                      <Route index element={<BusinessDashboard />} />
                      <Route path="services" element={<BusinessServices />} />
                      <Route path="appointments" element={<BusinessAppointments />} />
                      <Route path="employees" element={<BusinessEmployees />} />
                      <Route path="schedule" element={<BusinessSchedule />} />
                      <Route path="profile" element={<BusinessProfile />} />
                    </Routes>
                  </BusinessLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Employee portal – uses its own sidebar layout ── */}
            <Route
              path="/employee/*"
              element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <EmployeeLayout>
                    <Routes>
                      <Route path="dashboard" element={<EmployeeDashboard />} />
                      <Route path="appointments" element={<MyAppointments />} />
                      <Route path="schedule" element={<EmployeeSchedule />} />
                      <Route path="profile" element={<EmployeeProfile />} />
                    </Routes>
                  </EmployeeLayout>
                </ProtectedRoute>
              }
            />

            {/* ── All other routes – main Navbar / Footer layout ── */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />

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

                    <Route path="/services" element={<Services />} />
                    <Route path="/business/:businessId" element={<BusinessDetail />} />

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
                        <ProtectedRoute allowedUserTypes={['customer']}>
                          <CustomerProfile />
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

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>

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
