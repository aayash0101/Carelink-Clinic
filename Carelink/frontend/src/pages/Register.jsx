import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth.jsx'
import { toast } from 'react-toastify'
import PasswordInput from '../components/Auth/PasswordInput'
import GoogleRecaptcha from '../components/Auth/GoogleRecaptcha'
import PasswordStrengthMeter from '../components/Auth/PasswordStrengthMeter'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../utils/sanitize.js'
import './Auth.css'

const isProd = import.meta.env.MODE === 'production'

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match')
    if (isProd && !recaptchaToken) return toast.error('Please verify you are human')

    const payload = {
      name: sanitizeString(formData.name, 100),
      email: sanitizeEmail(formData.email),
      phone: sanitizePhone(formData.phone),
      password: formData.password,
      ...(isProd ? { recaptchaToken } : {})
    }

    if (!payload.name || !payload.email || !payload.phone) {
      return toast.error('Please enter valid name/email/phone')
    }

    setLoading(true)
    const result = await register(payload)
    setLoading(false)

    if (result.success) {
      toast.success('Registered! Please verify your email.')
      navigate('/login')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <PasswordInput name="password" value={formData.password} onChange={handleChange} required minLength={12} />
              <PasswordStrengthMeter password={formData.password} />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <PasswordInput name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            {isProd && (
              <div style={{ marginBottom: '20px' }}>
                <GoogleRecaptcha onVerify={setRecaptchaToken} />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || (isProd && !recaptchaToken)}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
