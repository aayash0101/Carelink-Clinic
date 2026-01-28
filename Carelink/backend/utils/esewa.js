const crypto = require('crypto');

/**
 * Generate eSewa payment form data
 * Docs: https://developer.esewa.com.np/pages/Epay-V2
 */
exports.generateEsewaFormData = (orderData) => {
  const {
    totalAmount,
    transactionUUID,
    productCode = 'EPAYTEST',
    successUrl,
    failureUrl
  } = orderData;

  const secretKey = '8gBm/:&EnhH.1/q'; // Hardcoded Test Key (No @ at end)

  // 1. Format Amount (2 decimal places)
  const formattedAmount = Number(totalAmount).toFixed(2);

  // 2. Create Signature String
  const signatureString = `total_amount=${formattedAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;

  // 3. Generate HMAC-SHA256
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
 * Verify eSewa Response Signature
 * This must use the 'signed_field_names' sent by eSewa
 */
exports.verifyEsewaPayment = (data) => {
  const secretKey = '8gBm/:&EnhH.1/q';
  
  try {
    // 1. Get the list of fields eSewa signed
    // e.g. "transaction_code,status,total_amount,..."
    const signedFieldNames = data.signed_field_names;

    // 2. Build the signature string dynamically
    // We must map over the names and join them: "key=value,key=value"
    const signatureString = signedFieldNames
      .split(',')
      .map(field => `${field}=${data[field]}`)
      .join(',');

    // 3. Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureString)
      .digest('base64');

    // 4. Debug Logs (Check your terminal if it fails!)
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

