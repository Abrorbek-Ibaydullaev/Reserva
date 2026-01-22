import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
// import Register from './pages/Register';
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
            <Route path="/login" element={<Login />} />
            {/* <Route path="/register" element={<Register />} /> */}
            {/* <Route path="/services" element={<Services />} /> */}
            {/* <Route path="/services/:id" element={<ServiceDetail />} /> */}
            {/* <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} /> */}
            
            {/* Customer Routes */}
            {/* <Route path="/appointments" element={<MyAppointments />} /> */}
            {/* <Route path="/profile" element={<CustomerProfile />} /> */}
            {/* <Route path="/book/:serviceId" element={<BookAppointment />} /> */}
            
            {/* Business Routes */}
            <Route path="/dashboard" element={<BusinessDashboard />} />
            {/* <Route path="/dashboard/services" element={<BusinessServices />} /> */}
            {/* <Route path="/dashboard/appointments" element={<BusinessAppointments />} /> */}
            {/* <Route path="/dashboard/employees" element={<BusinessEmployees />} /> */}
            {/* <Route path="/dashboard/schedule" element={<BusinessSchedule />} /> */}
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