const axios = require('axios');

/**
 * Verify Google reCAPTCHA token
 * @param {string} token - reCAPTCHA token from frontend
 * @param {string} remoteip - User's IP address
 * @returns {Promise<Object>} - Verification result
 */
exports.verifyRecaptcha = async (token, remoteip = null) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'reCAPTCHA token is required'
      };
    }

    const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('GOOGLE_RECAPTCHA_SECRET_KEY is not set in environment variables');
      return {
        success: false,
        message: 'reCAPTCHA configuration error'
      };
    }

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams({
      secret: secretKey,
      response: token
    });

    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    const response = await axios.post(verificationUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { success, score, challenge_ts, hostname, 'error-codes': errorCodes } = response.data;

    if (!success) {
      return {
        success: false,
        message: 'reCAPTCHA verification failed',
        errorCodes: errorCodes || []
      };
    }

    // For reCAPTCHA v3, check score (0.0 to 1.0, higher is better)
    // For v2, score will be undefined
    if (score !== undefined && score < 0.5) {
      return {
        success: false,
        message: 'reCAPTCHA score too low. Please try again.',
        score
      };
    }

    return {
      success: true,
      message: 'reCAPTCHA verified successfully',
      score,
      challenge_ts,
      hostname
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return {
      success: false,
      message: 'Error verifying reCAPTCHA',
      error: error.message
    };
  }
};



