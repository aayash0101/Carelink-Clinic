import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/carelink.css'

if (import.meta.env.DEV) {
  // ============================================================================
  // NETWORK INSTRUMENTATION: Find source of /api/epay/login request
  // ============================================================================
  
  // 1. Intercept fetch
  const _fetch = window.fetch;
  window.fetch = (...args) => {
    const url = String(args[0]);
    if (url.includes("epay/login") || url.includes("bookingId") || url.includes("rc-epay")) {
      console.group("🔍 FETCH INTERCEPTED: epay/login");
      console.log("URL:", url);
      console.log("Args:", args);
      console.trace("Stack Trace");
      console.groupEnd();
    }
    return _fetch(...args);
  };
  
  // 2. Intercept XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  const PatchedXHR = function() {
    const xhr = new OriginalXHR();
    const _open = xhr.open;
    xhr.open = function(method, url, ...rest) {
      if (String(url).includes("epay/login") || String(url).includes("bookingId") || String(url).includes("rc-epay")) {
        console.group("🔍 XHR INTERCEPTED: epay/login");
        console.log("Method:", method, "URL:", url);
        console.trace("Stack Trace");
        console.groupEnd();
      }
      return _open.apply(xhr, [method, url, ...rest]);
    };
    return xhr;
  };
  window.XMLHttpRequest = PatchedXHR;
  
  // 3. Intercept form submissions
  document.addEventListener('submit', (e) => {
    const action = e.target?.action || '';
    if (action.includes("epay/login") || action.includes("bookingId") || action.includes("rc-epay")) {
      console.group("🔍 FORM SUBMIT INTERCEPTED: epay/login");
      console.log("Action:", action);
      console.log("Form HTML:", e.target?.outerHTML?.substring(0, 200));
      console.trace("Stack Trace");
      console.groupEnd();
      e.preventDefault();
      return false;
    }
  }, true);
  
  // 4. Monitor window.location changes (not needed - fetch/XHR will catch it)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)



