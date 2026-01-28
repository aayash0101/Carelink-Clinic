import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/Auth.jsx'
import { APPOINTMENT_DETAIL } from '../services/endpoints'
import './PaymentPages.css'

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const { isAuthenticated } = useAuth()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId && isAuthenticated) {
      fetchAppointment()
    } else {
      setLoading(false)
    }
  }, [appointmentId, isAuthenticated])

  const fetchAppointment = async () => {
    try {
      const { data } = await api.get(APPOINTMENTS_DETAIL(appointmentId))
      if (data && data.success) {
        setAppointment(data.data.appointment)
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-status success">
          <div className="status-icon">✓</div>
          <h1>Payment Successful!</h1>
          <p>Your appointment has been booked successfully.</p>
          
          {appointment && (
            <div className="order-details">
              <p><strong>Booking ID:</strong> {appointment.appointmentNumber}</p>
              <p><strong>Doctor:</strong> {appointment.doctorId?.name || 'N/A'}</p>
              <p><strong>Service:</strong> {appointment.serviceId?.name || 'N/A'}</p>
              <p><strong>Scheduled Time:</strong> {formatDate(appointment.scheduledAt)}</p>
              <p><strong>Amount Paid:</strong> Rs. {appointment.consultationFee?.toFixed(2)}</p>
              <p><strong>Payment Status:</strong> {appointment.paymentStatus}</p>
            </div>
          )}

          <div className="payment-actions">
            <Link to="/appointments" className="btn btn-primary">View Appointments</Link>
            <Link to="/book" className="btn btn-outline">Book Another Appointment</Link>
            <Link to={`/appointments/receipt?appointmentId=${appointmentId}`} className="btn btn-outline">Download Receipt</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess



