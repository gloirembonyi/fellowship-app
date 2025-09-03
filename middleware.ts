import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Secret for JWT verification - in production, use a proper secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fellowship-program-jwt-secret';
const SECRET = new TextEncoder().encode(JWT_SECRET);

export function middleware(request: NextRequest) {
  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Add CORS headers
    const response = NextResponse.next();
    
    // Add headers to prevent caching of API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Add basic CORS headers for development
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
  }
  
  // Protect admin routes (except login page)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Verify the token using jose
      const decodedToken = jose.decodeJwt(token);
      console.log('Decoded token:', JSON.stringify(decodedToken));
      
      // Check if user is admin or super_admin
      if (!decodedToken || !['admin', 'super_admin'].includes(decodedToken.role)) {
        console.log('Not admin role, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // User is authenticated and is admin, allow access
      return NextResponse.next();
    } catch (error) {
      // Token is invalid, redirect to login page
      console.error('Token verification error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}; 