import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { toast } from 'react-toastify';
import PasswordInput from '../components/Auth/PasswordInput';
import GoogleRecaptcha from '../components/Auth/GoogleRecaptcha';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', totpCode: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Credentials, 2: 2FA
  const [requiresRecaptcha, setRequiresRecaptcha] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡️ Block if captcha is required in Step 1 but not solved
    if (step === 1 && requiresRecaptcha && !recaptchaToken) {
      toast.error('Please complete the security check');
      return;
    }

    setLoading(true);
    const result = await login(
      formData.email,
      formData.password,
      formData.totpCode,
      recaptchaToken
    );
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else if (result.requires2FA) {
      setStep(2);
      setRecaptchaToken(null); // Clear token as it's one-time use anyway
      toast.info('Please enter your 2FA code');
    } else if (result.requiresRecaptcha) {
      setRequiresRecaptcha(true);
      setRecaptchaToken(null);
      if (window.grecaptcha) window.grecaptcha.reset(); 
      toast.warning('Security check required');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">{step === 1 ? 'Welcome Back' : 'Verification'}</h1>
          <p className="auth-subtitle">
            {step === 1 ? 'Login to your account' : 'Enter the 6-digit code from your app'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {step === 1 && (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" />
                </div>
                
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>Password</label>
                    {/* ✅ FORGOT PASSWORD LINK */}
                    <Link to="/forgot-password" style={{ color: '#D4AF37', fontSize: '12px', textDecoration: 'none' }}>
                      Forgot Password?
                    </Link>
                  </div>
                  <PasswordInput name="password" value={formData.password} onChange={handleChange} required />
                </div>

                {/* 🛡️ CAPTCHA: ONLY SHOW IN STEP 1 */}
                {requiresRecaptcha && (
                  <div className="recaptcha-wrapper" style={{ margin: '15px 0' }}>
                    <GoogleRecaptcha onVerify={(t) => setRecaptchaToken(t)} />
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <div className="form-group">
                <label>Authenticator Code</label>
                <input 
                  type="text" 
                  name="totpCode" 
                  value={formData.totpCode} 
                  onChange={handleChange} 
                  placeholder="000000"
                  maxLength="6"
                  required 
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Processing...' : (step === 1 ? 'Login' : 'Verify Code')}
            </button>
          </form>

          {step === 1 && (
            <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
              {/* ✅ REGISTER LINK */}
              <p>Don't have an account? <Link to="/register" style={{ color: '#D4AF37', fontWeight: 'bold' }}>Sign Up</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;