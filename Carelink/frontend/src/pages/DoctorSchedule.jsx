import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/Auth.jsx'
import { toast } from 'react-toastify'
import { APPOINTMENTS_DOCTOR, APPOINTMENT_UPDATE_STATUS } from '../services/endpoints'

import './DoctorSchedule.css'

const DoctorSchedule = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [statusUpdate, setStatusUpdate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'doctor') {
      navigate('/login')
      return
    }
    fetchAppointments()
  }, [isAuthenticated, user])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(APPOINTMENTS_DOCTOR)
      if (data && data.success) {
        setAppointments(data.data.appointments || [])
      }
    } catch (error) {
      toast.error('Failed to load appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (appointmentId) => {
    if (!statusUpdate) {
      toast.error('Please select a status')
      return
    }

    try {
      const { data } = await api.patch(APPOINTMENTS_UPDATE_STATUS(appointmentId), {
        status: statusUpdate,
        notes: notes || undefined
      })

      if (data && data.success) {
        toast.success('Appointment status updated')
        setStatusUpdate('')
        setNotes('')
        setSelectedAppointment(null)
        fetchAppointments()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'orange',
      booked: 'blue',
      confirmed: 'green',
      completed: 'gray',
      cancelled: 'red',
      no_show: 'red'
    }
    return colors[status] || 'gray'
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

  if (loading && appointments.length === 0) {
    return <div className="lux-loader">Loading schedule...</div>
  }

  if (selectedAppointment) {
    return (
      <div className="order-single-container">
        <div className="container">
          <button className="back-btn" onClick={() => setSelectedAppointment(null)}>
            ← Back to Schedule
          </button>

          <div className="order-hero">
            <h1>Appointment #{selectedAppointment.appointmentNumber}</h1>
            <p>Patient: {selectedAppointment.patientId?.name || 'N/A'}</p>
          </div>

          <div className="order-content-grid">
            <div className="order-details">
              <h2>Appointment Details</h2>
              <div className="detail-row">
                <span>Status:</span>
                <span style={{ color: getStatusColor(selectedAppointment.status) }}>
                  {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="detail-row">
                <span>Scheduled Time:</span>
                <span>{formatDate(selectedAppointment.scheduledAt)}</span>
              </div>
              <div className="detail-row">
                <span>Service:</span>
                <span>{selectedAppointment.serviceId?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Patient Email:</span>
                <span>{selectedAppointment.patientId?.email || 'N/A'}</span>
              </div>
              {selectedAppointment.patientId?.phone && (
                <div className="detail-row">
                  <span>Patient Phone:</span>
                  <span>{selectedAppointment.patientId.phone}</span>
                </div>
              )}
            </div>

            <div className="order-items">
              <h2>Update Status</h2>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  rows="4"
                  placeholder="Add notes about this appointment..."
                />
              </div>
              <button
                onClick={() => handleStatusUpdate(selectedAppointment._id)}
                className="btn btn-primary"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Schedule</h1>

        {appointments.length === 0 ? (
          <div className="no-orders">
            <p>You have no appointments scheduled.</p>
          </div>
        ) : (
          <div className="orders-list">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="order-card"
                onClick={() => setSelectedAppointment(apt)}
              >
                <div className="order-header">
                  <h3>#{apt.appointmentNumber}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(apt.status) }}
                  >
                    {apt.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="order-info">
                  <p>
                    <strong>Patient:</strong> {apt.patientId?.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Service:</strong> {apt.serviceId?.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Scheduled:</strong> {formatDate(apt.scheduledAt)}
                  </p>
                  <p>
                    <strong>Fee:</strong> Rs. {apt.consultationFee?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorSchedule

