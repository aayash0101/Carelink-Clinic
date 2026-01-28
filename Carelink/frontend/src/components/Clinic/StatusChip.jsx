import React from 'react'

export default function StatusChip({ status='booked' }){
  return <span className={`status-chip status-${status}`}>{status.replace('_',' ')}</span>
}
