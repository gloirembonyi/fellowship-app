import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { emailService } from '@/lib/emailService';

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

// POST - Reset user password (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifySuperAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const { userId, newPassword } = await request.json();

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send password reset email
    try {
      const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/login`;
      const emailSent = await emailService.sendPasswordResetEmail(
        existingUser.email,
        existingUser.name || 'User',
        newPassword, // Send the plain password for the email
        loginUrl
      );
      
      if (emailSent) {
        console.log(`✅ Password reset email sent to ${existingUser.email}`);
      } else {
        console.log(`⚠️ Failed to send password reset email to ${existingUser.email}`);
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the password reset if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${existingUser.name} (${existingUser.email})`,
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting the password' },
      { status: 500 }
    );
  }
}
