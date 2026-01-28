import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth.jsx'
import api from '../services/api'
import { QRCodeSVG } from 'qrcode.react' // npm install qrcode.react
import { toast } from 'react-toastify'
import { USERS_2FA_SETUP, USERS_2FA_ENABLE } from '../services/endpoints'
import './ProfilePage.css'

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  // 2FA States
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpToken, setTotpToken] = useState('')
  const [backupCodes, setBackupCodes] = useState([])

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  const start2FASetup = async () => {
    try {
      const { data } = await api.post(USERS_2FA_SETUP)
      setQrCodeUrl(data.qrCodeUrl) // Backend returns otpauth URL
      setShow2FASetup(true)
    } catch (error) {
      toast.error('Could not initiate 2FA setup')
    }
  }

  const enable2FA = async () => {
    try {
      const { data } = await api.post(USERS_2FA_ENABLE, { token: totpToken })
      if (data.success) {
        setBackupCodes(data.backupCodes)
        toast.success('2FA Enabled Successfully!')
        setShow2FASetup(false)
        // Ideally reload user context here to update UI
      }
    } catch (error) {
      toast.error('Invalid Code')
    }
  }

  if (!user) return <div className="loading">Loading...</div>

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">My Profile</h1>
        <div className="profile-content">
          
          {/* User Info Card */}
          <div className="profile-card">
            <h2>Account Details</h2>
            <div className="profile-info">
              <div className="info-row"><span>Name:</span> <span>{user.name}</span></div>
              <div className="info-row"><span>Email:</span> <span>{user.email}</span></div>
              <div className="info-row">
                <span>Security:</span> 
                <span className={user.twoFactorEnabled ? "enabled-badge" : "disabled-badge"}>
                  {user.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled"}
                </span>
              </div>
            </div>

            {/* 2FA Section */}
            {!user.twoFactorEnabled && !backupCodes.length && (
              <div style={{ marginTop: '20px' }}>
                {!show2FASetup ? (
                  <button className="btn btn-primary" onClick={start2FASetup}>Enable 2FA Security</button>
                ) : (
                  <div className="setup-2fa-box" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                    <h3>Scan this QR Code</h3>
                    <div style={{ background: 'white', padding: '10px', width: 'fit-content', margin: '10px auto' }}>
                      <QRCodeSVG value={qrCodeUrl} size={200} />
                    </div>
                    <p>Enter the 6-digit code from Google Authenticator:</p>
                    <input 
                      type="text" 
                      value={totpToken} 
                      onChange={(e) => setTotpToken(e.target.value)} 
                      placeholder="000000"
                      style={{ padding: '10px', fontSize: '18px', textAlign: 'center', width: '150px', display: 'block', margin: '10px auto' }}
                    />
                    <button className="btn btn-success" onClick={enable2FA} style={{ marginTop: '10px' }}>Verify & Enable</button>
                  </div>
                )}
              </div>
            )}

            {/* Backup Codes Display */}
            {backupCodes.length > 0 && (
              <div className="backup-codes-section" style={{ marginTop: '20px', background: '#fff3cd', padding: '20px' }}>
                <h3 style={{ color: '#856404' }}>Save these Backup Codes!</h3>
                <p>If you lose your phone, you can use these to login. They will only be shown once.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', fontFamily: 'monospace' }}>
                  {backupCodes.map((code, i) => (
                    <span key={i} style={{ background: 'white', padding: '5px' }}>{code}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

