import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';

// Secret for JWT verification - in production, use a proper secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    try {
      // Verify the token using jose
      const decodedToken = jose.decodeJwt(token);
      console.log('User API - Decoded token:', JSON.stringify(decodedToken));
      
      if (!decodedToken || !decodedToken.id) {
        throw new Error('Invalid token payload');
      }
      
      const userId = decodedToken.id as string;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
      
      // Return user info
      return NextResponse.json({
        success: true,
        user,
      });
    } catch (error) {
      // Token verification failed
      console.error('Token verification error:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while getting user info' },
      { status: 500 }
    );
  }
} 