import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const BusinessDetail = lazy(() => import('./pages/BusinessDetail'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const MyAppointments = lazy(() => import('./pages/MyAppointments'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const BusinessServices = lazy(() => import('./pages/business/Services'));
const BusinessAppointments = lazy(() => import('./pages/business/Appointments'));
const BusinessEmployees = lazy(() => import('./pages/business/Employees'));
const BusinessSchedule = lazy(() => import('./pages/business/Schedule'));
const EmployeeSchedule = lazy(() => import('./pages/employee/Schedule'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="app-page flex min-h-[50vh] items-center justify-center">
    <div className="app-spinner" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
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

              <Route
                path="/employee/*"
                element={
                  <ProtectedRoute allowedUserTypes={['employee']}>
                    <EmployeeLayout>
                      <Routes>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<EmployeeDashboard />} />
                        <Route path="appointments" element={<MyAppointments />} />
                        <Route path="schedule" element={<EmployeeSchedule />} />
                        <Route path="profile" element={<EmployeeProfile />} />
                      </Routes>
                    </EmployeeLayout>
                  </ProtectedRoute>
                }
              />

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

              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/services" element={<Services />} />
                      <Route path="/services/:serviceId" element={<ServiceDetail />} />
                      <Route path="/business/:businessId" element={<BusinessDetail />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/features" element={<StaticPage title="Features" />} />
                      <Route path="/pricing" element={<StaticPage title="Pricing" />} />
                      <Route path="/api" element={<StaticPage title="API" />} />
                      <Route path="/docs" element={<StaticPage title="Documentation" />} />
                      <Route path="/blog" element={<StaticPage title="Blog" />} />
                      <Route path="/careers" element={<StaticPage title="Careers" />} />
                      <Route path="/press" element={<StaticPage title="Press" />} />
                      <Route path="/privacy" element={<StaticPage title="Privacy Policy" />} />
                      <Route path="/terms" element={<StaticPage title="Terms of Service" />} />
                      <Route path="/security" element={<StaticPage title="Security" />} />
                      <Route path="/cookies" element={<StaticPage title="Cookie Policy" />} />
                      <Route path="/help" element={<StaticPage title="Help Center" />} />
                      <Route path="/status" element={<StaticPage title="Status" />} />
                      <Route path="/community" element={<StaticPage title="Community" />} />

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
          </Suspense>

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
