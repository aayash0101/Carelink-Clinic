import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth.jsx'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect once loading is finished
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login')
      } else if (adminOnly && user?.role !== 'admin') {
        navigate('/') // Redirect non-admins to home
      }
    }
  }, [loading, isAuthenticated, user, adminOnly, navigate])

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        fontSize: '1.2rem',
        color: '#D4AF37'
      }}>
        Loading Luxury Experience...
      </div>
    )
  }

  // Only render children if authenticated (and admin if required)
  return (isAuthenticated && (!adminOnly || user?.role === 'admin')) ? children : null
}

export default ProtectedRoute