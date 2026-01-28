import React from 'react'

export default function DoctorCard({ doctor }){
  const { name='Dr. Maya', department='Cardiology', availability='Mon, Wed' } = doctor || {}
  return (
    <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:56,height:56,borderRadius:10,background:'#dff6f7',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
        <div>
          <div style={{fontWeight:700}}>{name}</div>
          <div style={{color:'var(--color-muted)',fontSize:13}}>{department} • {availability}</div>
        </div>
      </div>
      <div>
        <button className="btn btn-primary">Book</button>
      </div>
    </div>
  )
}
