# Email Notification System

This document explains how the email notification system works in the Affiliate Fellowship Program application.

## Overview

The application sends email notifications to applicants at two key moments:

1. When they submit a new application
2. When an administrator updates the status of their application

## Configuration

Email settings are configured in the `.env` file:

```
# Email configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_APP_PASSWORD="your-app-password"
EMAIL_FROM="Ministry of Health <your-email@gmail.com>"
```

You need to replace these values with your actual Gmail account and app password.

## How to Set Up Gmail App Password

1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. At the bottom, click on "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Enter a name (e.g., "Affiliate Fellowship Program")
6. Click "Generate" to get your app password
7. Copy the generated password to your `.env` file

## Email Templates

The emails include:

- Rwanda coat of arms logo
- Ministry of Health header
- Status-specific messaging
- Color-coded status indicator
- Contact information
- Footer with copyright information

## Status-Specific Messages

Different messages are sent based on the application status:

- **Pending**: "We have received your application and it is currently under review."
- **Approved**: "Congratulations! Your application has been approved."
- **Rejected**: "Thank you for your interest. Unfortunately, your application was not selected at this time."

## Testing the Email Service

You can test the email service by running:

```bash
npm run test-email
```

This will send test emails for each status type to the test email address specified in the script.

## Implementation Details

The email functionality is implemented in the following files:

- `lib/emailService.ts`: Contains the core email sending functionality
- `app/api/applications/route.ts`: Sends emails when new applications are submitted
- `app/api/applications/update-status/route.ts`: Sends emails when application status is updated

## Troubleshooting

If emails are not being sent:

1. Check that your Gmail app password is correct
2. Ensure your Gmail account has "Less secure app access" enabled or is properly set up for app passwords
3. Check the server logs for any error messages related to email sending
4. Verify that the application has the correct email address for the applicant
