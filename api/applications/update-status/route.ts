import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendStatusNotification, StatusType } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const applicationId = formData.get('applicationId') as string;
    const status = formData.get('status') as StatusType;

    if (!applicationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: {
        id: applicationId,
      },
      data: {
        status,
      },
    });

    // Send email notification if the application has an email and name
    if (updatedApplication.email && updatedApplication.firstName) {
      try {
        await sendStatusNotification(
          updatedApplication.email,
          `${updatedApplication.firstName} ${updatedApplication.lastName || ''}`,
          status
        );
        console.log(`Status update email sent to ${updatedApplication.email} - Status: ${status}`);
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Continue with the response even if email fails
      }
    }

    // Redirect back to the application detail page
    return NextResponse.redirect(`${request.nextUrl.origin}/admin/applications/${applicationId}`);
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update application status' },
      { status: 500 }
    );
  }
} 