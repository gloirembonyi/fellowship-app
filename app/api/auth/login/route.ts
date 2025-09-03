import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

// Secret for JWT signing - in production, use a proper secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { email, password } = await request.json();
    
    // Validate input
    if (email === undefined || password === undefined) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user by email
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

    // If user not found or password doesn't match
    if (user === null) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch === false) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create a JWT token using jose
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    console.log('Creating token with payload:', JSON.stringify(payload));
    
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(SECRET);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectUrl: user.role === 'admin' ? '/admin' : '/',
    });

    // Set cookie on the response - remove secure flag for HTTP
    (await response.cookies).set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: false, // Changed from process.env.NODE_ENV === 'production' to false
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
