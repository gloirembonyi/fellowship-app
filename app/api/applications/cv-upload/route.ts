import { NextRequest, NextResponse } from 'next/server';
import { saveFile } from '@/lib/fileUpload';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const applicationId = formData.get('applicationId') as string;
    const cvFile = formData.get('cvFile') as File;

    // Validate inputs
    if (!applicationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Application ID is required' 
      }, { status: 400 });
    }

    if (!cvFile || !(cvFile instanceof File)) {
      return NextResponse.json({ 
        success: false, 
        message: 'CV file is required' 
      }, { status: 400 });
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ 
        success: false, 
        message: 'Application not found' 
      }, { status: 404 });
    }

    // Save the file
    const cvFileUrl = await saveFile(cvFile, 'cv');
    
    if (!cvFileUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to save CV file' 
      }, { status: 500 });
    }

    // Update the application with the CV file URL
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { cvFileUrl },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'CV uploaded successfully',
      data: {
        cvFileUrl,
        applicationId
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error uploading CV:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to upload CV',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    }, { status: 500 });
  }
} 