import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendFundingInfoRequestEmail, sendCustomFundingInfoRequestEmail } from "@/lib/emailService";
import * as jose from 'jose';

// Secret for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

// Verify admin token from cookies (consistent with middleware)
async function verifyAdminToken(request: NextRequest) {
  try {
    // Get token from cookies (same as middleware)
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      console.log('No auth token found in cookies');
      return null;
    }
    
    // Verify token using jose (same as middleware)
    const decodedToken = await jose.jwtVerify(token, SECRET);
    const payload = decodedToken.payload as any;
    
    console.log('Decoded token payload:', payload);
    
    // Check if user is admin
    if (!payload || payload.role !== 'admin') {
      console.log('User is not admin');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// POST /api/admin/applications/[id]/request-funding-info - Send funding info request email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const applicationId = params.id;
    const { customMessage, includeLink, customLink } = await request.json().catch(() => ({}));

    // Get application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fundingInfoRequested: true,
        fundingInfoSubmitted: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if funding info has already been submitted
    if (application.fundingInfoSubmitted) {
      return NextResponse.json(
        { success: false, message: 'Funding information has already been submitted for this application' },
        { status: 400 }
      );
    }

    // Send funding info request email
    try {
      if (customMessage) {
        // Use custom message with optional link
        await sendCustomFundingInfoRequestEmail(
          application.email,
          `${application.firstName} ${application.lastName}`,
          application.id,
          customMessage,
          includeLink !== false, // Default to true if not specified
          customLink
        );
      } else {
        // Use default message
        await sendFundingInfoRequestEmail(
          application.email,
          `${application.firstName} ${application.lastName}`,
          application.id
        );
      }

      // Update application to mark funding info as requested
      await prisma.application.update({
        where: { id: applicationId },
        data: { fundingInfoRequested: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Funding information request email sent successfully',
      });
    } catch (emailError) {
      console.error('Error sending funding info request email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error requesting funding info:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}
