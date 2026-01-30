import { useEffect, useRef } from 'react'
import './GoogleRecaptcha.css'

const GoogleRecaptcha = ({ onVerify, siteKey }) => {
  const ref = useRef(null)
  const widgetId = useRef(null)
  const isRenderingRef = useRef(false)
  
  const key = siteKey || import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY

  // Promise-based script loader: ensures grecaptcha is ready
  const loadRecaptchaScript = async () => {
    const scriptId = 'recaptcha-script-carelink'
    
    // Script already in DOM
    if (document.getElementById(scriptId)) {
      // Wait for grecaptcha.render to be available (poll up to 10s)
      for (let i = 0; i < 100; i++) {
        if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
          return Promise.resolve()
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      console.error('grecaptcha.render unavailable after 10s')
      return Promise.reject(new Error('grecaptcha.render not available'))
    }

    // Load script for first time
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      // Do NOT use defer - we need immediate execution and onload callback

      // Script load success: wait for grecaptcha to be truly ready
      script.onload = async () => {
        // Poll for grecaptcha.render availability (up to 5s after script load)
        for (let i = 0; i < 50; i++) {
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            resolve()
            return
          }
          await new Promise(r => setTimeout(r, 100))
        }
        reject(new Error('grecaptcha.render not ready after script onload'))
      }

      script.onerror = () => {
        reject(new Error('Failed to load reCAPTCHA script'))
      }

      document.body.appendChild(script)
    })
  }

  useEffect(() => {
    if (!key) {
      console.error('Recaptcha Key Missing')
      return
    }

    let mounted = true

    const initRecaptcha = async () => {
      try {
        // Wait for script to be ready
        await loadRecaptchaScript()

        if (!mounted) return

        // If already rendered in this mount (StrictMode re-mount), reset instead
        if (widgetId.current !== null) {
          if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            try {
              window.grecaptcha.reset(widgetId.current)
              return
            } catch (error) {
              console.warn('Recaptcha reset warning:', error.message)
              widgetId.current = null
            }
          }
        }

        // Render the widget
        if (!isRenderingRef.current && ref.current && !ref.current.hasChildNodes()) {
          isRenderingRef.current = true
          try {
            // Final safety check before render
            if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
              widgetId.current = window.grecaptcha.render(ref.current, {
                sitekey: key,
                callback: onVerify,
                'expired-callback': () => onVerify(null),
                'error-callback': () => onVerify(null)
              })
            } else {
              throw new Error('window.grecaptcha.render is not available')
            }
          } catch (error) {
            console.error('Recaptcha render error:', error.message)
            widgetId.current = null
          } finally {
            isRenderingRef.current = false
          }
        }
      } catch (error) {
        console.error('Recaptcha initialization failed:', error.message)
      }
    }

    initRecaptcha()

    return () => {
      mounted = false
    }
  }, [key, onVerify])

  return <div ref={ref} className="recaptcha-container"></div>
}

export default GoogleRecaptcha

