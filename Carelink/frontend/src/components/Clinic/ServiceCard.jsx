import React from 'react'

export default function ServiceCard({ service }){
  const { title='Consultation', duration='30m', fee='Free', department='General' } = service || {}
  return (
    <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>
        <div style={{fontWeight:700}}>{title}</div>
        <div style={{color:'var(--color-muted)',fontSize:13}}>{department} • {duration}</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontWeight:700}}>{fee}</div>
        <button className="btn btn-ghost" style={{marginTop:8}}>Select</button>
      </div>
    </div>
  )
}
