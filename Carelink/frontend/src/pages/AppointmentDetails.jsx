import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { APPOINTMENT_DETAIL, APPOINTMENT_UPDATE_STATUS } from '../services/endpoints'

export default function AppointmentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apt, setApt] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.get(APPOINTMENT_DETAIL(id))
        const item = data?.data?.appointment || data?.appointment || data?.data || data
        setApt(item || null)
        if (!item) {
          setError('Appointment not found')
          toast.error('Appointment not found')
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Failed to load appointment'
        setError(errMsg)
        toast.error(errMsg)
      } finally {
        setLoading(false)
      }
    }
    if (id) run()
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return

    try {
      // api instance already sends X-CSRF-Token via interceptor if cookie exists
      await api.patch(APPOINTMENT_UPDATE_STATUS(id), { status: 'cancelled' })
      toast.success('Appointment cancelled successfully')
      navigate('/appointments')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to cancel appointment')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>Loading appointment...</div>
      </div>
    )
  }

  if (error || !apt) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Appointment</h3>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
        </div>
        <div style={{ opacity: 0.8, marginTop: 10, color: '#d32f2f' }}>
          {error || 'No appointment data'}
        </div>
      </div>
    )
  }

  // Extract nested object names safely
  const doctorName = apt.doctorId?.name || (typeof apt.doctorId === 'string' ? apt.doctorId : 'N/A')
  const departmentName = apt.departmentId?.name || (typeof apt.departmentId === 'string' ? apt.departmentId : 'N/A')
  const serviceName = apt.serviceId?.name || (typeof apt.serviceId === 'string' ? apt.serviceId : 'N/A')

  // Format scheduled time
  const scheduledTime = apt.scheduledAt
    ? new Date(apt.scheduledAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Appointment Details</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Show Cancel button if not cancelled/completed */}
          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
            <button className="btn btn-danger" onClick={handleCancel} style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }}>
              Cancel Appointment
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Appointment Number */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Appointment Number
          </div>
          <div style={{ fontWeight: 500 }}>
            {apt.appointmentNumber || apt._id || 'N/A'}
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Status
          </div>
          <div>
            <span
              className={`status-chip status-${(apt.status || 'unknown').toLowerCase()}`}
              style={{ textTransform: 'capitalize' }}
            >
              {String(apt.status || 'unknown').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Payment Status
          </div>
          <div style={{ textTransform: 'capitalize' }}>
            {String(apt.paymentStatus || 'pending').replace('_', ' ')}
          </div>
        </div>

        {/* Consultation Fee */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Consultation Fee
          </div>
          <div style={{ fontWeight: 500 }}>
            {apt.consultationFee ? `Rs. ${apt.consultationFee}` : 'N/A'}
          </div>
        </div>

        {/* Scheduled Time */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Scheduled Time
          </div>
          <div style={{ fontWeight: 500 }}>{scheduledTime}</div>
        </div>

        {/* Doctor */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Doctor
          </div>
          <div style={{ fontWeight: 500 }}>{doctorName}</div>
        </div>

        {/* Department */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Department
          </div>
          <div style={{ fontWeight: 500 }}>{departmentName}</div>
        </div>

        {/* Service */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Service
          </div>
          <div style={{ fontWeight: 500 }}>{serviceName}</div>
        </div>
      </div>
    </div>
  )
}
