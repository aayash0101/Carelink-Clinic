import React from 'react'

export default function AppointmentCard({ appointment }){
  const { doctor='Dr. Smith', department='General', datetime='—', status='booked' } = appointment || {}
  return (
    <div className="appointment-card">
      <div className="appointment-info">
        <div className="doctor-avatar">{doctor.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
        <div>
          <div style={{fontWeight:700}}>{doctor}</div>
          <div style={{color:'var(--color-muted)',fontSize:13}}>{department} • {datetime}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <span className={`status-chip status-${status}`}>{status.replace('_',' ')}</span>
        <button className="btn btn-ghost">View</button>
      </div>
    </div>
  )
}
