const crypto = require('crypto');

/**
 * Generate eSewa v2 form data with HMAC SHA256 signature
 * Per eSewa official v2 API docs:
 * - Signature covers: total_amount, transaction_uuid, product_code (in that order)
 * - Signature is base64-encoded HMAC-SHA256
 * - Secret key must never be exposed to frontend
 */
exports.generateEsewaFormData = (orderData) => {
  const {
    totalAmount,
    transactionUUID,
    productCode = 'EPAYTEST',
    successUrl,
    failureUrl
  } = orderData;

  // Secret key from environment variable (never hardcode)
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  
  const formattedAmount = Number(totalAmount).toFixed(2);

  // Build signature string exactly in the required order: total_amount, transaction_uuid, product_code
  const signatureString = `total_amount=${formattedAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('base64');

  return {
    amount: formattedAmount,
    tax_amount: "0",
    product_service_charge: "0",
    product_delivery_charge: "0",
    total_amount: formattedAmount,
    transaction_uuid: transactionUUID,
    product_code: productCode,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: signature
  };
};

/**
 * Verify eSewa payment signature on callback
 */
exports.verifyEsewaPayment = (data) => {
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  
  try {
    const signedFieldNames = data.signed_field_names;

    // Rebuild signature string in same order
    const signatureString = signedFieldNames
      .split(',')
      .map(field => `${field}=${data[field]}`)
      .join(',');

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureString)
      .digest('base64');

    console.log("___ ESEWA VERIFY ___");
    console.log("Recvd String:", signatureString);
    console.log("Recvd Sig:   ", data.signature);
    console.log("Calc Sig:    ", expectedSignature);
    
    return data.signature === expectedSignature;
  } catch (error) {
    console.error("Signature Verification Crash:", error);
    return false;
  }
};

exports.generateTransactionUUID = () => {
  return `LUX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

/**
 * Get eSewa endpoint URL based on environment
 */
exports.getEsewaEndpoint = () => {
  const esewaEnv = process.env.ESEWA_ENV || 'rc'; // 'rc' or 'prod'
  
  if (esewaEnv === 'prod') {
    return 'https://epay.esewa.com.np/api/epay/main/v2/form';
  }
  
  // Default to RC (testing)
  return 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
};

