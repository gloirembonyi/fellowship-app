import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAcknowledgmentEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON data
    const data = await request.json();
    
    // Remove any fields that shouldn't be stored or are not in the schema
    const { cvFile, ...cleanData } = data;
    
    // Create the application in the database
    const application = await prisma.application.create({
      data: cleanData,
    });

    // Send acknowledgment email if email and name are available
    if (application.email && application.firstName) {
      try {
        await sendAcknowledgmentEmail(
          application.email,
          `${application.firstName} ${application.lastName || ''}`
        );
        console.log(`Acknowledgment email sent to ${application.email}`);
      } catch (emailError) {
        console.error('Failed to send acknowledgment email:', emailError);
        // Don't fail the request if email sending fails
      }
    } else {
      console.warn('Could not send acknowledgment email: missing email or name');
    }

    // Return success response with the created application
    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully', 
      data: application 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating application:', error);
    
    // Check if it's a Prisma error
    const isPrismaError = error.name === 'PrismaClientKnownRequestError' || 
                          error.name === 'PrismaClientUnknownRequestError' ||
                          error.name === 'PrismaClientValidationError';
    
    // Return appropriate error response
    return NextResponse.json({ 
      success: false, 
      message: isPrismaError ? 'Database error occurred' : 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    }, { status: 500 });
  }
}

// GET /api/applications - Get all applications with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Prepare filter conditions
    const where = status ? { status } : {};
    
    // Get applications with pagination
    // @ts-ignore - Ignoring TypeScript errors for Prisma queries
    const applications = await prisma.application.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      } as any,
      skip,
      take: limit,
    });
    
    // Get total count for pagination
    const total = await prisma.application.count({ where });
    
    return NextResponse.json({
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
} 