import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sendStatusNotification } from '@/lib/emailService';

// Helper function to handle file uploads
async function saveFile(file: File, directory: string): Promise<string | null> {
  try {
    if (!file) return null;
    
    // Create a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', directory, filename);
    
    // Write the file to the filesystem
    await writeFile(filepath, buffer);
    
    // Return the public URL
    return `/uploads/${directory}/${filename}`;
  } catch (error) {
    console.error(`Error saving file to ${directory}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const applicationId = formData.get('applicationId') as string;

    if (!applicationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Application ID is required' 
      }, { status: 400 });
    }

    // Verify application exists and is approved
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ 
        success: false, 
        message: 'Application not found' 
      }, { status: 404 });
    }

    if (application.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only approved applications can submit additional documents' 
      }, { status: 403 });
    }

    // Process document uploads
    const documentFields = [
      'identityDocument',
      'degreeCertifications',
      'referenceOne',
      'referenceTwo',
      'fullProjectProposal',
      'fundingPlan',
      'riskMitigation',
      'achievements',
      'languageProficiency'
    ];

    const documentUrls: Record<string, string> = {};

    // Process each document field
    for (const field of documentFields) {
      const file = formData.get(field) as File;
      if (file && file instanceof File) {
        const fileUrl = await saveFile(file, field);
        if (fileUrl) {
          documentUrls[field] = fileUrl;
        }
      }
    }

    // Check if we have any documents to save
    if (Object.keys(documentUrls).length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid documents provided' 
      }, { status: 400 });
    }

    // Always create new documents - removed duplication check and update logic
    // @ts-ignore - Ignoring TypeScript errors for Prisma schema relations
    const additionalDocs = await prisma.additionalDocuments.create({
      data: {
        ...documentUrls,
        application: {
          connect: { id: applicationId }
        }
      },
    });

    // Update application status to received
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'received' },
    });

    // Send email notification
    try {
      if (application.email && application.firstName) {
        await sendStatusNotification(
          application.email,
          application.firstName,
          'received',
          applicationId
        );
      }
    } catch (emailError: any) {
      console.error('Failed to send status notification email:', emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Documents uploaded successfully',
      data: additionalDocs
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error processing document submission:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process document submission',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    }, { status: 500 });
  }
} 