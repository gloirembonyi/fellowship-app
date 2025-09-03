import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// Secret for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

// Helper function to verify super admin token
async function verifySuperAdminToken(request: NextRequest) {
  try {
    const token = (await request.cookies).get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decodedToken = await jose.jwtVerify(token, SECRET);
    const payload = decodedToken.payload as any;
    
    if (!payload || payload.role !== 'super_admin') {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

// DELETE - Delete application (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const superAdminUser = await verifySuperAdminToken(request);
    
    if (!superAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Check if application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        additionalDocuments: true
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Delete related additional documents first
    if (existingApplication.additionalDocuments.length > 0) {
      await prisma.additionalDocuments.deleteMany({
        where: { applicationId }
      });
    }

    // Delete the application
    await prisma.application.delete({
      where: { id: applicationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting the application' },
      { status: 500 }
    );
  }
}
