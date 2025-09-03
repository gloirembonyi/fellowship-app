import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { existsSync } from "fs";

// Document types that can be uploaded
const ALLOWED_DOCUMENT_TYPES = [
  "identityDocument",
  "degreeCertifications",
  "referenceOne",
  "referenceTwo",
  "fullProjectProposal",
  "fundingPlan",
  "riskMitigation",
  "achievements",
  "languageProficiency"
];

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

// POST /api/applications/[id]/documents - Upload additional documents
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = await params.id;
    console.log(`Processing document upload for application: ${applicationId}`);
    
    // Check if application exists and is approved
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      console.log(`Application not found: ${applicationId}`);
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    // Allow both approved and received status for document uploads
    if (application.status !== "approved" && application.status !== "received") {
      console.log(`Invalid application status: ${application.status}`);
      return NextResponse.json(
        { error: "Only approved applications can submit additional documents" },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const documentType = formData.get("documentType") as string;
    const file = formData.get("file") as File;
    
    console.log(`Document type: ${documentType}, File name: ${file?.name || 'No file'}`);
    
    // Validate document type
    if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      console.log(`Invalid document type: ${documentType}`);
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }
    
    // Validate file
    if (!file || !(file instanceof File)) {
      console.log('No valid file provided');
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Save file to disk
    const fileUrl = await saveFileToDisk(file, documentType);
    console.log(`File saved with URL: ${fileUrl}`);
    
    // Create a new document record - we don't use upsert anymore
    const additionalDocument = await prisma.additionalDocuments.create({
      data: {
        [documentType]: fileUrl,
        application: {
          connect: { id: applicationId }
        }
      },
    });
    
    console.log(`Document record created: ${additionalDocument.id}`);
    
    // Check if all required documents are submitted
    // Get all documents for this application
    const allDocuments = await prisma.additionalDocuments.findMany({
      where: { applicationId },
    });
    
    // Check if each required document type has at least one document
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
    
    // Only update the application status to 'received' if all required documents are submitted
    // and the current status is 'approved' (don't change if it's already 'received')
    if (allRequiredDocsSubmitted && application.status === "approved") {
      // Update the application status to received
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "received" },
      });
      console.log(`All required documents submitted, application status updated to 'received'`);
    } else {
      // Make sure we don't change the status if not all documents are submitted
      console.log(`Not all required documents submitted yet, keeping status as '${application.status}'`);
    }
    
    return NextResponse.json({
      success: true,
      documentType,
      fileUrl,
      submissionStatus: allRequiredDocsSubmitted ? "complete" : "pending",
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// GET /api/applications/[id]/documents - Get all additional documents for an application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = await params.id;
    console.log(`Fetching documents for application: ${applicationId}`);
    
    // Find all documents for this application
    const additionalDocuments = await prisma.additionalDocuments.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!additionalDocuments || additionalDocuments.length === 0) {
      console.log(`No documents found for application: ${applicationId}`);
      // Return an empty array instead of an error
      return NextResponse.json([]);
    }
    
    console.log(`Found ${additionalDocuments.length} documents for application: ${applicationId}`);
    
    // Return the complete document records for admin viewing
    return NextResponse.json(additionalDocuments);
  } catch (error: any) {
    console.error("Error fetching additional documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch additional documents" },
      { status: 500 }
    );
  }
} 