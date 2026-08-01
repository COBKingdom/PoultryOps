# Sprint 1 Phase 3.1 - Invitation System Refactor

## Overview

This document describes the refactoring of the Team Workspace invitation system to reuse the existing enterprise user creation workflow as the single source of truth.

## Architecture

### Backend Workflow

```
Owner clicks Send Invitation
        │
        ▼
Validate form (client-side)
        │
        ▼
POST /api/team
        │
        ▼
Check subscription limits
        │
        ▼
Generate temporary password
        │
        ▼
POST /api/users/create (single source of truth)
        │
        ▼
Create Supabase Auth user
        │
        ▼
Create profile (with must_change_password = true)
        │
        ▼
Create farm_users record
        │
        ▼
Assign role
        │
        ▼
Apply selected permissions into user_permissions
        │
        ▼
Create invitation record in user_invitations
        │
        ▼
Send invitation email with credentials
        │
        ▼
Return success + temporary password
        │
        ▼
Display password to owner (5 second timeout)
```

## Key Changes

### 1. Extended `/api/users/create` (Single Source of Truth)

**File**: `app/api/users/create/route.ts`

**New Parameters**:
- `role` (default: "data_entry") - User role
- `permissions` (default: []) - Array of permission codes
- `sendInvitation` (default: false) - Flag to send invitation email
- `invitedBy` - User ID of the inviter

**New Features**:
- Validates subscription limits before creating user
- Creates auth user with `email_confirm: true`
- Sets `must_change_password: true` on profile
- Creates farm_users record with role
- Assigns custom permissions to user_permissions
- Creates invitation record in user_invitations
- Sends invitation email with temporary password
- Returns success message with temporary password

### 2. Updated `/api/team` POST Endpoint

**File**: `app/api/team/route.ts`

**Changes**:
- Generates secure temporary password (8 chars: uppercase, lowercase, numbers, special)
- Calls `/api/users/create` internally instead of duplicating logic
- Passes all required parameters including permissions
- Returns temporary password to frontend for display
- Maintains permission check via `requirePermission(PERMISSIONS.TEAM_INVITE)`

### 3. Updated Email Template

**File**: `lib/email-templates.ts`

**Function**: `invitationEmailTemplate(farmName, role, temporaryPassword)`

**New Features**:
- Displays login URL (not join URL)
- Shows temporary password in monospace code block
- Includes email address
- Shows role
- **Important**: Displays warning about changing password on first login
- Professional styling with yellow warning banner

### 4. Updated Email Service

**File**: `lib/email-service.ts`

**Function**: `sendInvitationEmail(email, farmName, temporaryPassword, role)`

**Changes**:
- Replaces `{{email}}` placeholder with actual email
- Passes temporary password to template
- Sends credentials via email

### 5. Refactored InviteMemberDialog

**File**: `components/team/invite-member-dialog.tsx`

**Features**:
- Collects: Full Name, Email, Role, Permissions
- Validates required fields (name, email format)
- Shows loading state during submission
- **Bug Fix**: Form does NOT reset on validation failure
- **Bug Fix**: Dialog stays open on validation errors
- Displays success message with temporary password
- Shows password for 5 seconds before closing
- Copy button for password
- Resets form only after successful submission

**Success Message**:
```
Invitation sent successfully.

Temporary password has been assigned.
The new member can log in immediately using the credentials provided in the email.

[Copy button] [Password display]
```

### 6. Updated TeamCard to Load Real Data

**File**: `components/team/team-card.tsx`

**Changes**:
- Replaced mock data with actual API call to `/api/team`
- Loads real team members from database
- Displays actual owner information
- Shows accurate stats (total, managers, staff, active)

### 7. Database Migration

**File**: `supabase/migrations/003_add_must_change_password.sql`

**Changes**:
- Adds `must_change_password` column to `profiles` table
- Default value: `false`
- Indexed for efficient querying
- Comment explains purpose

## Database Tables Written To

1. **auth.users** - Created by Supabase Auth
2. **public.profiles** - User profile with must_change_password flag
3. **public.farm_users** - Farm membership with role
4. **public.user_permissions** - Custom permissions (if any)
5. **public.user_invitations** - Invitation record
6. **public.email_events** - Email audit log (optional)

## Validation

### Client-Side (InviteMemberDialog)
- Full Name: Required, non-empty
- Email: Required, valid email format
- Role: Required, must be valid role
- Permissions: Optional, defaults based on role

### Server-Side (/api/users/create)
- Email: Required
- Password: Required (temporary password)
- Full Name: Required
- Farm ID: Required
- Subscription limits: Checked before creation
- Duplicate emails: Handled by Supabase Auth

## Security Features

1. **Temporary Password**: 8-character secure password with mixed case, numbers, and special characters
2. **Must Change Password**: Flag set on profile to enforce password change on first login
3. **Email Confirmation**: User is automatically confirmed (`email_confirm: true`)
4. **Subscription Limits**: Prevents exceeding plan limits
5. **Permission Checks**: Requires `team.invite` permission

## Success Notification

The dialog displays:
```
✓ Invitation sent successfully.

Temporary password has been assigned.
The new member can log in immediately using the credentials provided in the email.

[Password display with copy button]
```

## Email Contents

The invitation email includes:
- Farm name
- User's role
- Email address
- Temporary password
- Login URL
- **Warning**: "Important: Change Your Password" banner
- Instructions to change password on first login

## Role Constants

All roles are defined in `lib/permissions/constants.ts`:
- `ROLES.OWNER` = "owner"
- `ROLES.MANAGER` = "manager"
- `ROLES.STAFF` = "staff"

System roles (from database):
- `SYSTEM_ROLES.MANAGER` = "manager"
- `SYSTEM_ROLES.STAFF` = "staff"

## Testing Checklist

- [ ] Owner can invite team member
- [ ] Form validates required fields
- [ ] Form does NOT reset on validation failure
- [ ] Dialog stays open on validation errors
- [ ] Loading state shows during submission
- [ ] Success message displays with password
- [ ] Password is visible for 5 seconds
- [ ] Copy button works
- [ ] Dialog closes after 5 seconds
- [ ] Team member appears in list
- [ ] Owner information loads from database
- [ ] Email is sent with credentials
- [ ] User can log in with temporary password
- [ ] User is forced to change password on first login
- [ ] Subscription limits are enforced
- [ ] Permissions are correctly assigned

## Migration Steps

1. Run database migration: `supabase/migrations/003_add_must_change_password.sql`
2. Deploy updated API routes
3. Deploy updated frontend components
4. Test invitation flow end-to-end

## Notes

- The `/api/users/create` endpoint is now the single source of truth for user creation
- All invitation logic flows through this endpoint
- The `/api/team` endpoint acts as a wrapper that adds permission checks and generates passwords
- The temporary password is returned to the frontend for display but is also sent via email
- The `must_change_password` flag should be checked on login to enforce password change