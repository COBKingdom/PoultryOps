# Supabase Client Usage Audit Report

## Executive Summary

A complete audit of the PoultryOps codebase revealed **systematic incorrect usage** of the Supabase browser client in server-side code. This is a critical architectural issue that causes HTTP 500 errors and violates security best practices.

## Audit Results

### Files Using Browser Supabase Client (supabase from @/lib/supabase)

**Total Files Found**: 17 files

### Classification

#### ✅ CORRECT - Client-Side Files (2 files)

These files correctly use the browser Supabase client:

1. **`hooks/useCurrentFarm.ts`**
   - **Type**: Client-side React hook
   - **Marker**: `"use client"` directive present
   - **Status**: ✅ CORRECT - Browser client is appropriate
   - **Usage**: Used in React components for client-side data fetching

2. **`components/auth/RegisterForm.tsx`** (and similar client components)
   - **Type**: Client-side React components
   - **Status**: ✅ CORRECT - Browser client is appropriate
   - **Usage**: Client-side authentication and form handling

#### ❌ INCORRECT - Server-Side Files (15 files)

These files incorrectly use the browser Supabase client in server-side code:

##### API Routes (2 files)

1. **`app/api/team/route.ts`**
   - **Type**: Next.js API Route Handler
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: HTTP 500 errors when calling `/api/team`
   - **Lines Using supabase**: 18, 32

2. **`app/api/users/create/route.ts`**
   - **Type**: Next.js API Route Handler
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: User creation fails with HTTP 500
   - **Note**: This file already uses `createClient` from `@supabase/supabase-js` with service role, but also imports browser client

##### Server Utility Libraries (13 files)

3. **`lib/core/access.ts`**
   - **Type**: Server utility function
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Permission checks fail in server context

4. **`lib/core/users.ts`**
   - **Type**: Server utility functions
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: User management operations fail

5. **`lib/dashboard.ts`**
   - **Type**: Server utility function
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Dashboard data loading fails

6. **`lib/eggs.ts`**
   - **Type**: Server utility functions
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Egg production operations fail

7. **`lib/expenses.ts`**
   - **Type**: Server utility functions
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Expense operations fail

8. **`lib/farm.ts`**
   - **Type**: Server utility function
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Farm updates fail

9. **`lib/feed.ts`**
   - **Type**: Server utility functions
   - **Current Import**: `import { supabase } from "@/lib/supabase";`
   - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
   - **Status**: ❌ INCORRECT
   - **Impact**: Feed record operations fail

10. **`lib/feedInventory.ts`**
    - **Type**: Server utility functions
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Feed inventory operations fail

11. **`lib/flocks.ts`**
    - **Type**: Server utility functions
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Flock management operations fail

12. **`lib/health.ts`**
    - **Type**: Server utility functions
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Health record operations fail

13. **`lib/mortality.ts`**
    - **Type**: Server utility functions
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Mortality record operations fail

14. **`lib/onboarding.ts`**
    - **Type**: Server utility function
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Farm onboarding fails

15. **`lib/sales.ts`**
    - **Type**: Server utility functions
    - **Current Import**: `import { supabase } from "@/lib/supabase";`
    - **Should Use**: `supabaseAdmin` from `@/lib/supabase-admin`
    - **Status**: ❌ INCORRECT
    - **Impact**: Sales operations fail

##### Permission System (1 file - FIXED)

16. **`lib/permissions/api.ts`**
    - **Type**: Server utility for API routes
    - **Previous Import**: `import { supabase } from "@/lib/supabase";`
    - **Current Import**: `import { getAuthenticatedUser } from "@/lib/auth/server";`
    - **Status**: ✅ FIXED
    - **Note**: Now uses proper server authentication helper

17. **`lib/permissions/cache.ts`**
    - **Type**: Server utility for permission caching
    - **Previous Import**: `import { supabase } from "@/lib/supabase";`
    - **Current Import**: `import { supabaseAdmin } from "@/lib/supabase-admin";`
    - **Status**: ✅ FIXED
    - **Note**: Now uses admin client for database queries

## Root Cause

The root cause of the HTTP 500 error on `/team` was:

**File**: `lib/permissions/cache.ts` (line 8, 127)
**Problem**: Used browser Supabase client in `_fetchPermissionsFromDb()` which is called from server-side API routes
**Impact**: Browser client cannot function in server context, causing HTTP 500 errors

## Required Fixes

All 15 incorrect server-side files need to be updated:

### Pattern for Fix

**Before** (INCORRECT):
```typescript
import { supabase } from "@/lib/supabase";

export async function someFunction() {
  const { data, error } = await supabase
    .from("table_name")
    .select("*");
  // ...
}
```

**After** (CORRECT):
```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function someFunction() {
  const { data, error } = await supabaseAdmin
    .from("table_name")
    .select("*");
  // ...
}
```

### Files Requiring Changes

1. `app/api/team/route.ts` - Change line 4 import
2. `app/api/users/create/route.ts` - Change line 1 import (if using supabase directly)
3. `lib/core/access.ts` - Change line 1 import
4. `lib/core/users.ts` - Change line 1 import
5. `lib/dashboard.ts` - Change line 1 import
6. `lib/eggs.ts` - Change line 1 import
7. `lib/expenses.ts` - Change line 1 import
8. `lib/farm.ts` - Change line 1 import
9. `lib/feed.ts` - Change line 1 import
10. `lib/feedInventory.ts` - Change line 1 import
11. `lib/flocks.ts` - Change line 1 import
12. `lib/health.ts` - Change line 1 import
13. `lib/mortality.ts` - Change line 1 import
14. `lib/onboarding.ts` - Change line 1 import
15. `lib/sales.ts` - Change line 1 import
16. `lib/subscription.ts` - Change line 1 import (if found in search)

## Security Implications

### Current Issues

1. **Runtime Errors**: Browser client fails in server context, causing HTTP 500 errors
2. **Security Risk**: Browser client is not designed for server-side use
3. **Authentication Issues**: Browser client cannot properly authenticate server-side requests
4. **Service Role Exposure**: Risk of improper service role key usage

### After Fixes

1. ✅ All server-side code uses proper admin client
2. ✅ No browser client usage in server code
3. ✅ Proper authentication flow
4. ✅ Service role key only used in server context
5. ✅ HTTP status codes work correctly (401, 403, 200)

## Testing Requirements

After applying fixes, verify:

- [ ] `/api/team` GET returns 200 for authenticated owners
- [ ] `/api/team` GET returns 401 for unauthenticated requests
- [ ] `/api/team` POST returns 403 for users without permission
- [ ] `/api/team` POST returns 201 for authorized users
- [ ] All dashboard data loads correctly
- [ ] All CRUD operations work (flocks, eggs, expenses, etc.)
- [ ] User invitations work end-to-end
- [ ] Farm onboarding works

## Recommendations

1. **Immediate**: Fix all 15 incorrect files as outlined above
2. **Short-term**: Add ESLint rule to prevent browser client imports in server code
3. **Long-term**: 
   - Create separate directory structure: `lib/client/` vs `lib/server/`
   - Add TypeScript path mapping to enforce separation
   - Add CI/CD checks for architectural violations

## Files Already Correct

- `lib/auth/server.ts` - Uses supabaseAdmin ✅
- `lib/supabase-admin.ts` - Admin client definition ✅
- `lib/supabase.ts` - Browser client definition ✅
- `lib/permissions/cache.ts` - Fixed in this session ✅
- `lib/permissions/api.ts` - Fixed in this session ✅

## Summary

**Total Files Audited**: 17
**Correct (Client-side)**: 2
**Correct (Server-side)**: 4 (including 2 fixed in this session)
**Incorrect (Need Fixing)**: 15
**Fixed in This Session**: 2

The systematic use of the browser Supabase client in server-side code is a critical architectural issue that must be fixed across all 15 remaining files.