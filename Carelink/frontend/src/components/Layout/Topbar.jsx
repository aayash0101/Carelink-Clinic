
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/Auth.jsx'
import './Topbar.css'

const Topbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-content">
        <div className="topbar-left">
          <h2 className="topbar-title">CareLink Clinic</h2>
        </div>
        
        <div className="topbar-right">
          {isAuthenticated ? (
            <div className="topbar-user">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role === 'patient' ? 'Patient' : user?.role === 'doctor' ? 'Doctor' : 'Admin'}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="topbar-auth">
              <button onClick={() => navigate('/login')} className="btn-outline">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar

