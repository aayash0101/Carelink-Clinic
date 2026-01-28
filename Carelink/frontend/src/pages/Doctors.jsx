import React from 'react'
import DoctorCard from '../components/Clinic/DoctorCard'

export default function Doctors(){
  const doctors = [
    { name: 'Dr. Aisha Khan', department: 'Family Medicine', availability: 'Mon-Fri' },
    { name: 'Dr. Roy', department: 'Dermatology', availability: 'Tue, Thu' },
  ]
  return (
    <div>
      <h2>Doctors</h2>
      <div style={{display:'grid',gap:12}}>
        {doctors.map((d,i)=> <DoctorCard key={i} doctor={d} />)}
      </div>
    </div>
  )
}
