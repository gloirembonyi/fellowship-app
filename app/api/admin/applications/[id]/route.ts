import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  sendStatusNotification, 
  sendApprovalWithDocumentsRequestEmail,
  sendRejectionEmail 
} from "@/lib/emailService";

// Define StatusType to match the one in emailService
type StatusType = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'received';

// GET /api/admin/applications/[id] - Get a specific application
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  try {
    // @ts-ignore - Ignoring TypeScript errors for Prisma queries
    const application = await prisma.application.findUnique({
      where: {
        id,
      },
      // @ts-ignore - Prisma relation not recognized by TypeScript
      include: {
        additionalDocuments: true
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/applications/[id] - Update application status
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  try {
    const body = await request.json();
    const { status, rejectionReason } = body;

    // @ts-ignore - Ignoring TypeScript errors for Prisma queries
    const updatedApplication = await prisma.application.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    if (updatedApplication.email && updatedApplication.firstName) {
      try {
        const fullName = `${updatedApplication.firstName} ${updatedApplication.lastName || ''}`;
        
        if (status === 'approved') {
          // Generate document submission URL
          const documentSubmissionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38'}/documents/${id}`;
          
          // Send approval email with document request
          await sendApprovalWithDocumentsRequestEmail(
            updatedApplication.email,
            fullName,
            documentSubmissionUrl
          );
        } else if (status === 'rejected' && rejectionReason) {
          // Send rejection email with reason
          await sendRejectionEmail(
            updatedApplication.email,
            fullName,
            rejectionReason
          );
        } else {
          // For other statuses, send regular status notification
          await sendStatusNotification(
            updatedApplication.email,
            fullName,
            status as any
          );
        }
        console.log(`Status update email sent to ${updatedApplication.email} - Status: ${status}`);
      } catch (emailError) {
        console.error("Error sending status email:", emailError);
      }
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/applications/[id] - Remove an application
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  try {
    // First check if the application exists
    const application = await prisma.application.findUnique({
      where: {
        id,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    try {
      // Delete any additional documents first using deleteMany to avoid errors if none exist
      // @ts-ignore - Ignoring TypeScript errors for Prisma queries
      await prisma.additionalDocuments.deleteMany({
        where: {
          applicationId: id,
        },
      });
    } catch (err) {
      console.error('No additional documents to delete');
    }

    // Then delete the application
    const deletedApplication = await prisma.application.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(deletedApplication);
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

// Update application status
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const applicationId = context.params.id;
    const { status, rejectionReason, customEmailContent } = await request.json();

    // Validate status
    const validStatuses = ["pending", "reviewed", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // If status is rejected, require a rejection reason
    if (status === "rejected" && !rejectionReason && !customEmailContent) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting an application" },
        { status: 400 }
      );
    }

    // Update application in database
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        // @ts-ignore - Ignoring TypeScript errors for Prisma schema mismatch
        rejectionReason: status === "rejected" ? rejectionReason : null,
      },
    });

    // Send email notification if email and name are available
    if (application.email && application.firstName) {
      try {
        const fullName = `${application.firstName} ${application.lastName || ''}`;
        
        if (status === "rejected") {
          // Send rejection email with custom reason or full custom content
          await sendRejectionEmail(
            application.email,
            fullName,
            rejectionReason,
            customEmailContent
          );
          console.log(`Rejection email sent to ${application.email}${customEmailContent ? ' with custom content' : ' with custom reason'}`);
        } else if (status === "approved") {
          // Generate document submission URL
          const documentSubmissionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38'}/documents/${applicationId}`;
          
          // Send approval email with document request
          await sendApprovalWithDocumentsRequestEmail(
            application.email,
            fullName,
            documentSubmissionUrl
          );
          console.log(`Approval email sent to ${application.email}`);
        } else {
          // For other statuses, send regular notification
        await sendStatusNotification(
            application.email,
            fullName,
          status as StatusType
        );
          console.log(`Status notification email sent to ${application.email}`);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
} 