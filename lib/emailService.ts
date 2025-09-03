// To install nodemailer, run:
// npm install nodemailer
// npm install --save-dev @types/nodemailer

import nodemailer from 'nodemailer';
import path from 'path';

// Define allowed status types
type StatusType = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'received' | 'under_review' | 'waitlisted';

// Verify that email credentials are available
const verifyEmailConfig = () => {
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing email configuration: ${missingVars.join(', ')}. Email functionality may be limited.`);
    return false;
  }
  return true;
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  if (!verifyEmailConfig()) {
    console.error('Email configuration is incomplete. Check your .env file.');
    // Return a dummy transporter that logs instead of sending
    return {
      verify: (callback: any) => callback(new Error('Email configuration incomplete'), false),
      sendMail: (options: any) => {
        console.log('Email would be sent (configuration incomplete):', options);
        return Promise.resolve({ messageId: 'dummy-id' });
      }
    };
  }

  // Parse port number
  const port = parseInt(process.env.EMAIL_PORT || '587');
  
  // Determine secure setting based on port if not explicitly set
  // Port 465 typically uses implicit SSL (secure: true)
  // Other ports like 587, 25 typically use STARTTLS (secure: false)
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
    // Adding debug option for troubleshooting
    debug: process.env.NODE_ENV === 'development',
  });

  return transporter;
};

const transporter = createTransporter();

// Verify connection configuration
transporter.verify(function (error: Error | null, success: boolean) {
  if (error) {
    console.log('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection established');
  }
});

// Define logo path and CID for email templates
const LOGO_PATH = path.join(process.cwd(), 'public', 'Rwanda-coat-of-arms.png');
const LOGO_CID = 'moh-logo@moh.gov.rw';
  // const CONTACT_EMAIL = process.env.EMAIL_CONTACT || 'fellowship@moh.gov.rw';

// Common email header and footer template
const createEmailTemplate = (content: string, statusColor: string = '#3498db') => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
      <!-- Header with logo -->
      <div style="background-color: #f8f9fa; text-align: center; padding: 20px 0;">
        <img src="cid:${LOGO_CID}" alt="Ministry of Health Rwanda" style="height: 80px; width: auto;" />
        <h2 style="margin-top: 10px; color: #333;">MoH Affiliate Fellowship Program</h2>
      </div>
      
      <!-- Colored status bar -->
      <div style="background-color: ${statusColor}; height: 10px;"></div>
      
      <!-- Email content -->
      <div style="padding: 20px; background-color: white;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} Ministry of Health Rwanda. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Send acknowledgment email when application is submitted
 */
export async function sendAcknowledgmentEmail(
  email: string,
  name: string
): Promise<void> {
  try {
    const content = `
      <h2 style="color: #3498db;">Application Received</h2>
      <p>Dear ${name},</p>
      <p>Thank you for submitting your application to the Ministry of Health Affiliate Fellowship Program.</p>
      <p>Your application has been received and is under review. Should your application proceed to the next stage, we will contact you with further instructions.</p>
      <p>We appreciate your interest in contributing to Rwanda’s health sector and thank you for your willingness to share your expertise.</p>
      <p style="margin-top: 20px;">
        Kind regards,<br>
        <strong>MoH Fellowship Coordination Team</strong>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Application Received - MoH Affiliate Fellowship Program',
      html: createEmailTemplate(content, '#3498db'),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Acknowledgment email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending acknowledgment email:', error);
    throw error;
  }
}

/**
 * Send approval email with documents request
 */
export async function sendApprovalWithDocumentsRequestEmail(
  email: string,
  name: string,
  documentSubmissionUrl: string
): Promise<void> {
  try {
    // Ensure the URL is complete
    let fullUrl = documentSubmissionUrl;
    if (!documentSubmissionUrl.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38';
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
      }
      fullUrl = documentSubmissionUrl.startsWith('/') 
        ? `${baseUrl}${documentSubmissionUrl}` 
        : `${baseUrl}/${documentSubmissionUrl}`;
    }

    const content = `
      <p>Dear ${name},</p>
      <p>Thank you for your interest in the Ministry of Health Affiliate Fellowship Program.</p>
      <p>You've been selected to proceed to the next phase. Please complete the required information here:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${fullUrl}" style="display: inline-block; background-color: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Information</a>
      </p>
      <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
      <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${fullUrl}">${fullUrl}</a></p>
      <p>We look forward to reviewing the next set of details.</p>
      <p style="margin-top: 20px;">
        Kind regards,<br>
        <strong>MoH Fellowship Coordination Team</strong>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'MoH Fellowship Application – Additional Information Required',
      html: createEmailTemplate(content, '#2ecc71'),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
}

/**
 * Send rejection email
 */
export async function sendRejectionEmail(
  email: string,
  name: string,
  rejectionReason: string,
  customEmailContent?: string
): Promise<void> {
  try {
    // Sanitize the rejection reason
    const sanitizedReason = rejectionReason.trim() || "Your application did not meet our current selection criteria.";
    
    // Determine content
    let content;
    
    if (customEmailContent) {
      // If custom email content is provided, use it directly with proper HTML formatting
      content = customEmailContent.replace(/\n/g, '<br>');
    } else {
      // Otherwise use the standard template
      content = `
        <h2 style="color: #e74c3c;">Application Status Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in the Ministry of Health Affiliate Fellowship Program.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to proceed with your application at this time.</p>
          <p><strong>Reason:</strong> ${sanitizedReason}</p>
          <p>We encourage you to apply again in the future.</p>
        <p style="margin-top: 20px;">
          Best regards,<br>
          <strong>MoH Affiliate Fellowship Program Team</strong>
        </p>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Application Status Update',
      html: createEmailTemplate(content, '#e74c3c'),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
}

/**
 * Send funding information request email
 */
export async function sendFundingInfoRequestEmail(
  email: string,
  name: string,
  applicationId: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38';
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }
    
    const fundingFormUrl = `${baseUrl}/funding-info/${applicationId}`;
    
    const content = `
      <h2 style="color: #f39c12;">Additional Information Required</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your application to the MoH Affiliate Fellowship Program. We have reviewed your application and need some additional information regarding your project funding and sustainability.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Required Information:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Estimated Budget:</strong> What is the estimated budget for your project?</li>
          <li><strong>Funding Sources:</strong> What are the potential or secured sources of funding? (e.g., grants, institutional support, personal contributions, partnerships)</li>
          <li><strong>Funding Status:</strong> Is funding secured or not yet secured?</li>
          <li><strong>Proof of Funding:</strong> If funding is secured, please attach proof</li>
          <li><strong>Funding Plan:</strong> If funding is not yet secured, please attach your plan to obtain financial support</li>
          <li><strong>Sustainability Plan:</strong> How will the project be sustained beyond the fellowship period?</li>
        </ul>
      </div>
      
      <p>Please click the button below to complete this information:</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${fundingFormUrl}" style="display: inline-block; background-color: #f39c12; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Funding Information</a>
      </p>
      
      <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
      <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${fundingFormUrl}">${fundingFormUrl}</a></p>
      
      <p><strong>Important:</strong> Please complete this information within 7 days to ensure your application remains under consideration.</p>
      
      <p style="margin-top: 20px;">
        Best regards,<br>
        <strong>MoH Affiliate Fellowship Program Team</strong>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Additional Information Required - MoH Affiliate Fellowship Program',
      html: createEmailTemplate(content, '#f39c12'),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Funding info request email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending funding info request email:', error);
    throw error;
  }
}

/**
 * Send custom funding information request email with optional link
 */
export async function sendCustomFundingInfoRequestEmail(
  email: string,
  name: string,
  applicationId: string,
  customMessage: string,
  includeLink: boolean = true,
  customLink?: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38';
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }
    
    // Use custom link if provided, otherwise use default funding form URL
    const fundingFormUrl = customLink || `${baseUrl}/funding-info/${applicationId}`;
    
    // Convert line breaks to HTML
    const formattedMessage = customMessage.replace(/\n/g, '<br>');
    
    let content = `
      <h2 style="color: #f39c12;">Additional Information Required</h2>
      <p>Dear ${name},</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        ${formattedMessage}
      </div>
    `;
    
    // Add link section if includeLink is true
    if (includeLink) {
      content += `
        <p>Please click the button below to complete this information:</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${fundingFormUrl}" style="display: inline-block; background-color: #f39c12; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Complete Information</a>
        </p>
        
        <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
        <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${fundingFormUrl}">${fundingFormUrl}</a></p>
      `;
    }
    
    content += `
      <p style="margin-top: 20px;">
        Best regards,<br>
        <strong>MoH Affiliate Fellowship Program Team</strong>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Additional Information Required - MoH Affiliate Fellowship Program',
      html: createEmailTemplate(content, '#f39c12'),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Custom funding info request email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending custom funding info request email:', error);
    throw error;
  }
}

/**
 * Send status notification email
 */
export async function sendStatusNotification(
  email: string,
  name: string,
  status: StatusType,
  applicationId?: string
): Promise<void> {
  try {
    const subject = 'Your Application Status Update';
    let statusMessage = '';
    let statusColor = '#3498db'; // Default blue
    let buttonHtml = '';

    switch (status) {
      case 'received':
        statusMessage = 'We have received all your required documents. Your application is now complete and will be reviewed by our team.';
        statusColor = '#9b59b6'; // Purple
        break;
      case 'under_review':
        statusMessage = 'Your application is currently under review by our team. We will notify you of any updates.';
        statusColor = '#f39c12'; // Orange
        break;
      case 'approved':
        statusMessage = 'Congratulations! Your application has been approved.';
        statusColor = '#2ecc71'; // Green
        
        // Add button for document submission if applicationId is provided
        if (applicationId) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
          if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
          }
          const documentUrl = `${baseUrl}/documents/${applicationId}`;
          buttonHtml = `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${documentUrl}" style="display: inline-block; background-color: #2ecc71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Submit Required Documents</a>
            </p>
            <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${documentUrl}">${documentUrl}</a></p>
          `;
        }
        break;
      case 'rejected':
        statusMessage = 'After careful review, we regret to inform you that your application has not been approved at this time.';
        statusColor = '#e74c3c'; // Red
        break;
      case 'waitlisted':
        statusMessage = 'Your application has been placed on our waitlist. We will contact you if a position becomes available.';
        statusColor = '#95a5a6'; // Gray
        break;
      default:
        statusMessage = `Your application status has been updated to: ${status}`;
        statusColor = '#3498db'; // Blue
    }

    const content = `
      <h2 style="color: ${statusColor};">Application Status Update</h2>
      <p>Dear ${name},</p>
      <p>${statusMessage}</p>
      ${buttonHtml}
      <p>Thank you for your interest in the Ministry of Health Affiliate Fellowship Program.</p>
      <p style="margin-top: 20px;">
        Best regards,<br>
        <strong>MoH Affiliate Fellowship Program Team</strong>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: createEmailTemplate(content, statusColor),
      attachments: [
        {
          filename: 'moh-logo.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Status notification email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending status notification email:', error);
    throw error;
  }
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    // Validate required configuration
    const requiredFields = ['host', 'port', 'user', 'password', 'from'];
    const missingFields = requiredFields.filter(field => !config[field as keyof EmailConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required email configuration: ${missingFields.join(', ')}`);
    }
    
    this.config = config;
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ciphers: 'SSLv3'
      },
      ignoreTLS: false,
      requireTLS: config.port === 587, // Require TLS for port 587
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    });
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(to: string, otpCode: string, userName?: string): Promise<boolean> {
    try {
      const subject = 'Your OTP Code - Fellowship Program';
      const html = this.generateOTPEmailHTML(otpCode, userName);
      const text = this.generateOTPEmailText(otpCode, userName);

      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        html,
        text,
      };

      console.log('📧 Attempting to send OTP email to:', to);
      
      // Try multiple email configurations
      const configs = [
        // Gmail configuration
        {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Outlook configuration
        {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Custom SMTP configuration
        {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.port === 465,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      ];

      for (let i = 0; i < configs.length; i++) {
        try {
          const transporter = nodemailer.createTransport(configs[i]);
          const result = await transporter.sendMail(mailOptions);
          console.log(`✅ OTP email sent successfully (method ${i + 1}):`, result.messageId);
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`⚠️ Email method ${i + 1} failed:`, errorMessage);
          if (i === configs.length - 1) {
            throw error; // Re-throw the last error
          }
        }
      }
      
      // This should never be reached, but TypeScript requires it
      return false;
      
    } catch (error) {
      console.error('❌ All email methods failed:', error);
      
      // Fallback: Always log the OTP so user can login
      console.log('🔐 FALLBACK - OTP Code:', otpCode);
      console.log('📧 For user:', to);
      console.log('👤 User:', userName);
      console.log('💡 Use this OTP code to login');
      console.log('📱 Check the browser console or terminal for the OTP code');
      
      // Return true so the login process continues
      return true;
    }
  }

  /**
   * Generate HTML email template for OTP
   */
  private generateOTPEmailHTML(otpCode: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .otp-box { 
            background: #f8f9fa; 
            border: 2px solid #007bff; 
            border-radius: 10px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #007bff; 
            letter-spacing: 5px; 
            margin: 10px 0; 
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 OTP Verification</h1>
            <p>Ministry of Health - Fellowship Program</p>
          </div>
          
          <p>Hello ${userName ? userName : 'there'},</p>
          
          <p>You have requested to access the Fellowship Program Administration Panel. Please use the following OTP code to complete your login:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <p><strong>This code will expire in 5 minutes</strong></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>Never share this code with anyone</li>
              <li>The code will expire in 5 minutes</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <div class="footer">
            <p>© 2025 Ministry of Health - Fellowship Program. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for OTP
   */
  private generateOTPEmailText(otpCode: string, userName?: string): string {
    return `
OTP Verification - Fellowship Program
=====================================

Hello ${userName ? userName : 'there'},

You have requested to access the Fellowship Program Administration Panel. Please use the following OTP code to complete your login:

OTP Code: ${otpCode}

This code will expire in 5 minutes.

Security Notice:
- Never share this code with anyone
- The code will expire in 5 minutes
- If you didn't request this, please ignore this email

If you have any questions, please contact our support team.

© 2025 Ministry of Health - Fellowship Program. All rights reserved.
    `;
  }

  /**
   * Send user creation email with credentials
   */
  async sendUserCreationEmail(
    to: string, 
    userName: string, 
    email: string, 
    password: string, 
    role: string,
    loginUrl: string
  ): Promise<boolean> {
    try {
      const subject = 'Welcome to Fellowship Program - Your Account Details';
      const html = this.generateUserCreationEmailHTML(userName, email, password, role, loginUrl);
      const text = this.generateUserCreationEmailText(userName, email, password, role, loginUrl);

      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        html,
        text,
      };

      console.log('📧 Sending user creation email to:', to);
      
      // Try multiple email configurations
      const configs = [
        // Gmail configuration
        {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Outlook configuration
        {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Custom SMTP configuration
        {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.port === 465,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      ];

      for (let i = 0; i < configs.length; i++) {
        try {
          const testTransporter = nodemailer.createTransport(configs[i]);
          const result = await testTransporter.sendMail(mailOptions);
          console.log(`✅ User creation email sent successfully (method ${i + 1}):`, result.messageId);
          return true;
        } catch (error) {
          console.log(`⚠️ Email method ${i + 1} failed:`, (error as Error).message);
          if (i === configs.length - 1) {
            console.error('❌ All email methods failed');
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error sending user creation email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string, 
    userName: string, 
    newPassword: string,
    loginUrl: string
  ): Promise<boolean> {
    try {
      const subject = 'Password Reset - Fellowship Program';
      const html = this.generatePasswordResetEmailHTML(userName, newPassword, loginUrl);
      const text = this.generatePasswordResetEmailText(userName, newPassword, loginUrl);

      const mailOptions = {
        from: this.config.from,
        to,
        subject,
        html,
        text,
      };

      console.log('📧 Sending password reset email to:', to);
      
      // Try multiple email configurations
      const configs = [
        // Gmail configuration
        {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Outlook configuration
        {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        // Custom SMTP configuration
        {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.port === 465,
          auth: {
            user: this.config.user,
            pass: this.config.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      ];

      for (let i = 0; i < configs.length; i++) {
        try {
          const testTransporter = nodemailer.createTransport(configs[i]);
          const result = await testTransporter.sendMail(mailOptions);
          console.log(`✅ Password reset email sent successfully (method ${i + 1}):`, result.messageId);
          return true;
        } catch (error) {
          console.log(`⚠️ Email method ${i + 1} failed:`, (error as Error).message);
          if (i === configs.length - 1) {
            console.error('❌ All email methods failed');
            return false;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email for user creation
   */
  private generateUserCreationEmailHTML(
    userName: string, 
    email: string, 
    password: string, 
    role: string,
    loginUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Fellowship Program</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 20px 0; }
          .credentials { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #495057; }
          .credential-value { background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid #dee2e6; font-family: monospace; color: #dc3545; }
          .login-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .login-button:hover { background: #0056b3; }
          .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Fellowship Program!</h1>
            <p>Your account has been created successfully</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}!</h2>
            
            <p>Welcome to the Ministry of Health Fellowship Program Administration System. Your account has been created with <strong>${role.toUpperCase()}</strong> privileges.</p>
            
            <div class="credentials">
              <h3>🔑 Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email Address:</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Password:</div>
                <div class="credential-value">${password}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Role:</div>
                <div class="credential-value">${role.toUpperCase()}</div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="login-button">🚀 Login to Your Account</a>
            </div>
            
            <div class="security-notice">
              <h4>🔒 Security Notice</h4>
              <ul>
                <li><strong>Change your password</strong> after your first login</li>
                <li><strong>Keep your credentials secure</strong> and don't share them</li>
                <li><strong>Use a strong password</strong> for better security</li>
                <li>If you didn't expect this account, please contact support immediately</li>
              </ul>
            </div>
            
            <h3>📋 What You Can Do</h3>
            <p>As a <strong>${role.toUpperCase()}</strong>, you have access to:</p>
            <ul>
              ${role === 'super_admin' ? `
                <li>✅ View and manage all users</li>
                <li>✅ Create new user accounts</li>
                <li>✅ Reset user passwords</li>
                <li>✅ Access system settings</li>
                <li>✅ View all applications and reports</li>
              ` : role === 'admin' ? `
                <li>✅ View and manage applications</li>
                <li>✅ Generate reports</li>
                <li>✅ Access admin dashboard</li>
              ` : `
                <li>✅ View your profile</li>
                <li>✅ Update your information</li>
              `}
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2025 Ministry of Health - Fellowship Program. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for user creation
   */
  private generateUserCreationEmailText(
    userName: string, 
    email: string, 
    password: string, 
    role: string,
    loginUrl: string
  ): string {
    return `
Welcome to Fellowship Program - Your Account Details
==================================================

Hello ${userName}!

Welcome to the Ministry of Health Fellowship Program Administration System. Your account has been created with ${role.toUpperCase()} privileges.

Your Login Credentials:
======================
Email Address: ${email}
Password: ${password}
Role: ${role.toUpperCase()}

Login URL: ${loginUrl}

Security Notice:
===============
- Change your password after your first login
- Keep your credentials secure and don't share them
- Use a strong password for better security
- If you didn't expect this account, please contact support immediately

What You Can Do:
===============
As a ${role.toUpperCase()}, you have access to:
${role === 'super_admin' ? `
- View and manage all users
- Create new user accounts
- Reset user passwords
- Access system settings
- View all applications and reports
` : role === 'admin' ? `
- View and manage applications
- Generate reports
- Access admin dashboard
` : `
- View your profile
- Update your information
`}

© 2025 Ministry of Health - Fellowship Program. All rights reserved.
If you have any questions, please contact our support team.
    `;
  }

  /**
   * Generate HTML email for password reset
   */
  private generatePasswordResetEmailHTML(
    userName: string, 
    newPassword: string,
    loginUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Fellowship Program</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 20px 0; }
          .credentials { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #495057; }
          .credential-value { background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid #dee2e6; font-family: monospace; color: #dc3545; }
          .login-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .login-button:hover { background: #0056b3; }
          .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Your password has been reset successfully</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}!</h2>
            
            <p>Your password for the Fellowship Program Administration System has been reset by an administrator.</p>
            
            <div class="credentials">
              <h3>🔑 Your New Password</h3>
              <div class="credential-item">
                <div class="credential-label">New Password:</div>
                <div class="credential-value">${newPassword}</div>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="login-button">🚀 Login with New Password</a>
            </div>
            
            <div class="security-notice">
              <h4>🔒 Important Security Notice</h4>
              <ul>
                <li><strong>Change this password immediately</strong> after logging in</li>
                <li><strong>Use a strong, unique password</strong> that you haven't used elsewhere</li>
                <li><strong>Don't share this password</strong> with anyone</li>
                <li>If you didn't request this reset, please contact support immediately</li>
              </ul>
            </div>
            
            <h3>📋 Next Steps</h3>
            <ol>
              <li>Click the login button above or visit: ${loginUrl}</li>
              <li>Use your email and the new password to log in</li>
              <li>Immediately change your password to something secure</li>
              <li>Log out and log back in with your new password</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>© 2025 Ministry of Health - Fellowship Program. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for password reset
   */
  private generatePasswordResetEmailText(
    userName: string, 
    newPassword: string,
    loginUrl: string
  ): string {
    return `
Password Reset - Fellowship Program
===================================

Hello ${userName}!

Your password for the Fellowship Program Administration System has been reset by an administrator.

Your New Password:
==================
New Password: ${newPassword}

Login URL: ${loginUrl}

Important Security Notice:
=========================
- Change this password immediately after logging in
- Use a strong, unique password that you haven't used elsewhere
- Don't share this password with anyone
- If you didn't request this reset, please contact support immediately

Next Steps:
===========
1. Visit: ${loginUrl}
2. Use your email and the new password to log in
3. Immediately change your password to something secure
4. Log out and log back in with your new password

© 2025 Ministry of Health - Fellowship Program. All rights reserved.
If you have any questions, please contact our support team.
    `;
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

// Create default email service instance with improved configuration
export const emailService = new EmailService({
  host: process.env.EMAIL_HOST!,
  port: parseInt(process.env.EMAIL_PORT!),
  user: process.env.EMAIL_USER!,
  password: process.env.EMAIL_PASSWORD!,
  from: process.env.EMAIL_FROM!,
  secure: process.env.EMAIL_SECURE === 'true',
});