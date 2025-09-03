import { NextRequest, NextResponse } from "next/server";
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
    console.error("Error saving file:", error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const appId = formData.get("appId") as string;
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    if (!documentType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB limit)
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }
    
    // Save file to disk
    const fileUrl = await saveFileToDisk(file, documentType);
    
    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      documentType: documentType,
      message: "File uploaded successfully"
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        message: error.message || "An unknown error occurred"
      },
      { status: 500 }
    );
  }
} 