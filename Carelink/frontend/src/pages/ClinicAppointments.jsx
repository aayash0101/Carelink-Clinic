import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import api from '../services/api'
import { useAuth } from '../context/Auth.jsx'
import { APPOINTMENTS_ME } from '../services/endpoints'
import AppointmentCard from '../components/Clinic/AppointmentCard'

export default function ClinicAppointments() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated])

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      const { data } = await api.get(APPOINTMENTS_ME)

      if (data?.success) {
        const list =
          data?.data?.appointments ||
          data?.appointments ||
          []

        setAppointments(list)
      } else {
        setAppointments([])
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load appointments'
      toast.error(msg)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const now = Date.now()

  const { upcoming, past } = useMemo(() => {
    const up = []
    const pa = []

    for (const a of appointments) {
      const ts = a?.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      if (ts && ts >= now) up.push(a)
      else pa.push(a)
    }

    up.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    pa.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))

    return { upcoming: up, past: pa }
  }, [appointments, now])

  if (loading) {
    return <div className="card">Loading appointments...</div>
  }

  return (
    <div>
      <h2>My Appointments</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <h4>Upcoming</h4>

        {upcoming.length === 0 ? (
          <div style={{ opacity: 0.8 }}>
            No upcoming appointments.
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate('/services')}>
                Book an appointment
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {upcoming.map((apt) => (
              <AppointmentCard key={apt._id || apt.id} appointment={normalizeForCard(apt)} />
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h4>Past Appointments</h4>

        {past.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No past appointments.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {past.map((apt) => (
              <AppointmentCard key={apt._id || apt.id} appointment={normalizeForCard(apt)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Normalizes backend appointment shape to AppointmentCard format
 * Backend returns: doctorId, departmentId, scheduledAt, status
 * Card expects: doctor, department, datetime, status
 */
function normalizeForCard(apt) {
  const id = apt?._id || apt?.id

  const doctorName =
    apt?.doctorId?.name ||
    apt?.doctor?.name ||
    apt?.doctorName ||
    'Doctor'

  const departmentName =
    apt?.departmentId?.name ||
    apt?.department?.name ||
    apt?.serviceId?.category?.name ||
    apt?.departmentName ||
    'Department'

  const datetime =
    apt?.scheduledAt
      ? new Date(apt.scheduledAt).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'N/A'

  return {
    id,          // ✅ add this
    _id: id,     // ✅ and this (covers both styles)
    doctor: doctorName,
    department: departmentName,
    datetime,
    status: apt?.status || 'unknown',
    scheduledAt: apt?.scheduledAt, // ✅ often useful for view pages
    _raw: apt
  }
}
