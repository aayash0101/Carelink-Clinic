import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import GoogleRecaptcha from '../components/Auth/GoogleRecaptcha'
import PasswordInput from '../components/Auth/PasswordInput'
import { AUTH_FORGOT_PASSWORD, AUTH_VERIFY_OTP, AUTH_RESET_PASSWORD } from '../services/endpoints'
import './Auth.css'

const ForgotPassword = () => {
  const [step, setStep] = useState(1) // 1: email, 2: otp, 3: reset
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  const handleRecaptchaVerify = (token) => {
    setRecaptchaToken(token)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    
    if (!recaptchaToken) {
      toast.error('Please complete the reCAPTCHA verification')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`http://127.0.0.1:5000/api${AUTH_FORGOT_PASSWORD}`, {
        email,
        recaptchaToken
      })
      
      if (data.success) {
        toast.success(data.message || 'OTP sent to your email')
        setStep(2)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const { data } = await axios.post(`http://127.0.0.1:5000/api${AUTH_VERIFY_OTP}`, {
        email,
        otp
      })
      
      if (data.success) {
        setResetToken(data.data.resetToken)
        toast.success('OTP verified successfully')
        setStep(3)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 12) {
      toast.error('Password must be at least 12 characters')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`http://127.0.0.1:5000/api${AUTH_RESET_PASSWORD}`, {
        resetToken,
        password
      })
      
      if (data.success) {
        toast.success('Password reset successfully! Please login.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {step === 1 && (
            <>
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">Enter your email to receive a reset code</p>
              
              <form onSubmit={handleSendOTP} className="auth-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <GoogleRecaptcha 
                  onVerify={handleRecaptchaVerify} 
                  siteKey={import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY}
                  required 
                />

                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-block"
                  disabled={loading || !recaptchaToken}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">Enter OTP</h1>
              <p className="auth-subtitle">Check your email for the 6-digit code</p>
              
              <form onSubmit={handleVerifyOTP} className="auth-form">
                <div className="form-group">
                  <label>6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="000000"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-block"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline btn-block"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter your new password</p>
              
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label>New Password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 12 characters"
                    minLength={12}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <PasswordInput
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    minLength={12}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-block"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

