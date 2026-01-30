const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const { generateEsewaFormData, verifyEsewaPayment, generateTransactionUUID, getEsewaEndpoint } = require('../utils/esewa');
const { logSecurityEvent } = require('../utils/logger');
const { sendAppointmentConfirmationEmail } = require('../utils/email');


exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId: userId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Appointment already paid' });
    }

    const transactionUUID = generateTransactionUUID();

    const protocol = req.protocol;
    const host = req.get('host');
    const backendCallbackUrl = `${protocol}://${host}/api/payments/esewa`;

    const esewaData = generateEsewaFormData({
      totalAmount: appointment.consultationFee,
      transactionUUID: transactionUUID,
      productCode: 'EPAYTEST',
      successUrl: `${backendCallbackUrl}/success`, 
      failureUrl: `${backendCallbackUrl}/failure`
    });

    appointment.paymentResult = {
      transactionId: transactionUUID,
      status: 'pending',
      amount: appointment.consultationFee
    };
    appointment.paymentStatus = 'unpaid'; // Keep as unpaid until verified
    await appointment.save();

    logSecurityEvent('PAYMENT_INITIATED', {
      appointmentId: appointment._id,
      patientId: userId,
      amount: appointment.consultationFee,
      ip: req.ip
    });

    // Get correct eSewa endpoint based on ESEWA_ENV
    const esewaUrl = getEsewaEndpoint();

    res.json({
      success: true,
      data: {
        formData: esewaData,
        esewaUrl: esewaUrl,
        transactionUUID
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// @desc    eSewa payment success callback for appointment
// @route   GET /api/payments/esewa/success
// @route   POST /api/payments/esewa/success
exports.esewaSuccess = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Handle both GET and POST; eSewa sends as query params
    const responseData = req.query || req.body;
    let decodedData = responseData;

    // Decode eSewa base64 data if present
    if (responseData.data) {
      try {
        const buff = Buffer.from(responseData.data, 'base64');
        decodedData = JSON.parse(buff.toString('utf-8'));
      } catch (decodeError) {
        console.error('Failed to decode eSewa response:', decodeError.message);
        logSecurityEvent('PAYMENT_DECODE_ERROR', { ip: req.ip });
        throw new Error("Invalid eSewa response format");
      }
    }

    // Ensure required fields exist
    if (!decodedData.transaction_uuid || !decodedData.signature) {
      throw new Error("Missing transaction_uuid or signature in eSewa response");
    }

    // 1. Verify Signature
    const isValidSignature = verifyEsewaPayment(decodedData);
    if (!isValidSignature) {
      logSecurityEvent('PAYMENT_SIGNATURE_INVALID', { transactionId: decodedData.transaction_uuid, ip: req.ip });
      throw new Error("Invalid Signature detected");
    }

    // 2. Find Appointment
    const appointment = await Appointment.findOne({ 
      'paymentResult.transactionId': decodedData.transaction_uuid 
    }).session(session)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name')
    .populate('departmentId', 'name')
    .populate('serviceId', 'name');

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // 3. Update appointment payment status
    appointment.paymentStatus = 'paid';
    appointment.status = 'booked';
    appointment.paymentResult.status = 'completed';
    appointment.paymentResult.paidAt = new Date();
    
    await appointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 4. Send confirmation email
    try {
      await sendAppointmentConfirmationEmail(appointment.patientId.email, {
        appointmentNumber: appointment.appointmentNumber,
        doctorName: appointment.doctorId.name,
        departmentName: appointment.departmentId.name,
        serviceName: appointment.serviceId.name,
        scheduledAt: appointment.scheduledAt,
        consultationFee: appointment.consultationFee
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    logSecurityEvent('APPOINTMENT_PAYMENT_SUCCESS', {
      appointmentId: appointment._id,
      patientId: appointment.patientId._id,
      transactionId: decodedData.transaction_uuid,
      amount: appointment.consultationFee,
      ip: req.ip
    });

    // 5. Redirect to Frontend Success Page
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?appointmentId=${appointment._id}`);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Payment success callback error:', error.message);
    logSecurityEvent('PAYMENT_CALLBACK_ERROR', {
      error: error.message,
      ip: req.ip
    });
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  }
};

// @desc    eSewa payment failure callback
// @route   GET /api/payments/esewa/failure
// @route   POST /api/payments/esewa/failure
exports.esewaFailure = async (req, res) => {
  try {
    // Handle both GET and POST
    const responseData = req.query || req.body;
    let transaction_uuid = responseData.transaction_uuid;

    // Decode eSewa base64 data if present
    if (responseData.data) {
      try {
        const buff = Buffer.from(responseData.data, 'base64');
        const decoded = JSON.parse(buff.toString('utf-8'));
        transaction_uuid = decoded.transaction_uuid;
      } catch (decodeError) {
        console.error('Failed to decode eSewa failure response:', decodeError.message);
      }
    }

    if (transaction_uuid) {
      await Appointment.findOneAndUpdate(
        { 'paymentResult.transactionId': transaction_uuid },
        { paymentStatus: 'unpaid', status: 'pending_payment' }
      );
      
      logSecurityEvent('APPOINTMENT_PAYMENT_FAILED', {
        transactionId: transaction_uuid,
        ip: req.ip
      });
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  } catch (error) {
    console.error('Payment failure callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  }
};

// @desc    Verify payment status (Frontend polling)
exports.verifyPayment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ 
          _id: req.params.appointmentId, 
          patientId: req.user._id 
        });
        if(!appointment) return res.status(404).json({success:false});
        res.json({
            success:true, 
            data: { 
                paymentStatus: appointment.paymentStatus,
                status: appointment.status 
            }
        });
    } catch(e) { 
        res.status(500).json({success:false});
    }
};














































