import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// DELETE /api/applications/[id]/documents/[documentType] - Delete a specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentType: string } }
) {
  try {
    const { id: applicationId, documentType } = params;
    console.log(`Deleting document type: ${documentType} for application: ${applicationId}`);
    
    // Check if application exists
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
    
    // Check if the document type is valid
    const urlField = `${documentType}`;
    
    // Find the latest document record with this document type
    const documents = await prisma.additionalDocuments.findMany({
      where: { 
        applicationId,
        [urlField]: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (!documents || documents.length === 0) {
      console.log(`No ${documentType} document found for application: ${applicationId}`);
      return NextResponse.json(
        { error: `No ${documentType} document found` },
        { status: 404 }
      );
    }
    
    const document = documents[0];
    const fileUrl = document[urlField as keyof typeof document] as string;
    
    if (!fileUrl) {
      console.log(`No file URL found for document type: ${documentType}`);
      return NextResponse.json(
        { error: `No file URL found for document type: ${documentType}` },
        { status: 404 }
      );
    }
    
    // Update the document record to remove the file URL
    await prisma.additionalDocuments.update({
      where: { id: document.id },
      data: { [urlField]: null }
    });
    
    // Try to delete the physical file if it exists
    try {
      // Extract the file path from the URL
      const filePath = fileUrl.replace(/^\/uploads\//, "");
      const fullPath = join(process.cwd(), "public", "uploads", filePath);
      
      if (existsSync(fullPath)) {
        await unlink(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      }
    } catch (fileError) {
      console.error(`Error deleting file: ${fileError}`);
      // Continue even if file deletion fails
    }
    
    console.log(`Document ${documentType} deleted successfully for application: ${applicationId}`);
    
    return NextResponse.json({
      success: true,
      message: `${documentType} document deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
} 