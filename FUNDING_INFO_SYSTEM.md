# Funding Information Collection System

## Overview

This system allows administrators to request additional funding information from applicants who have already submitted their applications. The system includes a professional email notification system and a dedicated form for collecting the missing information.

## Features

### 1. Database Schema Updates
- Added new fields to the `Application` model in `prisma/schema.prisma`:
  - `estimatedBudget`: String - Project budget estimate
  - `fundingSources`: String - Sources of funding
  - `fundingSecured`: String - Whether funding is secured or not
  - `fundingProofUrl`: String - URL to uploaded funding proof document
  - `fundingPlanUrl`: String - URL to uploaded funding plan document
  - `sustainabilityPlan`: String - Project sustainability plan
  - `fundingInfoRequested`: Boolean - Whether funding info was requested
  - `fundingInfoSubmitted`: Boolean - Whether funding info was submitted
  - `fundingInfoSubmittedAt`: DateTime - When funding info was submitted

### 2. Admin Dashboard Integration
- Added "Funding" button to the applications list in `/admin/applications`
- Button sends funding information request emails to applicants
- Professional confirmation dialog before sending requests

### 3. Email Notification System
- Professional email template with Ministry of Health branding
- Clear instructions for applicants
- Direct link to funding information form
- 7-day deadline reminder

### 4. Funding Information Form
- Dedicated form at `/funding-info/[applicationId]`
- Responsive design with dark mode support
- File upload capabilities for funding proof/plans
- Form validation and error handling
- Success confirmation page

### 5. API Endpoints
- `POST /api/admin/applications/[id]/request-funding-info` - Send funding request email
- `GET /api/applications/[id]/funding-info` - Get application for funding form
- `POST /api/applications/[id]/funding-info` - Submit funding information

## How It Works

### For Administrators:

1. **Access Applications**: Go to `/admin/applications`
2. **Request Funding Info**: Click the "Funding" button next to any application
3. **Confirm Request**: Confirm the action in the dialog
4. **Email Sent**: System automatically sends a professional email to the applicant

### For Applicants:

1. **Receive Email**: Get email with funding information request
2. **Click Link**: Click the "Complete Funding Information" button in email
3. **Fill Form**: Complete the funding information form with:
   - Estimated budget
   - Funding sources
   - Funding status (secured/not secured)
   - Proof of funding (if secured) OR funding plan (if not secured)
   - Sustainability plan
4. **Submit**: Submit the form to complete the process

## Required Information

The system collects the following information:

1. **Estimated Budget**: What is the estimated budget for the project?
2. **Funding Sources**: What are the potential or secured sources of funding?
3. **Funding Status**: Is funding secured or not yet secured?
4. **Proof of Funding**: If funding is secured, attach proof document
5. **Funding Plan**: If funding is not yet secured, attach plan to obtain financial support
6. **Sustainability Plan**: How will the project be sustained beyond the fellowship period?

## File Upload Support

- **Supported Formats**: PDF, DOC, DOCX
- **File Size Limit**: 10MB per file
- **Storage**: Files stored in `/public/uploads/funding-proof/` and `/public/uploads/funding-plan/`
- **Security**: Unique filenames to prevent conflicts

## Security Features

- **Authentication**: Admin authentication required for sending requests
- **Access Control**: Only requested applicants can access their funding form
- **File Validation**: Strict file type and size validation
- **One-time Submission**: Funding information can only be submitted once per application

## Email Template Features

- **Professional Design**: Ministry of Health branding and colors
- **Clear Instructions**: Step-by-step guidance for applicants
- **Responsive**: Works on all devices
- **Direct Links**: One-click access to funding form
- **Deadline Reminder**: 7-day completion deadline

## Error Handling

- **Form Validation**: Client-side and server-side validation
- **File Upload Errors**: Clear error messages for file issues
- **Network Errors**: Graceful handling of connection issues
- **Access Errors**: Clear messages for unauthorized access

## Testing

The system has been tested for:
- ✅ Database schema updates
- ✅ Email sending functionality
- ✅ Form submission and validation
- ✅ File upload handling
- ✅ Admin dashboard integration
- ✅ Security and access control

## Future Enhancements

Potential improvements for the future:
- Bulk funding information requests
- Email templates customization
- Funding information analytics
- Integration with application review workflow
- Automated reminders for incomplete submissions

## Support

For technical support or questions about this system, please contact the development team.
