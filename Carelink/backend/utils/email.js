const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email
 */
exports.sendEmail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"Luxaro" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP email
 */
exports.sendOTPEmail = async (to, otp) => {
  const subject = 'Your LUXARO Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; margin: 0;">LUXARO</h1>
      </div>
      <div style="background-color: #1A1A1A; padding: 30px; border-radius: 8px; border: 1px solid #D4AF37;">
        <h2 style="color: #D4AF37; margin-top: 0;">Verification Code</h2>
        <p style="font-size: 16px; line-height: 1.6;">Your verification code is:</p>
        <div style="background-color: #000000; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #D4AF37; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #E5E5E5;">This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #4A4A4A; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `;
  const text = `Your LUXARO verification code is: ${otp}. This code will expire in 10 minutes.`;
  
  return await exports.sendEmail(to, subject, html, text);
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your LUXARO Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; margin: 0;">LUXARO</h1>
      </div>
      <div style="background-color: #1A1A1A; padding: 30px; border-radius: 8px; border: 1px solid #D4AF37;">
        <h2 style="color: #D4AF37; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.6;">Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #D4AF37; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #E5E5E5;">Or copy and paste this link:</p>
        <p style="font-size: 12px; color: #D4AF37; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 12px; color: #4A4A4A; margin-top: 30px;">This link will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  const text = `Reset your password by clicking this link: ${resetUrl}. This link will expire in 10 minutes.`;
  
  return await exports.sendEmail(to, subject, html, text);
};









exports.sendVerificationEmail = async (to, url) => {
  const subject = 'Verify your Clinic Account';
  const html = `
    <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff; border: 1px solid #D4AF37;">
      <h1 style="color: #D4AF37; text-align: center;">Clinic Appointments</h1>
      <div style="background-color: #1a1a1a; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #D4AF37;">Welcome</h2>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <a href="${url}" style="display: inline-block; background-color: #D4AF37; color: #000; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0;">VERIFY ACCOUNT</a>
        <p style="font-size: 12px; color: #888;">This link expires in 24 hours.</p>
      </div>
    </div>
  `;
  return await exports.sendEmail(to, subject, html, `Verify your account here: ${url}`);
};

/**
 * Send appointment confirmation email
 */
exports.sendAppointmentConfirmationEmail = async (to, appointmentData) => {
  const { appointmentNumber, doctorName, departmentName, serviceName, scheduledAt, consultationFee } = appointmentData;
  const scheduledDate = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = 'Appointment Confirmed - Clinic Appointments';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; margin: 0;">Clinic Appointments</h1>
      </div>
      <div style="background-color: #1A1A1A; padding: 30px; border-radius: 8px; border: 1px solid #D4AF37;">
        <h2 style="color: #D4AF37; margin-top: 0;">Appointment Confirmed</h2>
        <p style="font-size: 16px; line-height: 1.6;">Your appointment has been successfully booked!</p>
        
        <div style="background-color: #000000; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Appointment Number:</strong> ${appointmentNumber}</p>
          <p style="margin: 10px 0;"><strong>Doctor:</strong> ${doctorName}</p>
          <p style="margin: 10px 0;"><strong>Department:</strong> ${departmentName}</p>
          <p style="margin: 10px 0;"><strong>Service:</strong> ${serviceName}</p>
          <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${scheduledDate}</p>
          <p style="margin: 10px 0;"><strong>Consultation Fee:</strong> Rs. ${consultationFee}</p>
        </div>
        
        <p style="font-size: 14px; color: #E5E5E5;">Please arrive 10 minutes before your scheduled time.</p>
        <p style="font-size: 12px; color: #4A4A4A; margin-top: 30px;">If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
      </div>
    </div>
  `;
  const text = `Your appointment has been confirmed!\n\nAppointment Number: ${appointmentNumber}\nDoctor: ${doctorName}\nDepartment: ${departmentName}\nService: ${serviceName}\nDate & Time: ${scheduledDate}\nConsultation Fee: Rs. ${consultationFee}\n\nPlease arrive 10 minutes before your scheduled time.`;
  
  return await exports.sendEmail(to, subject, html, text);
};



