import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { existsSync } from "fs";

// Helper function to save file to disk
async function saveFileToDisk(file: File, documentType: string): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename to prevent collisions
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const uploadDir = join(process.cwd(), "public", "uploads", documentType);
    
    // Create the upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    
    const filePath = join(uploadDir, uniqueFilename);
    
    // Write the file to disk
    await writeFile(filePath, buffer);
    console.log(`File saved to: ${filePath}`);
    
    // Return the public URL path
    return `/uploads/${documentType}/${uniqueFilename}`;
  } catch (error: any) {
    console.error(`Error saving file to disk:`, error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

// GET /api/applications/[id]/funding-info - Get application for funding info form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

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
        { success: false, message: 'Funding information has already been submitted' },
        { status: 400 }
      );
    }

    // Check if funding info was requested
    if (!application.fundingInfoRequested) {
      return NextResponse.json(
        { success: false, message: 'Funding information request not found' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error('Error fetching application for funding info:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching application' },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/funding-info - Submit funding information
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    // Get application details first
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
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
        { success: false, message: 'Funding information has already been submitted' },
        { status: 400 }
      );
    }

    // Check if funding info was requested
    if (!application.fundingInfoRequested) {
      return NextResponse.json(
        { success: false, message: 'Funding information request not found' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    const estimatedBudget = formData.get("estimatedBudget") as string;
    const fundingSources = formData.get("fundingSources") as string;
    const fundingSecured = formData.get("fundingSecured") as string;
    const sustainabilityPlan = formData.get("sustainabilityPlan") as string;
    const fundingProof = formData.get("fundingProof") as File;
    const fundingPlan = formData.get("fundingPlan") as File;

    // Validate required fields
    if (!estimatedBudget || !fundingSources || !fundingSecured || !sustainabilityPlan) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate file requirements based on funding status
    if (fundingSecured === "secured" && (!fundingProof || fundingProof.size === 0)) {
      return NextResponse.json(
        { success: false, message: 'Proof of funding is required when funding is secured' },
        { status: 400 }
      );
    }

    if (fundingSecured === "not_secured" && (!fundingPlan || fundingPlan.size === 0)) {
      return NextResponse.json(
        { success: false, message: 'Funding plan is required when funding is not secured' },
        { status: 400 }
      );
    }

    let fundingProofUrl = null;
    let fundingPlanUrl = null;

    // Handle file uploads
    try {
      if (fundingProof && fundingProof.size > 0) {
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExtension = fundingProof.name.toLowerCase().substring(fundingProof.name.lastIndexOf('.'));
        if (!allowedTypes.includes(fileExtension)) {
          return NextResponse.json(
            { success: false, message: 'Invalid file type for funding proof. Only PDF, DOC, and DOCX files are allowed' },
            { status: 400 }
          );
        }

        // Validate file size (10MB limit)
        const maxSizeInBytes = 10 * 1024 * 1024;
        if (fundingProof.size > maxSizeInBytes) {
          return NextResponse.json(
            { success: false, message: 'Funding proof file size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        fundingProofUrl = await saveFileToDisk(fundingProof, "funding-proof");
      }

      if (fundingPlan && fundingPlan.size > 0) {
        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExtension = fundingPlan.name.toLowerCase().substring(fundingPlan.name.lastIndexOf('.'));
        if (!allowedTypes.includes(fileExtension)) {
          return NextResponse.json(
            { success: false, message: 'Invalid file type for funding plan. Only PDF, DOC, and DOCX files are allowed' },
            { status: 400 }
          );
        }

        // Validate file size (10MB limit)
        const maxSizeInBytes = 10 * 1024 * 1024;
        if (fundingPlan.size > maxSizeInBytes) {
          return NextResponse.json(
            { success: false, message: 'Funding plan file size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        fundingPlanUrl = await saveFileToDisk(fundingPlan, "funding-plan");
      }
    } catch (fileError) {
      console.error('Error uploading files:', fileError);
      return NextResponse.json(
        { success: false, message: 'Error uploading files. Please try again.' },
        { status: 500 }
      );
    }

    // Update application with funding information
    try {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          estimatedBudget,
          fundingSources,
          fundingSecured,
          sustainabilityPlan,
          fundingProofUrl,
          fundingPlanUrl,
          fundingInfoSubmitted: true,
          fundingInfoSubmittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Funding information submitted successfully',
      });
    } catch (dbError) {
      console.error('Error updating application:', dbError);
      return NextResponse.json(
        { success: false, message: 'Error saving funding information. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error submitting funding info:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while submitting funding information' },
      { status: 500 }
    );
  }
}
