import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ProtectedRoute from './components/Common/ProtectedRoute'
import AppShell from './components/Layout/AppShell'

// Clinic pages
import Dashboard from './pages/Dashboard'
import ClinicAppointments from './pages/ClinicAppointments'
import Doctors from './pages/Doctors'
import Profile from './pages/Profile'
import AdminPage from './pages/Admin'

// Public pages
import Home from './pages/Home'
import Departments from './pages/Departments'
import Services from './pages/Services'
import ServiceDetails from './pages/ServiceDetails'
import BookAppointment from './pages/BookAppointment'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyEmail from './pages/VerifyEmail'
import ProfilePage from './pages/ProfilePage'
import DoctorSchedule from './pages/DoctorSchedule'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import NotFound from './pages/NotFound'

import { AuthProvider } from './context/Auth.jsx'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppShell>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />

              {/* Protected User Routes */}
              <Route path="/book" element={<Navigate to="/services" replace />} />
              <Route path="/book/:id" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><ClinicAppointments /></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />

              {/* Protected Doctor Routes */}
              <Route path="/doctor/schedule" element={<ProtectedRoute><DoctorSchedule /></ProtectedRoute>} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App