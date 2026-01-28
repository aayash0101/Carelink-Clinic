import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/Auth.jsx'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (path) => location.pathname === path

  const patientNav = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/book', label: 'Book Appointment', icon: '📅' },
    { path: '/appointments', label: 'My Appointments', icon: '📋' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ]

  const doctorNav = [
    { path: '/doctor/schedule', label: 'Schedule', icon: '📅' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ]

  const adminNav = [
    { path: '/admin', label: 'Admin Dashboard', icon: '⚙️' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ]

  const getNavItems = () => {
    if (user?.role === 'admin') return adminNav
    if (user?.role === 'doctor') return doctorNav
    return patientNav
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">CareLink Clinic</h1>
        <p className="sidebar-tagline">Your Health, Our Priority</p>
      </div>
      
      <nav className="sidebar-nav">
        {getNavItems().map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar

