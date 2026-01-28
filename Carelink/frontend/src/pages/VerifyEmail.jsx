import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../services/api'
import { AUTH_VERIFY_EMAIL } from '../services/endpoints'
import './Auth.css'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const run = async () => {
      try {
        const { data } = await api.get(`${AUTH_VERIFY_EMAIL}?token=${encodeURIComponent(token)}`)
        if (data?.success) {
          setStatus('success')
          toast.success('Email verified successfully!')
          setTimeout(() => navigate('/login'), 1500)
        } else {
          setStatus('error')
          toast.error(data?.message || 'Email verification failed')
        }
      } catch (err) {
        setStatus('error')
        toast.error(err.response?.data?.message || 'Email verification failed')
      }
    }

    run()
  }, [token, navigate])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {status === 'verifying' && (
            <>
              <h1 className="auth-title">Verifying Email</h1>
              <p className="auth-subtitle">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="auth-title">Email Verified!</h1>
              <p className="auth-subtitle">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="auth-title">Verification Failed</h1>
              <p className="auth-subtitle">Invalid or expired verification link.</p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
