import React from 'react'

export default function SlotPicker({ slots = [], onSelect }){
  return (
    <div>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
        {/* Date pills placeholder */}
        {["Today","Tomorrow","Fri","Sat","Sun"].map((d,i)=> (
          <div key={i} style={{minWidth:88,padding:10,borderRadius:10,background:'#fff',boxShadow:'var(--shadow-sm)',marginRight:8,textAlign:'center'}}>{d}</div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
        {(slots.length? slots : ['09:00','09:30','10:00','10:30']).map(s=> (
          <button key={s} className="btn btn-ghost" style={{borderRadius:999}} onClick={()=>onSelect && onSelect(s)}>{s}</button>
        ))}
      </div>
    </div>
  )
}
