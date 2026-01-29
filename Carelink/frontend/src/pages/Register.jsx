import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth.jsx'
import { toast } from 'react-toastify'
import PasswordInput from '../components/Auth/PasswordInput'
import GoogleRecaptcha from '../components/Auth/GoogleRecaptcha'
import PasswordStrengthMeter from '../components/Auth/PasswordStrengthMeter'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../utils/sanitize.js'
import './Auth.css'

// ✅ Show captcha in dev if you want (recommended while testing)
const SHOW_RECAPTCHA = import.meta.env.VITE_ENABLE_RECAPTCHA === 'true' || import.meta.env.MODE === 'production'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // ✅ If captcha is enabled, require it
    if (SHOW_RECAPTCHA && !recaptchaToken) {
      toast.error('Please verify you are human')
      return
    }

    const payload = {
      name: sanitizeString(formData.name, 100),
      email: sanitizeEmail(formData.email),
      phone: sanitizePhone(formData.phone),
      password: formData.password,
      ...(SHOW_RECAPTCHA ? { recaptchaToken } : {})
    }

    if (!payload.name || !payload.email || !payload.phone) {
      toast.error('Please enter valid name/email/phone')
      return
    }

    setLoading(true)
    const result = await register(payload)
    setLoading(false)

    if (result?.success) {
      toast.success('Registered! Please verify your email.')
      navigate('/login')
      return
    }

    // ✅ show backend error if any
    toast.error(result?.message || 'Registration failed')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* ✅ Phone was missing in your form, but your payload requires it */}
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={12}
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={formData.password} />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            {/* ✅ reCAPTCHA enabled in dev/prod via SHOW_RECAPTCHA */}
            {SHOW_RECAPTCHA && (
              <div style={{ marginBottom: '20px' }}>
                <GoogleRecaptcha onVerify={setRecaptchaToken} />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || (SHOW_RECAPTCHA && !recaptchaToken)}
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
