import { useEffect, useRef } from 'react'
import './GoogleRecaptcha.css'

const GoogleRecaptcha = ({ onVerify, siteKey }) => {
  const ref = useRef(null)
  const widgetId = useRef(null) // Track the widget ID
  
  // Default to env if prop not passed
  const key = siteKey || import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY

  useEffect(() => {
    if (!key) {
      console.error('Recaptcha Key Missing')
      return
    }

    const scriptId = 'recaptcha-script'

    // Function to render the widget safely
    const renderWidget = () => {
      // 🛡️ CRITICAL FIX: Check if ref exists AND is empty before rendering
      if (window.grecaptcha && ref.current && !ref.current.hasChildNodes()) {
        try {
          widgetId.current = window.grecaptcha.render(ref.current, {
            sitekey: key,
            callback: onVerify,
            'expired-callback': () => onVerify(null),
            'error-callback': () => onVerify(null)
          })
        } catch (error) {
          // Suppress "already rendered" errors if race condition occurs
          console.warn('Recaptcha render warning:', error.message)
        }
      }
    }
    
    // Assign global callback for when script loads
    window.onRecaptchaLoad = renderWidget

    // Load Script if not present
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    } else if (window.grecaptcha && window.grecaptcha.render) {
      // If script is already loaded, render immediately
      renderWidget()
    }

    return () => {
      // Cleanup: We don't remove the script (it's global), 
      // but we clear the callback to prevent memory leaks
      window.onRecaptchaLoad = null
    }
  }, [key, onVerify])

  return <div ref={ref} className="recaptcha-container"></div>
}

export default GoogleRecaptcha

