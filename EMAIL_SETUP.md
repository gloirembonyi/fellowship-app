# Email Configuration Guide

## Quick Setup for OTP Emails

To fix the OTP email delivery issues, you need to configure your email settings. Here are the steps:

### Option 1: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Create a `.env` file** in your project root with:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=Your Name <your-email@gmail.com>
EMAIL_SECURE=false
```

### Option 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Your Name <your-email@outlook.com>
EMAIL_SECURE=false
```

### Option 3: Custom SMTP Server

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Your App <noreply@yourdomain.com>
EMAIL_SECURE=false
```

## Current Fallback

If email sending fails, the OTP code is logged to the console for development purposes. Check the terminal output for the OTP code.

## Troubleshooting

1. **Check spam folder** - OTP emails might be filtered
2. **Verify email address** - Ensure the email is correct
3. **Check email server settings** - Some servers have specific requirements
4. **Use App Passwords** - Don't use your regular password for Gmail

## Development Mode

In development mode, OTP codes are always logged to the console, so you can login even if email fails.


