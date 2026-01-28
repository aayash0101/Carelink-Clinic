
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/Auth.jsx'
import './MobileTabBar.css'

const MobileTabBar = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const isActive = (path) => location.pathname === path

  if (!isAuthenticated) return null

  const tabs = user?.role === 'doctor' 
    ? [
        { path: '/doctor/schedule', label: 'Schedule', icon: '📅' },
        { path: '/profile', label: 'Profile', icon: '👤' }
      ]
    : user?.role === 'admin'
    ? [
        { path: '/admin', label: 'Admin', icon: '⚙️' },
        { path: '/profile', label: 'Profile', icon: '👤' }
      ]
    : [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/book', label: 'Book', icon: '📅' },
        { path: '/appointments', label: 'Appointments', icon: '📋' },
        { path: '/profile', label: 'Profile', icon: '👤' }
      ]

  return (
    <nav className="mobile-tabbar">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`mobile-tab ${isActive(tab.path) ? 'active' : ''}`}
        >
          <span className="mobile-tab-icon">{tab.icon}</span>
          <span className="mobile-tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default MobileTabBar

