import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OTPManager } from '@/lib/otp';
import { emailService } from '@/lib/emailService';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, otpCode } = await request.json();

    if (action === 'request') {
      // Request OTP
      if (!email || !password) {
        return NextResponse.json(
          { success: false, message: 'Email and password are required' },
          { status: 400 }
        );
      }

      // Verify user credentials first
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user is admin or super_admin
      if (!['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'Access denied. Only admin users can login.' },
          { status: 403 }
        );
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user already has a pending OTP
      if (OTPManager.hasPendingOTP(email)) {
        const remainingTime = OTPManager.getRemainingTime(email);
        return NextResponse.json(
          { 
            success: false, 
            message: `OTP already sent. Please wait ${Math.ceil(remainingTime / 60)} minutes before requesting a new one.` 
          },
          { status: 429 }
        );
      }

      // Generate and send OTP
      const otpCode = OTPManager.createOTP(email, 5);
      
      const emailSent = await emailService.sendOTPEmail(email, otpCode, user.name);
      
      if (!emailSent) {
        return NextResponse.json(
          { success: false, message: 'Failed to send OTP email. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully. Please check your email.',
        expiresIn: 5 * 60, // 5 minutes in seconds
      });

    } else if (action === 'verify') {
      // Verify OTP
      if (!email || !otpCode) {
        return NextResponse.json(
          { success: false, message: 'Email and OTP code are required' },
          { status: 400 }
        );
      }

      // Verify OTP
      const verification = OTPManager.verifyOTP(email, otpCode);
      
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.message },
          { status: 400 }
        );
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Create JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
      const secret = new TextEncoder().encode(JWT_SECRET);
      
      const token = await new jose.SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      // Create response with cookie
      const response = NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        redirectUrl: '/admin',
      });

      // Set the auth token cookie - remove secure flag for HTTP
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: false, // Changed from process.env.NODE_ENV === 'production' to false for HTTP
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return response;

    } else if (action === 'resend') {
      // Resend OTP
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required' },
          { status: 400 }
        );
      }

      // Check if user exists and is admin or super_admin
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'User not found or access denied' },
          { status: 404 }
        );
      }

      // Generate new OTP
      const otpCode = OTPManager.resendOTP(email, 5);
      
      const emailSent = await emailService.sendOTPEmail(email, otpCode, user.name);
      
      if (!emailSent) {
        return NextResponse.json(
          { success: false, message: 'Failed to send OTP email. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'New OTP sent successfully. Please check your email.',
        expiresIn: 5 * 60, // 5 minutes in seconds
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "request", "verify", or "resend".' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('OTP API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
