import nodemailer from "nodemailer";
import { ENV } from "./env";

// Initialize email transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Use Gmail SMTP or your preferred email service
  // For production, use environment variables
  transporter = nodemailer.createTransport({
    host: ENV.emailHost || "smtp.gmail.com",
    port: parseInt(ENV.emailPort || "587"),
    secure: ENV.emailSecure === "true", // true for 465, false for other ports
    auth: {
      user: ENV.emailUser,
      pass: ENV.emailPassword,
    },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Skip email sending if credentials are not configured
    if (!ENV.emailUser || !ENV.emailPassword) {
      console.warn(`[Email] Email credentials not configured, skipping send to ${to}`);
      return true; // Return true to not block login
    }

    const emailTransporter = getTransporter();

    // Add timeout to prevent hanging
    await Promise.race([
      emailTransporter.sendMail({
        from: ENV.emailFrom || "noreply@centrika.rw",
        to,
        subject,
        html,
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Email send timeout")), 5000)
      )
    ]);

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error: any) {
    console.error("[Email Error Details]:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode
    });
    console.warn("[Email] Send failed (continuing anyway):", error instanceof Error ? error.message : String(error));
    return true; // Return true anyway to not block the login
  }
}

// Email templates
export const emailTemplates = {
  welcomeEmail: (name: string, email: string, password?: string) => ({
    subject: "Welcome to Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>Welcome to Centrika OnePortal</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your account has been successfully created on the Centrika OnePortal system. 
            You can now access all employee services including leave requests, car bookings, and expenditure tracking.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Your Account Details</h3>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            ${password ? `<p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${password}</p>` : ""}
            <p style="font-size: 12px; color: #999; margin-top: 15px;">Please change your password after first login.</p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>Quick Links:</strong><br>
            • <a href="https://centrika.rw/login" style="color: #667eea; text-decoration: none;">Login to Portal</a><br>
            • <a href="https://centrika.rw/help" style="color: #667eea; text-decoration: none;">Help & Support</a>
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  passwordResetEmail: (name: string, resetLink: string) => ({
    subject: "Password Reset Request - Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>Password Reset</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            We received a request to reset your password for your Centrika OnePortal account. 
            Click the button below to reset your password. This link will expire in 15 minutes.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 12px; color: #999; line-height: 1.6;">
            <strong>Or copy this link:</strong><br>
            ${resetLink}
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 30px; line-height: 1.6;">
            If you didn't request this password reset, you can ignore this email. Your account is still secure.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  passwordChangedEmail: (name: string) => ({
    subject: "Password Changed Successfully - Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>Password Changed</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your password has been successfully changed. If you made this change, no further action is needed.
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            If you did not make this change, please contact support immediately at support@centrika.rw
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  otpEmail: (name: string, code: string, expiryMinutes: number = 10) => ({
    subject: "Your Login Code - Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>Your Login Code</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your one-time login code is:
          </p>

          <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #667eea;">
            <h1 style="margin: 0; color: #667eea; letter-spacing: 10px; font-size: 48px; font-weight: bold; font-family: monospace;">${code}</h1>
            <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">Expires in ${expiryMinutes} minutes</p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you did not request this code, please ignore this email. Your account remains secure.
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            <strong>Never share this code with anyone.</strong> Centrika staff will never ask for your code.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  magicLinkEmail: (name: string, magicLink: string) => ({
    subject: "Your Magic Login Link - Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>Secure Login Link</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Click the button below to securely log in to your Centrika OnePortal. This link expires in 15 minutes.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Log In to Portal
            </a>
          </div>

          <p style="font-size: 12px; color: #999; line-height: 1.6;">
            <strong>Or copy this link:</strong><br>
            <code style="background: #e8e8e8; padding: 5px 10px; border-radius: 3px; word-break: break-all;">${magicLink}</code>
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            If you did not request this login link, please ignore this email. Your account is safe.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  mfaSetupEmail: (name: string, code: string) => ({
    subject: "Confirm Your Multi-Factor Authentication - Centrika OnePortal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>MFA Setup Verification</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            You are setting up multi-factor authentication for your Centrika OnePortal account. 
            Enter the code below to verify your email address:
          </p>

          <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #667eea;">
            <h1 style="margin: 0; color: #667eea; letter-spacing: 10px; font-size: 48px; font-weight: bold; font-family: monospace;">${code}</h1>
            <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">Expires in 10 minutes</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            Once verified, your email address will be a trusted method for logging in securely.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  leaveRequestSubmittedEmail: (employeeName: string, hodName: string, requestNumber: string, startDate: string, endDate: string) => ({
    subject: `New Leave Request #${requestNumber} from ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>New Leave Request</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${hodName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            You have received a new leave request from <strong>${employeeName}</strong> that requires your approval.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Request Details</h3>
            <p style="margin: 8px 0;"><strong>Request Number:</strong> ${requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Employee:</strong> ${employeeName}</p>
            <p style="margin: 8px 0;"><strong>Leave Start Date:</strong> ${startDate}</p>
            <p style="margin: 8px 0;"><strong>Leave End Date:</strong> ${endDate}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://centrika.rw/approvals" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review Request
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            Please log in to the Centrika OnePortal to review and approve or reject this leave request.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  leaveRequestApprovedEmail: (employeeName: string, approverName: string, requestNumber: string, startDate: string, endDate: string) => ({
    subject: `Your Leave Request #${requestNumber} Has Been Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px; color: white; text-align: center;">
          <h1>✓ Leave Request Approved</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${employeeName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Great news! Your leave request has been <strong style="color: #28a745;">APPROVED</strong> by <strong>${approverName}</strong>.
          </p>

          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Approved Leave Details</h3>
            <p style="margin: 8px 0;"><strong>Request Number:</strong> ${requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Leave Start Date:</strong> ${startDate}</p>
            <p style="margin: 8px 0;"><strong>Leave End Date:</strong> ${endDate}</p>
            <p style="margin: 8px 0;"><strong>Approved By:</strong> ${approverName}</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            You can now proceed with your leave. Please ensure all handover tasks are completed before your leave date.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://centrika.rw/requests" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Request
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  leaveRequestRejectedEmail: (employeeName: string, approverName: string, requestNumber: string, reason: string) => ({
    subject: `Your Leave Request #${requestNumber} Has Been Rejected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px; color: white; text-align: center;">
          <h1>Leave Request Rejected</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${employeeName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your leave request has been rejected by <strong>${approverName}</strong>.
          </p>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Request Details</h3>
            <p style="margin: 8px 0;"><strong>Request Number:</strong> ${requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Rejected By:</strong> ${approverName}</p>
            <p style="margin: 8px 0;"><strong>Reason:</strong> ${reason || "Not specified"}</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            Please contact your Head of Department if you have any questions about this decision. You can submit a new leave request if needed.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://centrika.rw/requests" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Requests
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  userInvitationEmail: (name: string, email: string, inviteLink: string, invitedBy: string) => ({
    subject: "Welcome to Centrika OnePortal - Complete Your Account Setup",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>You're Invited to Centrika OnePortal</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>${invitedBy}</strong> has invited you to join the Centrika OnePortal system. 
            This is your secure platform for managing leave requests, car bookings, expenditure tracking, and more.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Complete Your Account Setup</h3>
            <p style="font-size: 14px; color: #666; margin: 15px 0;">
              Click the button below to set your password and activate your account. This link is valid for 1 day.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                Set Up Your Account
              </a>
            </div>
            <p style="font-size: 12px; color: #999; text-align: center; margin: 15px 0 0 0;">
              Or copy this link: <br>
              <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; word-break: break-all;">${inviteLink}</code>
            </p>
          </div>

          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0288d1;">
            <h4 style="color: #0288d1; margin-top: 0;">What You Can Do</h4>
            <ul style="font-size: 14px; color: #666; margin: 10px 0; padding-left: 20px;">
              <li>Submit and track leave requests</li>
              <li>Book company vehicles</li>
              <li>Manage expenditure approvals</li>
              <li>View your department calendar</li>
              <li>Access employee directory</li>
            </ul>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            <strong>Security Note:</strong> Never share your password with anyone. Centrika staff will never ask for your password.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 20px; line-height: 1.6;">
            <strong>Need help?</strong> Contact your HR department or visit our <a href="https://centrika.rw/help" style="color: #667eea; text-decoration: none;">Help Center</a>
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  leaveApprovedNotificationEmail: (
    recipientName: string,
    employeeName: string,
    hodName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    daysRequested: number,
    reason: string,
    requestNumber: string,
    approvalDate: string
  ) => ({
    subject: `Leave Approved: ${employeeName} - ${leaveType} Leave (#${requestNumber})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px; color: white; text-align: center;">
          <h1>✓ Leave Request Approved</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">For your records and reporting</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            This is to inform you that a leave request has been <strong style="color: #28a745;">APPROVED</strong> by the Head of Department.
          </p>

          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Approved Leave Details</h3>
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Request Number:</td><td>${requestNumber}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Employee:</td><td>${employeeName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Leave Type:</td><td>${leaveType}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Start Date:</td><td>${startDate}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">End Date:</td><td>${endDate}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Days Requested:</td><td>${daysRequested}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Reason:</td><td>${reason || "Not specified"}</td></tr>
            </table>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
            <h4 style="color: #1976d2; margin-top: 0;">Approval Information</h4>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Approved By:</strong> ${hodName} (Head of Department)</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Approval Date:</strong> ${approvalDate}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://centrika.rw/approval-history" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Approved Request
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
};
