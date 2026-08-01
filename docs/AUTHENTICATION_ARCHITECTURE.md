# Authentication Foundation Refactor

## Overview

This document describes the server-side authentication architecture for all TrueOps applications. This is the standard authentication pattern that should be used in all API routes.

## Architecture Principles

1. **Never use the browser Supabase client in server-side code**
2. **Never use the Service Role client to identify the logged-in user**
3. **Always derive the authenticated user from the JWT token in the Authorization header**
4. **Use the Supabase Admin client only for token verification**

## Core Authentication Helper

**File**: `lib/auth/server.ts`

### Key Functions

#### `getAuthenticatedUser(request: Request): Promise<AuthResult>`

Extracts and verifies the JWT token from the Authorization header.

**Process**:
1. Extract Bearer token from `Authorization` header
2. Verify token using `supabaseAdmin.auth.getUser(token)`
3. Return user data or error

**Returns**:
```typescript
{
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
  statusCode?: number;
}
```

#### `requireAuth(request: Request): Promise<AuthResult>`

Convenience wrapper around `getAuthenticatedUser`.

#### `getUserId(request: Request): Promise<string | null>`

Simple function to get just the user ID.

## Usage in API Routes

### Basic Authentication

```typescript
import { getAuthenticatedUser } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser(request);
  
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode }
    );
  }

  const userId = authResult.user.id;
  // ... handle request
}
```

### Permission-Based Authorization

```typescript
import { requirePermission } from '@/lib/permissions/api';
import { PERMISSIONS } from '@/lib/permissions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const result = await requirePermission(PERMISSIONS.SALES_CREATE, request);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode }
    );
  }

  const userId = result.userId;
  const role = result.role;
  // ... handle request
}
```

## HTTP Status Codes

The authentication system returns standard HTTP status codes:

- **200 OK**: Authenticated and authorized
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but lacking required permissions
- **404 Not Found**: User profile not found
- **500 Internal Server Error**: Server error during authentication

## Authentication Flow

```
Incoming Request
    │
    ▼
Extract Authorization Header
    │
    ▼
Token Present?
    │
    ├─ No → 401 Unauthorized
    │
    ▼ Yes
Verify Token with Supabase Admin
    │
    ▼
Token Valid?
    │
    ├─ No → 401 Unauthorized
    │
    ▼ Yes
Load User Profile
    │
    ▼
Profile Found?
    │
    ├─ No → 404 Not Found
    │
    ▼ Yes
Check Permissions (if required)
    │
    ▼
Has Permission?
    │
    ├─ No → 403 Forbidden
    │
    ▼ Yes
200 OK - Proceed with request
```

## Permission Checking

The `requirePermission` function in `lib/permissions/api.ts` handles:

1. **Authentication**: Verifies the JWT token
2. **Profile Loading**: Loads user profile from database
3. **Role Checking**: Owners automatically have all permissions
4. **Permission Caching**: Uses in-memory cache for performance
5. **Permission Validation**: Checks specific permission codes

### Permission Hierarchy

- **Owner**: Has all permissions automatically
- **Manager/Staff**: Permissions loaded from `user_permissions` table
- **Custom Roles**: Permissions loaded from `user_permissions` table

## Security Features

1. **JWT Token Verification**: Tokens are verified server-side using Admin client
2. **No Client-Side Auth**: Browser Supabase client is never used in API routes
3. **Service Role Protection**: Service Role key is never exposed to client
4. **Token Expiration**: Invalid/expired tokens are rejected
5. **Permission Caching**: Reduces database queries while maintaining security

## Migration from Old Pattern

### Old Pattern (Incorrect)

```typescript
// ❌ DON'T DO THIS
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { data: { session } } = await supabase.auth.getSession();
  // This uses the browser client in server-side code!
}
```

### New Pattern (Correct)

```typescript
// ✅ DO THIS
import { requirePermission } from '@/lib/permissions/api';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: Request) {
  const result = await requirePermission(PERMISSIONS.SALES_CREATE, request);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode }
    );
  }
  
  const userId = result.userId;
  // ... handle request
}
```

## Testing Authentication

### Test 1: Unauthenticated Request (Should return 401)

```bash
curl -X GET http://localhost:3000/api/team \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "error": "Unauthorized"
}
```
**Status Code**: 401

### Test 2: Authenticated Owner (Should return 200)

```bash
curl -X GET http://localhost:3000/api/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-owner-token>"
```

**Expected Response**:
```json
{
  "members": [...]
}
```
**Status Code**: 200

### Test 3: Authenticated User Without Permission (Should return 403)

```bash
curl -X POST http://localhost:3000/api/team \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-user-token-without-permission>" \
  -d '{"email": "test@example.com", "role": "staff"}'
```

**Expected Response**:
```json
{
  "error": "Forbidden"
}
```
**Status Code**: 403

## Implementation Checklist

- [x] Created `lib/auth/server.ts` with proper server authentication
- [x] Refactored `lib/permissions/api.ts` to use new helper
- [x] Removed browser Supabase client usage from `getSessionFromRequest`
- [x] Removed `supabase.auth.getSession()` call
- [x] Updated all permission checking functions to use new auth helper
- [x] Verified `/api/team` uses new authentication flow
- [ ] Test unauthenticated requests return 401
- [ ] Test authenticated owners receive 200
- [ ] Test permission failures return 403
- [ ] Update all other API routes to use new pattern

## Standard Authentication Pattern for TrueOps

This authentication pattern should be used in all TrueOps applications:

1. **Create `lib/auth/server.ts`** - Server-side authentication helper
2. **Create `lib/permissions/api.ts`** - Permission checking utilities
3. **Use `requirePermission()` in all protected routes**
4. **Never use browser Supabase client in server code**
5. **Always verify tokens using Supabase Admin client**

## Files Modified

- `lib/auth/server.ts` - New file, core authentication helper
- `lib/permissions/api.ts` - Refactored to use new helper
- `app/api/team/route.ts` - Already using correct pattern via `requirePermission`

## Next Steps

1. Run database migration for `must_change_password` column
2. Test authentication flow end-to-end
3. Update any remaining API routes to use new pattern
4. Document this as the standard for all future TrueOps applications