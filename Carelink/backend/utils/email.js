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
      from: `"Carelink" <${process.env.EMAIL_USER}>`,
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
  const subject = 'Your Carelink Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; margin: 0;">Carelink</h1>
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
  const text = `Your Carelink verification code is: ${otp}. This code will expire in 10 minutes.`;
  
  return await exports.sendEmail(to, subject, html, text);
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your Carelink Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000; color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; margin: 0;">Carelink</h1>
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


// wherever your email utils live (e.g., backend/utils/email.js)

exports.sendVerificationEmail = async (to, verifyUrl) => {
  const subject = "Verify your Clinic Account";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#F3F7F5;font-family:Arial, Helvetica, sans-serif;color:#123;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F7F5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6EFEA;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:linear-gradient(90deg,#1AAE5A 0%, #22C55E 50%, #16A34A 100%);height:8px;line-height:8px;font-size:0;">
              &nbsp;
            </td>
          </tr>

          <tr>
            <td style="padding:26px 28px 10px 28px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:12px;background:#EAF7EF;border:1px solid #CDEEDB;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:22px;line-height:1;">🩺</span>
                </div>
                <div>
                  <div style="font-weight:800;font-size:18px;color:#0F172A;">CareLink Clinic</div>
                  <div style="font-size:13px;color:#16A34A;font-weight:700;">Secure Account Verification</div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 28px 8px 28px;">
              <h1 style="margin:0;font-size:22px;color:#0F172A;letter-spacing:-0.2px;">
                Verify your email address
              </h1>
              <p style="margin:12px 0 0 0;font-size:14.5px;line-height:1.6;color:#334155;">
                Thanks for signing up with <strong>CareLink Clinic</strong>. Please confirm your email to activate your account.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 10px 28px;">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#16A34A;color:#FFFFFF;text-decoration:none;font-weight:800;
                        padding:12px 18px;border-radius:12px;font-size:14.5px;box-shadow:0 10px 18px rgba(22,163,74,0.22);">
                Verify Email
              </a>

              <p style="margin:14px 0 0 0;font-size:12.5px;line-height:1.6;color:#64748B;">
                If the button doesn’t work, copy and paste this URL into your browser:
              </p>

              <div style="margin-top:10px;padding:12px 12px;border-radius:12px;background:#F6FFFA;border:1px dashed #BFE6CD;">
                <div style="font-size:12px;color:#0F172A;word-break:break-all;">
                  ${verifyUrl}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 26px 28px;color:#64748B;font-size:12px;line-height:1.6;">
              <div style="border-top:1px solid #E6EFEA;padding-top:14px;">
                <div style="margin-bottom:6px;">If you didn’t create this account, ignore this email.</div>
                <div style="color:#94A3B8;">© ${new Date().getFullYear()} CareLink Clinic</div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `Verify your CareLink Clinic account: ${verifyUrl}`;

  return await exports.sendEmail(to, subject, html, text);
};



