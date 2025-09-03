import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/applications/[id] - Get a single application by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    
    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }
    
    // @ts-ignore - Ignoring TypeScript errors for Prisma queries
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      // @ts-ignore - Ignoring TypeScript errors for Prisma schema relations
      include: {
        additionalDocuments: true,
      },
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

// PATCH /api/applications/[id] - Update an application
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    const data = await request.json();
    
    const application = await prisma.application.update({
      where: { id: applicationId },
      data,
    });
    
    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;
    
    // First delete any additional documents
    // @ts-ignore - Ignoring TypeScript errors for Prisma queries
    await prisma.additionalDocuments.deleteMany({
      where: { applicationId },
    });
    
    // Then delete the application
    await prisma.application.delete({
      where: { id: applicationId },
    });
    
    return NextResponse.json(
      { success: true, message: "Application deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
} 