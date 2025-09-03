import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  sendStatusNotification, 
  sendApprovalWithDocumentsRequestEmail,
  sendRejectionEmail 
} from "@/lib/emailService";

// PATCH /api/admin/applications/[id]/status - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    const { status, rejectionReason, customEmailContent } = await request.json();
    
    // Validate status
    if (!["pending", "reviewed", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    
    // If status is rejected, rejectionReason or customEmailContent is required
    if (status === "rejected" && !rejectionReason && !customEmailContent) {
      return NextResponse.json(
        { error: "Rejection reason is required when status is rejected" },
        { status: 400 }
      );
    }
    
    // Get application to check if it exists and to get applicant details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { 
        status,
        // @ts-ignore - Ignoring TypeScript errors for Prisma schema mismatch
        rejectionReason: status === "rejected" ? rejectionReason : null,
        // If status is approved, create an empty additional documents record
        ...(status === "approved" && {
          additionalDocuments: {
            create: {}
          }
        })
      },
      // @ts-ignore - Ignoring TypeScript errors for Prisma schema relations
      include: {
        additionalDocuments: true
      }
    });
    
    // Send appropriate email notification based on status
    if (application.email && application.firstName) {
      const fullName = `${application.firstName} ${application.lastName || ''}`;
      
      try {
        if (status === "approved") {
          // Generate a unique URL for document submission
          const documentSubmissionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/additional-documents/${applicationId}`;
          
          // Send approval email with document request
          await sendApprovalWithDocumentsRequestEmail(
            application.email,
            fullName,
            documentSubmissionUrl
          );
          
          console.log(`Approval with documents request email sent to ${application.email}`);
        } else if (status === "rejected") {
          // Send rejection email with custom reason or full custom content
          await sendRejectionEmail(
            application.email,
            fullName,
            rejectionReason,
            customEmailContent
          );
          
          console.log(`Rejection email sent to ${application.email}${customEmailContent ? ' with custom content' : ' with custom reason'}`);
        } else {
          // Send regular status notification for other statuses
          await sendStatusNotification(
            application.email,
            fullName,
            status
          );
          
          console.log(`Status notification email sent to ${application.email}`);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Continue with the response even if email fails
      }
    }
    
    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
} 