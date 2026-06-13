import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Services from './pages/Services';
import BusinessDetail from './pages/BusinessDetail';
import BookAppointment from './pages/BookAppointment';
import CustomerProfile from './pages/CustomerProfile';
import Settings from './pages/Settings';
import BusinessProfile from './pages/BusinessProfile';
import EmployeeProfile from './pages/EmployeeProfile';
import MyAppointments from './pages/MyAppointments';
import EmployeeDashboard from './pages/EmployeeDashboard';
import BusinessDashboard from './pages/BusinessDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Api from './pages/Api';
import Documentation from './pages/Documentation';
import Blog from './pages/Blog';
import Careers from './pages/Careers';
import Press from './pages/Press';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import Cookies from './pages/Cookies';
import Help from './pages/Help';
import Status from './pages/Status';
import Community from './pages/Community';
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

            {/* ── Home – standalone layout (own nav + hero) ── */}
            <Route path="/" element={<Home />} />

            {/* ── Auth pages – no layout wrapper ── */}
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
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* ── All other routes – main Navbar / Footer layout ── */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>

                    <Route path="/services" element={<Services />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/api" element={<Api />} />
                    <Route path="/docs" element={<Documentation />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/press" element={<Press />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/community" element={<Community />} />
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
                      path="/settings"
                      element={
                        <ProtectedRoute allowedUserTypes={['customer', 'business_owner', 'employee']}>
                          <Settings />
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
        <SpeedInsights />
      </Router>
    </ThemeProvider>
  );
}

export default App;
