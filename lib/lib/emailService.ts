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
const CONTACT_EMAIL = process.env.EMAIL_CONTACT || 'fellowship@moh.gov.rw';

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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38:4000';
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
 * Send status notification email
 */
export async function sendStatusNotification(
  email: string,
  name: string,
  status: StatusType,
  applicationId?: string
): Promise<void> {
  try {
    let subject = 'Your Application Status Update';
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
          const documentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38:4000'}/documents/${applicationId}`;
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