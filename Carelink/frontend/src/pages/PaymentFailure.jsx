import { useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import './PaymentPages.css'

const PaymentFailure = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const error = searchParams.get('error')

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'invalid_signature': 'Payment verification failed. This might be a security issue.',
      'invalid_response': 'Invalid payment response received.',
      'amount_mismatch': 'Payment amount does not match order total.',
      'order_not_found': 'Order could not be found.',
      'confirmation_failed': 'Order confirmation failed. Stock might be unavailable.',
      'server_error': 'A server error occurred while processing your payment.',
      'cancelled': 'Payment was cancelled by user.',
      'timeout': 'Payment session timed out.',
      'insufficient_balance': 'Insufficient balance in your eSewa account.'
    }

    return errorMessages[errorCode] || 'Payment could not be processed. Please try again.'
  }

  const getErrorSuggestion = (errorCode) => {
    const suggestions = {
      'invalid_signature': 'Please contact support if this issue persists.',
      'amount_mismatch': 'Please try creating a new order.',
      'confirmation_failed': 'Some items might be out of stock. Please check your cart.',
      'insufficient_balance': 'Please add funds to your eSewa account and try again.',
      'timeout': 'Your session expired. Please create a new order.',
      'cancelled': 'You can try again whenever you\'re ready.'
    }

    return suggestions[errorCode] || 'Please check your cart and try placing the order again.'
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-status failure">
          <div className="status-icon">✗</div>
          <h1>Payment Failed</h1>
          
          <div className="error-details">
            <p className="error-message">
              {getErrorMessage(error)}
            </p>
            <p className="error-suggestion">
              {getErrorSuggestion(error)}
            </p>
          </div>

          {error === 'confirmation_failed' && (
            <div className="alert alert-warning">
              <p>
                <strong>Stock Issue:</strong> One or more items in your order may have sold out 
                while your payment was processing. Please review your cart and try again.
              </p>
            </div>
          )}

          {error === 'invalid_signature' && (
            <div className="alert alert-danger">
              <p>
                <strong>Security Alert:</strong> Payment verification failed. If you were charged, 
                please contact our support team immediately with your transaction details.
              </p>
            </div>
          )}

          <div className="failure-info">
            <div className="info-item">
              <span className="info-icon">💳</span>
              <p>No charges were made to your account</p>
            </div>
            <div className="info-item">
              <span className="info-icon">📅</span>
              <p>Your booking is not confirmed. You can retry booking or choose another slot.</p>
            </div>
            <div className="info-item">
              <span className="info-icon">🔄</span>
              <p>You can retry the payment anytime</p>
            </div>
          </div>

          <div className="payment-actions">
            <Link to="/appointments" className="btn btn-primary">My Appointments</Link>
            <Link to="/book" className="btn btn-outline">Try Booking Again</Link>
            <Link to="/services" className="btn btn-outline">Browse Services</Link>
          </div>

          <div className="support-info">
            <p>Need help? Contact our support team:</p>
            <div className="support-links">
              <a href="mailto:support@carelink.com" className="support-link">
                📧 support@luxaro.com
              </a>
              <a href="tel:+9779800000000" className="support-link">
                📞 +977 980-0000000
              </a>
            </div>
          </div>

          {error && (
            <div className="technical-details">
              <details>
                <summary>Technical Details (for support)</summary>
                <code>
                  Error Code: {error}<br />
                  Timestamp: {new Date().toISOString()}<br />
                  Session: {sessionStorage.getItem('checkoutSession') || 'N/A'}
                </code>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentFailure


