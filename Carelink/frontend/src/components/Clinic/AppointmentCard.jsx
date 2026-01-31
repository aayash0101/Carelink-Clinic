import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AppointmentCard({ appointment }) {
  const navigate = useNavigate()
  const {
    id,
    doctor = 'Dr. Smith',
    department = 'General',
    datetime = '—',
    status = 'booked'
  } = appointment || {}

  const initials = (doctor || 'D S')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="appointment-card">
      <div className="appointment-info">
        <div className="doctor-avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{doctor}</div>
          <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>
            {department} • {datetime}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className={`status-chip status-${status}`}>{String(status).replace('_', ' ')}</span>

        <button
          className="btn btn-ghost"
          disabled={!id}
          onClick={() => navigate(`/appointments/${id}`)}
          title={!id ? 'Missing appointment id' : 'View appointment'}
        >
          View
        </button>
      </div>
    </div>
  )
}
