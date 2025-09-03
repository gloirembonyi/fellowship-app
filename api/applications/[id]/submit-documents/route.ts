import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStatusNotification } from "@/lib/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = await params.id;
    console.log(`Processing document submission for application: ${applicationId}`);
    
    // Check if application exists and is approved or received
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        additionalDocuments: true,
      },
    });
    
    if (!application) {
      console.log(`Application not found: ${applicationId}`);
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    // Allow both approved and received applications to submit documents
    if (application.status !== "approved" && application.status !== "received") {
      console.log(`Invalid application status: ${application.status}`);
      return NextResponse.json(
        { error: "Only approved applications can submit documents" },
        { status: 403 }
      );
    }
    
    // Get all documents for this application
    const allDocuments = await prisma.additionalDocuments.findMany({
      where: { applicationId },
    });
    
    // Check if all required documents are uploaded
    const requiredDocumentTypes = [
      "identityDocument",
      "degreeCertifications",
      "referenceOne",
      "referenceTwo",
      "fullProjectProposal"
    ];
    
    const allRequiredDocsSubmitted = requiredDocumentTypes.every(docType => 
      allDocuments.some(doc => doc[docType as keyof typeof doc])
    );
    
    if (!allRequiredDocsSubmitted) {
      console.log(`Not all required documents have been uploaded for application: ${applicationId}`);
      return NextResponse.json(
        { error: "Not all required documents have been uploaded" },
        { status: 400 }
      );
    }
    
    // Only update application status to received if it's currently approved
    let statusChanged = false;
    if (application.status === "approved") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: "received",
        },
      });
      statusChanged = true;
      console.log(`Updated application status from 'approved' to 'received' for: ${applicationId}`);
      
      // Send notification email if we have contact details
      if (application.email && application.firstName) {
        try {
          const fullName = `${application.firstName} ${application.lastName || ''}`;
          await sendStatusNotification(
            application.email,
            fullName,
            "received"
          );
          console.log(`Sent status notification email to: ${application.email}`);
        } catch (emailError) {
          console.error("Error sending status notification:", emailError);
        }
      }
    } else {
      console.log(`Application already in '${application.status}' status, no status update needed`);
    }
    
    return NextResponse.json({
      success: true,
      message: "All documents submitted successfully",
      status: statusChanged ? "received" : application.status,
    });
  } catch (error: any) {
    console.error("Error submitting documents:", error);
    return NextResponse.json(
      { error: "Failed to submit documents" },
      { status: 500 }
    );
  }
} 