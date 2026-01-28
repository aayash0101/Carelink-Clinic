// import { useState, useEffect } from 'react'
// import './PasswordStrengthMeter.css'

// const PasswordStrengthMeter = ({ password }) => {
//   const [strength, setStrength] = useState({
//     score: 0,
//     label: '',
//     color: '',
//     feedback: []
//   })

//   useEffect(() => {
//     if (!password) {
//       setStrength({ score: 0, label: '', color: '', feedback: [] })
//       return
//     }

//     let score = 0
//     const feedback = []

//     // Length check
//     if (password.length >= 12) {
//       score += 1
//     } else {
//       feedback.push('At least 12 characters required')
//     }

//     // Uppercase check
//     if (/[A-Z]/.test(password)) {
//       score += 1
//     } else {
//       feedback.push('Add uppercase letters')
//     }

//     // Lowercase check
//     if (/[a-z]/.test(password)) {
//       score += 1
//     } else {
//       feedback.push('Add lowercase letters')
//     }

//     // Number check
//     if (/[0-9]/.test(password)) {
//       score += 1
//     } else {
//       feedback.push('Add numbers')
//     }

//     // Special character check
//     if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
//       score += 1
//     } else {
//       feedback.push('Add special characters')
//     }

//     // Length bonus
//     if (password.length >= 16) {
//       score += 1
//     }

//     // Determine label and color
//     let label, color
//     if (score <= 2) {
//       label = 'Weak'
//       color = '#EF4444'
//     } else if (score === 3) {
//       label = 'Fair'
//       color = '#F59E0B'
//     } else if (score === 4) {
//       label = 'Good'
//       color = '#3B82F6'
//     } else if (score === 5) {
//       label = 'Strong'
//       color = '#10B981'
//     } else {
//       label = 'Very Strong'
//       color = '#D4AF37'
//     }

//     setStrength({ score, label, color, feedback })
//   }, [password])

//   if (!password) return null

//   return (
//     <div className="password-strength-meter">
//       <div className="strength-bar-container">
//         <div
//           className="strength-bar"
//           style={{
//             width: `${(strength.score / 6) * 100}%`,
//             backgroundColor: strength.color
//           }}
//         />
//       </div>
//       <div className="strength-info">
//         <span className="strength-label" style={{ color: strength.color }}>
//           {strength.label}
//         </span>
//         {strength.feedback.length > 0 && (
//           <ul className="strength-feedback">
//             {strength.feedback.map((item, index) => (
//               <li key={index}>{item}</li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   )
// }

// export default PasswordStrengthMeter
























// components/Auth/PasswordStrengthMeter.jsx - ENHANCED
import { useState, useEffect } from 'react'
import api from '../../services/api' // ✅ Use API for server-side validation
import { AUTH_VALIDATE_PASSWORD } from '../../services/endpoints'
import './PasswordStrengthMeter.css'

const PasswordStrengthMeter = ({ password, onValidationChange }) => {
  const [strength, setStrength] = useState({
    score: 0,
    label: '',
    color: '',
    feedback: []
  })
  const [serverValidation, setServerValidation] = useState(null)

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: '', color: '', feedback: [] })
      onValidationChange?.(false)
      return
    }

    // ✅ CLIENT-SIDE: Quick feedback
    validateClientSide(password)
    
    // ✅ SERVER-SIDE: Authoritative validation (debounced)
    const timer = setTimeout(() => {
      validateServerSide(password)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [password])

  const validateClientSide = (pwd) => {
    let score = 0
    const feedback = []

    if (pwd.length >= 12) score += 1
    else feedback.push('At least 12 characters required')

    if (/[A-Z]/.test(pwd)) score += 1
    else feedback.push('Add uppercase letters')

    if (/[a-z]/.test(pwd)) score += 1
    else feedback.push('Add lowercase letters')

    if (/[0-9]/.test(pwd)) score += 1
    else feedback.push('Add numbers')

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1
    else feedback.push('Add special characters')

    if (pwd.length >= 16) score += 1

    let label, color
    if (score <= 2) {
      label = 'Weak'
      color = '#EF4444'
    } else if (score === 3) {
      label = 'Fair'
      color = '#F59E0B'
    } else if (score === 4) {
      label = 'Good'
      color = '#3B82F6'
    } else if (score === 5) {
      label = 'Strong'
      color = '#10B981'
    } else {
      label = 'Very Strong'
      color = '#D4AF37'
    }

    setStrength({ score, label, color, feedback })
    onValidationChange?.(score >= 4) // Require at least "Good"
  }

  // ✅ NEW: Server-side validation
  const validateServerSide = async (pwd) => {
    try {
      const { data } = await api.post(AUTH_VALIDATE_PASSWORD, { password: pwd })
      setServerValidation(data.data)
      onValidationChange?.(data.data.isValid)
    } catch (error) {
      console.error('Server validation failed:', error)
    }
  }

  if (!password) return null

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: `${(strength.score / 6) * 100}%`,
            backgroundColor: strength.color
          }}
        />
      </div>
      <div className="strength-info">
        <span className="strength-label" style={{ color: strength.color }}>
          {strength.label}
        </span>
        
        {/* ✅ Show server-side feedback if available */}
        {serverValidation && !serverValidation.isValid && (
          <ul className="strength-feedback server">
            {serverValidation.errors.map((error, index) => (
              <li key={index} style={{ color: '#EF4444' }}>{error}</li>
            ))}
          </ul>
        )}
        
        {strength.feedback.length > 0 && (
          <ul className="strength-feedback">
            {strength.feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default PasswordStrengthMeter
