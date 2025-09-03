# Fellowship Application Workflow Test

## Overview
This document outlines the complete testing workflow to ensure all features from the image are properly implemented and working.

## Features to Test (Based on Image)

### Required Documents for Second Round:
1. ✅ **National ID or Passport** (identityDocument)
2. ✅ **Degrees or certifications** (degreeCertifications)
3. ✅ **Two references** (referenceOne, referenceTwo)
4. ✅ **Full project proposal (1,500 words)** (fullProjectProposal)
5. ✅ **Funding and sustainability plan** (fundingPlan)
6. ✅ **Risk mitigation strategy** (riskMitigation)
7. ✅ **Additional achievements or publications** (achievements)
8. ✅ **Language proficiency details** (languageProficiency)

## Test Scenarios

### 1. Application Submission and Approval Workflow
- [ ] Submit a new application
- [ ] Admin reviews and approves the application
- [ ] Applicant receives approval email with document submission link
- [ ] Applicant can access the document submission page

### 2. Document Upload Functionality
- [ ] Upload National ID or Passport
- [ ] Upload Degrees or Certifications
- [ ] Upload Reference Letter 1
- [ ] Upload Reference Letter 2
- [ ] Upload Full Project Proposal
- [ ] Upload Funding and Sustainability Plan
- [ ] Upload Risk Mitigation Strategy (optional)
- [ ] Upload Additional Achievements (optional)
- [ ] Upload Language Proficiency Details (optional)

### 3. Document Upload Features
- [ ] Success feedback when document is uploaded
- [ ] Progress indicators during upload
- [ ] Duplicate upload prevention
- [ ] File validation (PDF, DOC, DOCX, max 10MB)
- [ ] Toast notifications for success/error
- [ ] Visual status indicators (Pending/Uploaded)

### 4. Admin Document Review
- [ ] Admin can view all uploaded documents
- [ ] Admin can see document details (name, size, upload date)
- [ ] Admin can download/view documents
- [ ] Admin can see completion status
- [ ] Application status updates to "received" when all required docs are uploaded

### 5. Database Integration
- [ ] Documents are properly stored in database
- [ ] File URLs are correctly generated and stored
- [ ] Document metadata is preserved
- [ ] Application status updates correctly

## API Endpoints to Test

### Document Upload
```
POST /api/applications/[id]/documents
- Content-Type: multipart/form-data
- Fields: file, documentType
```

### Document Retrieval
```
GET /api/applications/[id]/documents
- Returns array of document records
```

### Application Status Update
```
PATCH /api/admin/applications/[id]
- Body: { status: "approved" | "rejected", rejectionReason?: string }
```

## Database Schema Verification

### Application Table
- ✅ All personal information fields
- ✅ Project information fields
- ✅ Status tracking (pending, approved, rejected, received)
- ✅ Timestamps (createdAt, updatedAt, submittedAt)

### AdditionalDocuments Table
- ✅ identityDocument (String?)
- ✅ degreeCertifications (String?)
- ✅ referenceOne (String?)
- ✅ referenceTwo (String?)
- ✅ fullProjectProposal (String?)
- ✅ fundingPlan (String?)
- ✅ riskMitigation (String?)
- ✅ achievements (String?)
- ✅ languageProficiency (String?)
- ✅ Application relationship (applicationId)

## File Storage Structure
```
public/uploads/
├── identityDocument/
├── degreeCertifications/
├── referenceOne/
├── referenceTwo/
├── fullProjectProposal/
├── fundingPlan/
├── riskMitigation/
├── achievements/
└── languageProficiency/
```

## Error Handling
- [ ] Invalid file types are rejected
- [ ] Files exceeding 10MB are rejected
- [ ] Network errors are handled gracefully
- [ ] Database errors are logged and handled
- [ ] User-friendly error messages

## Security Considerations
- [ ] File uploads are validated
- [ ] File names are sanitized
- [ ] Access control for document viewing
- [ ] SQL injection prevention
- [ ] XSS prevention

## Performance Considerations
- [ ] File upload progress indicators
- [ ] Efficient database queries
- [ ] Proper error handling
- [ ] Responsive UI design

## Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Responsiveness
- [ ] Document upload form works on mobile
- [ ] Admin interface is mobile-friendly
- [ ] Touch interactions work properly

## Email Notifications
- [ ] Approval email with document submission link
- [ ] Rejection email with reason
- [ ] Status update notifications

## Success Criteria
- ✅ All document types from the image are supported
- ✅ Upload functionality works with proper feedback
- ✅ Admin can view and manage all documents
- ✅ Database properly stores all data
- ✅ Application workflow is complete
- ✅ Error handling is robust
- ✅ User experience is smooth and professional
