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

export interface EmailMetadata {
  dept?: string;
  pos?: string;
  topic: string;
  action: string;
  level?: string;
  /** The frontend base URL used to build links in email CTAs (e.g. https://oneportal.centrika.rw) */
  appUrl?: string;
  /** The recipient's email address — appended to email CTA links so the frontend can validate session ownership */
  recipientEmail?: string;
}

export function formatEmailSubject(meta: EmailMetadata) {
  const { dept = "SYSTEM", pos = "N/A", topic, action, level = "NORMAL" } = meta;
  return `CTK-${dept.toUpperCase()}-${pos.toUpperCase()}-${topic}-${action}-${level.toUpperCase()}`;
}

/**
 * Builds a URL with the recipient's email appended as a query parameter.
 * This allows the frontend to verify that the logged-in user matches the
 * intended recipient of the email, preventing session hijacking via shared links.
 */
export function buildLink(url: string, recipientEmail?: string): string {
  if (!recipientEmail) return url;
  const encoded = encodeURIComponent(recipientEmail);
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}email=${encoded}`;
}

// Email templates
export const emailTemplates = {
  welcomeEmail: (name: string, email: string, meta: EmailMetadata, password?: string) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const loginLink = buildLink(`${appUrl}/login`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
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
            • <a href="${loginLink}" style="color: #667eea; text-decoration: none;">Login to Portal</a><br>
            • <a href="${appUrl}/help" style="color: #667eea; text-decoration: none;">Help &amp; Support</a>
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
    });
  },

  passwordResetEmail: (name: string, resetLink: string, meta: EmailMetadata) => ({
    subject: formatEmailSubject(meta),
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

  passwordChangedEmail: (name: string, meta: EmailMetadata) => ({
    subject: formatEmailSubject(meta),
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

  otpEmail: (name: string, code: string, meta: EmailMetadata, expiryMinutes: number = 10) => ({
    subject: formatEmailSubject(meta),
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

  magicLinkEmail: (name: string, magicLink: string, meta: EmailMetadata) => ({
    subject: formatEmailSubject(meta),
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

  mfaSetupEmail: (name: string, code: string, meta: EmailMetadata) => ({
    subject: formatEmailSubject(meta),
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

  leaveRequestSubmittedEmail: (employeeName: string, hodName: string, requestNumber: string, startDate: string, endDate: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const reviewLink = buildLink(`${appUrl}/approvals`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
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
            <a href="${reviewLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
    });
  },

  leaveRequestApprovedEmail: (employeeName: string, approverName: string, requestNumber: string, startDate: string, endDate: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const viewLink = buildLink(`${appUrl}/requests`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
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
            <a href="${viewLink}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
    });
  },

  leaveRequestRejectedEmail: (employeeName: string, approverName: string, requestNumber: string, reason: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const viewLink = buildLink(`${appUrl}/requests`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
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
            <a href="${viewLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
    });
  },

  userInvitationEmail: (name: string, email: string, inviteLink: string, invitedBy: string, meta: EmailMetadata) => ({
    subject: formatEmailSubject(meta),
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
            <strong>Need help?</strong> Contact your HR department or visit our <a href="${(meta.appUrl ?? ENV.appUrl).replace(/\/$/, "")}/help" style="color: #667eea; text-decoration: none;">Help Center</a>
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
    approvalDate: string,
    meta: EmailMetadata
  ) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const viewLink = buildLink(`${appUrl}/approvals`, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
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
            <a href="${viewLink}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
    });
  },

  requestSubmittedEmail: (approverName: string, employeeName: string, requestType: string, requestNumber: string, detailsHtml: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const reviewLink = buildLink(`${appUrl}/approvals`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
          <h1>New Request Awaiting Approval</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${approverName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>${employeeName}</strong> has submitted a new <strong>${requestType}</strong> request that requires your approval.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #667eea; margin-top: 0;">Request Summary (#${requestNumber})</h3>
            ${detailsHtml}
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6;">
            Please log in to Centrika OnePortal to review and approve or reject this request.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Review Request
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
    });
  },

  requestApprovedEmail: (employeeName: string, approverName: string, requestType: string, requestNumber: string, detailsHtml: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const viewLink = buildLink(`${appUrl}/requests`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px; color: white; text-align: center;">
          <h1>✓ Request Approved</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${employeeName}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your ${requestType} request has been <strong style="color: #28a745;">APPROVED</strong> by <strong>${approverName}</strong>.
          </p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Approved Details (#${requestNumber})</h3>
            ${detailsHtml}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewLink}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Request
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
    });
  },

  requestRejectedEmail: (employeeName: string, approverName: string, requestType: string, requestNumber: string, reason: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const viewLink = buildLink(`${appUrl}/requests`, meta.recipientEmail);
    return ({
      subject: formatEmailSubject(meta),
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px; color: white; text-align: center;">
          <h1>Request Rejected</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${employeeName}</strong>,</p>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your ${requestType} request was unfortunately rejected by <strong>${approverName}</strong>.
          </p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Rejection Details (#${requestNumber})</h3>
            <p style="margin: 8px 0;"><strong>Reason provided:</strong> ${reason || "No specific reason provided."}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Request
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
    });
  },

  observerNotificationEmail: (recipientName: string, employeeName: string, approverName: string, actionType: "APPROVED" | "REJECTED", requestType: string, requestNumber: string, detailsHtml: string, meta: EmailMetadata) => {
    const appUrl = (meta.appUrl ?? ENV.appUrl).replace(/\/$/, "");
    const obsViewLink = buildLink(`${appUrl}/approvals`, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${actionType === "APPROVED" ? "#28a745 0%, #20c997 100%" : "#dc3545 0%, #c82333 100%"}); padding: 40px; color: white; text-align: center;">
          <h1>Request ${actionType}</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">For your records and reporting</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            This is an automated notification that <strong>${employeeName}'s</strong> ${requestType} request was <strong>${actionType.toLowerCase()}</strong> by ${approverName}.
          </p>

          <div style="background: ${actionType === "APPROVED" ? "#e8f5e9" : "#fff3cd"}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${actionType === "APPROVED" ? "#28a745" : "#dc3545"};">
            <h3 style="color: ${actionType === "APPROVED" ? "#28a745" : "#dc3545"}; margin-top: 0;">Request Record (#${requestNumber})</h3>
            ${detailsHtml}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${obsViewLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Request Details
            </a>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
    });
  },

  announcementPostedEmail: (recipientName: string, authorName: string, authorRole: string, announcementTitle: string, announcementContent: string, rawViewLink: string, meta: EmailMetadata) => {
    const viewLink = buildLink(rawViewLink, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); padding: 40px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">📢 New Internal Communication</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Centrika OnePortal</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>${authorName}</strong> (${authorRole}) has shared a new communication on the Centrika OnePortal.
          </p>

          <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #c79d2d;">
            <h3 style="color: #3b6dae; margin-top: 0; font-size: 18px;">${announcementTitle}</h3>
            <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 0;">
              ${announcementContent.length > 300 ? announcementContent.substring(0, 300) + "..." : announcementContent}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewLink}" style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
              View on OnePortal
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
  });
  },

  newCommentEmail: (recipientName: string, commenterName: string, commenterPosition: string, announcementTitle: string, commentContent: string, viewLink: string, meta: EmailMetadata) => {
    const link = buildLink(viewLink, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #c79d2d 0%, #a67c00 100%); padding: 40px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">💬 New Comment Added</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Centrika OnePortal</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>${commenterName}</strong> (${commenterPosition || "Staff"}) has posted a new comment on <strong>"${announcementTitle}"</strong>.
          </p>

          <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b6dae;">
            <p style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 0;">
              ${commentContent.length > 300 ? commentContent.substring(0, 300) + "..." : commentContent}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
              View on OnePortal
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
  });
  },

  newSuggestionEmail: (recipientName: string, roleName: string, suggestionContent: string, viewLink: string, meta: EmailMetadata) => {
    const link = buildLink(viewLink, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #c79d2d 0%, #a67c00 100%); padding: 40px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">📥 Incoming Feedback</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Centrika OnePortal</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A staff member has submitted a new suggestion tagging the <strong>${roleName}</strong> department/role.
          </p>

          <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #c79d2d;">
            <p style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 0; white-space: pre-wrap;">
              ${suggestionContent.length > 300 ? suggestionContent.substring(0, 300) + "..." : suggestionContent}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
              Review in Inbox
            </a>
          </div>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  });
  },

  feedbackReplyEmail: (recipientName: string, replierPosition: string, replyContent: string, viewLink: string, meta: EmailMetadata) => {
    const link = buildLink(viewLink, meta.recipientEmail);
    return ({
    subject: formatEmailSubject(meta),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); padding: 40px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">📩 Feedback Reply</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            <strong>${replierPosition}</strong> has replied to your recent feedback submission.
          </p>

          <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b6dae;">
            <p style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 0; white-space: pre-wrap;">
              ${replyContent.length > 300 ? replyContent.substring(0, 300) + "..." : replyContent}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #3b6dae 0%, #2d5385 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
              View Full Conversation
            </a>
          </div>
        </div>
        <div style="background: #333; padding: 20px; color: white; text-align: center; font-size: 12px;">
          <p>&copy; 2026 Centrika. All rights reserved.</p>
        </div>
      </div>
    `,
  });
  },
};
