/**
 * Server-side Authentication Helper for Next.js Route Handlers
 * 
 * This module provides proper server-side authentication using the Supabase Admin client.
 * It should be used in all API routes to authenticate requests securely.
 * 
 * DO NOT use the browser Supabase client in server-side code.
 * DO NOT use the Service Role client to identify the logged-in user.
 * 
 * The authenticated user is derived from the JWT token in the Authorization header.
 * 
 * Usage:
 * ```typescript
 * import { getAuthenticatedUser, requireAuth } from '@/lib/auth/server';
 * 
 * export async function GET(request: Request) {
 *   const user = await getAuthenticatedUser(request);
 *   if (!user) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *   // ... use user.id, user.email, etc.
 * }
 * ```
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  [key: string]: any; // Allow for additional user metadata
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Extracts the JWT token from the Authorization header
 */
function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Gets the authenticated user from the request
 * 
 * This function:
 * 1. Extracts the JWT token from the Authorization header
 * 2. Verifies the token using the Supabase Admin client
 * 3. Returns the user if valid, null otherwise
 * 
 * @param request - The Next.js Request object
 * @returns AuthResult with user data or error
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthResult> {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return {
        success: false,
        error: "Missing authorization token",
        statusCode: 401,
      };
    }

    // Verify the JWT token using the Admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error("Token verification failed:", error);
      return {
        success: false,
        error: "Invalid or expired token",
        statusCode: 401,
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || "",
      },
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    return {
      success: false,
      error: "Authentication failed",
      statusCode: 401,
    };
  }
}

/**
 * Requires authentication - returns 401 if not authenticated
 * 
 * This is a convenience wrapper around getAuthenticatedUser that returns
 * a standardized response format for API routes.
 * 
 * @param request - The Next.js Request object
 * @returns AuthResult with user data or error response
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  return getAuthenticatedUser(request);
}

/**
 * Gets the user ID from the request or returns null
 * 
 * Convenience function for simple authentication checks.
 * 
 * @param request - The Next.js Request object
 * @returns User ID or null
 */
export async function getUserId(request: Request): Promise<string | null> {
  const result = await getAuthenticatedUser(request);
  
  if (!result.success || !result.user) {
    return null;
  }
  
  return result.user.id;
}