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

// DELETE - Delete user (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifySuperAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === adminUser.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while deleting the user' },
      { status: 500 }
    );
  }
}

