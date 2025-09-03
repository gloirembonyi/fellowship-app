import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { emailService } from '@/lib/emailService';

// Secret for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const token = (await request.cookies).get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decodedToken = await jose.jwtVerify(token, SECRET);
    const payload = decodedToken.payload as any;
    
    if (!payload || !['admin', 'super_admin'].includes(payload.role)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

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

// GET - List all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifySuperAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}

// POST - Create new user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifySuperAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const { email, password, name, role } = await request.json();

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'user', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Role must be either "admin", "user", or "super_admin"' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Send welcome email with credentials
    try {
      const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/login`;
      const emailSent = await emailService.sendUserCreationEmail(
        email,
        name,
        email,
        password, // Send the plain password for the email
        role,
        loginUrl
      );
      
      if (emailSent) {
        console.log(`✅ Welcome email sent to ${email}`);
      } else {
        console.log(`⚠️ Failed to send welcome email to ${email}`);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the user creation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (Super Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await verifySuperAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

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
