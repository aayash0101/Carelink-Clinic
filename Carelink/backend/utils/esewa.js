const crypto = require('crypto');


exports.generateEsewaFormData = (orderData) => {
  const {
    totalAmount,
    transactionUUID,
    productCode = 'EPAYTEST',
    successUrl,
    failureUrl
  } = orderData;

  const secretKey = '8gBm/:&EnhH.1/q'; 

  
  const formattedAmount = Number(totalAmount).toFixed(2);

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


exports.verifyEsewaPayment = (data) => {
  const secretKey = '8gBm/:&EnhH.1/q';
  
  try {
    
    const signedFieldNames = data.signed_field_names;

    
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

