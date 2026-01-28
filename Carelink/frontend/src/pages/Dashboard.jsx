import React from 'react'
import AppointmentCard from '../components/Clinic/AppointmentCard'

export default function Dashboard(){
  const next = { doctor: 'Dr. Aisha Khan', department: 'Family Medicine', datetime: 'Mon, 10:00 AM', status: 'confirmed' }
  const upcoming = [
    { doctor: 'Dr. Aisha Khan', department: 'Family Medicine', datetime: 'Mon, 10:00 AM', status: 'confirmed' },
    { doctor: 'Dr. Roy', department: 'Dermatology', datetime: 'Thu, 2:30 PM', status: 'booked' },
  ]

  return (
    <div>
      <h2 style={{marginBottom:12}}>Next Appointment</h2>
      <div className="card">
        <AppointmentCard appointment={next} />
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3>Upcoming</h3>
        <button className="btn btn-primary">Book appointment</button>
      </div>

      <div>
        {upcoming.map((a,i)=> (
          <div key={i} style={{marginBottom:12}}>
            <AppointmentCard appointment={a} />
          </div>
        ))}
      </div>
    </div>
  )
}
